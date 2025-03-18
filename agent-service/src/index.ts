import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import * as path from "path";
import { fileURLToPath } from "url";
import { TaskData } from "./ai/task-validation";
import * as fs from "fs";
import * as child_process from "child_process";

// Get the current directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the express app
const app: express.Application = express();

// Middleware for parsing JSON
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = ["http://localhost:4000", "http://localhost:3000"];
  const origin = req.headers.origin as string;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-api-key",
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  next();
});

const activeWorkers = new Map<string, child_process.ChildProcess>();

// New data structure to track SSE clients for each task
interface SSEClient {
  res: express.Response;
  lastEventId?: string;
}

const taskClients: Record<string, SSEClient[]> = {};
(global as any).taskClients = taskClients;

// Function to add an event to the buffer
const taskEventBuffers: Record<
  string,
  Array<{ id: string; data: string }>
> = {};
const MAX_BUFFER_SIZE = 100; // Maximum number of events to keep per task

function addEventToBuffer(taskId: string, eventData: any) {
  if (!taskEventBuffers[taskId]) {
    taskEventBuffers[taskId] = [];
  }

  const eventId = Date.now().toString();
  taskEventBuffers[taskId].push({
    id: eventId,
    data: JSON.stringify(eventData),
  });

  // Keep buffer size limited
  if (taskEventBuffers[taskId].length > MAX_BUFFER_SIZE) {
    taskEventBuffers[taskId].shift();
  }

  return eventId;
}

// Function to broadcast events to all SSE clients for a task
function broadcastEventToTaskClients(taskId: string, eventData: any) {
  if (taskClients[taskId]) {
    const eventId = addEventToBuffer(taskId, eventData);

    taskClients[taskId].forEach((client) => {
      client.res.write(`id: ${eventId}\n`);
      client.res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    });
  }
}

// Health endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Task processing endpoint
app.post("/tasks", (req: any, res: any) => {
  try {
    const taskData = req.body as TaskData;

    if (!taskData?.id) {
      return res.status(400).json({ error: "Invalid task data" });
    }

    console.log(`Received task: ${taskData.id} - ${taskData.name}`);

    if (activeWorkers.has(taskData.id)) {
      return res.json({
        message: "Task is already being processed",
        taskId: taskData.id,
      });
    }

    // Use the new worker-entry.ts as the clean entry point for our child process
    // This lightweight entry point delegates to the properly modularized components
    const taskProcess = child_process.fork(
      path.resolve(__dirname, "workers/worker-entry.ts"),
      [], // args
      {
        execPath: path.resolve(process.cwd(), "node_modules/.bin/tsx"),
        env: process.env,
      },
    );

    // Store the process in our active workers map
    activeWorkers.set(taskData.id, taskProcess);

    // Handle messages from the child process
    taskProcess.on("message", (data: any) => {
      console.log(`Worker message for task ${taskData.id}:`, data);

      // Broadcast the message to SSE clients
      broadcastEventToTaskClients(taskData.id, data);

      if (data && (data.status === "completed" || data.status === "error")) {
        // Close all SSE connections for this task
        if (taskClients[taskData.id]) {
          taskClients[taskData.id].forEach((client) => {
            // Send final message
            client.res.write(
              `data: ${JSON.stringify({
                type: "complete",
                status: data.status,
                message:
                  data.status === "completed"
                    ? "Task completed successfully"
                    : `Task failed: ${data.error || "Unknown error"}`,
                timestamp: new Date().toISOString(),
              })}\n\n`,
            );
            // End the response
            client.res.end();
          });
          delete taskClients[taskData.id];
        }

        activeWorkers.delete(taskData.id);
        taskProcess.kill();
      }
    });

    // Handle errors from the child process
    taskProcess.on("error", (error) => {
      console.error(
        `Worker for task ${taskData.id} encountered an error:`,
        error,
      );
      activeWorkers.delete(taskData.id);
      taskProcess.kill();
    });

    // Handle exit of the child process
    taskProcess.on("exit", (code) => {
      console.log(`Worker for task ${taskData.id} exited with code ${code}`);
      activeWorkers.delete(taskData.id);
    });

    // Send the task data to the child process
    taskProcess.send(taskData);

    return res.json({
      message: "Task processing started",
      taskId: taskData.id,
    });
  } catch (error) {
    console.error("Error processing task:", error);
    return res.status(500).json({ error: "Failed to process task" });
  }
});

// SSE endpoint for task updates
app.get("/task/:taskId/sse", (req: Request, res: Response) => {
  const taskId = req.params.taskId;

  // Set headers for SSE
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Send initial message
  res.write(
    `data: ${JSON.stringify({
      type: "connection",
      message: "Connected to task updates",
    })}\n\n`,
  );

  // Add this client to the task's client list
  if (!taskClients[taskId]) {
    taskClients[taskId] = [];
  }

  const client: SSEClient = { res };
  taskClients[taskId].push(client);

  // Keep-alive interval
  const keepAliveInterval = setInterval(() => {
    res.write(": keep-alive\n\n");
  }, 30000);

  // Handle client disconnect
  req.on("close", () => {
    clearInterval(keepAliveInterval);

    if (taskClients[taskId]) {
      taskClients[taskId] = taskClients[taskId].filter((c) => c !== client);

      // Clean up empty task entries
      if (taskClients[taskId].length === 0) {
        delete taskClients[taskId];
      }
    }
  });

  // Check for Last-Event-ID header to support reconnection
  const lastEventId = req.headers["last-event-id"] as string;
  client.lastEventId = lastEventId;

  // If client has a last event ID and we have buffered events, send missed events
  if (lastEventId && taskEventBuffers[taskId]) {
    const lastIdIndex = taskEventBuffers[taskId].findIndex(
      (e) => e.id === lastEventId,
    );
    if (lastIdIndex >= 0 && lastIdIndex < taskEventBuffers[taskId].length - 1) {
      // Send all events after the last received one
      for (let i = lastIdIndex + 1; i < taskEventBuffers[taskId].length; i++) {
        const event = taskEventBuffers[taskId][i];
        res.write(`id: ${event.id}\n`);
        res.write(`data: ${event.data}\n\n`);
      }
    }
  }
});

// Status endpoint
app.get("/status", (req: Request, res: Response) => {
  const activeTaskIds = Array.from(activeWorkers.keys());
  res.json({ activeWorkers: activeTaskIds.length, tasks: activeTaskIds });
});

// Start the server
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;

console.log(`Starting server on port ${PORT}...`);
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export for testing
export default app;
