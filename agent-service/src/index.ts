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

// CORS middleware - implemented inline to avoid type issues
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:4000");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  next();
});

const activeWorkers = new Map<string, child_process.ChildProcess>();

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
        env: process.env
      }
    );

    // Store the process in our active workers map
    activeWorkers.set(taskData.id, taskProcess);

    // Handle messages from the child process
    taskProcess.on("message", (data: any) => {
      console.log(`Worker message for task ${taskData.id}:`, data);

      if (data && (data.status === "completed" || data.status === "error")) {
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

    return res.json({ message: "Task processing started", taskId: taskData.id });
  } catch (error) {
    console.error("Error processing task:", error);
    return res.status(500).json({ error: "Failed to process task" });
  }
});

// Status endpoint
app.get("/status", (req: Request, res: Response) => {
  const activeTaskIds = Array.from(activeWorkers.keys());
  res.json({ activeWorkers: activeTaskIds.length, tasks: activeTaskIds });
});

// Start the server
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 6000;

console.log(`Starting server on port ${PORT}...`);
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export for testing
export default app;
