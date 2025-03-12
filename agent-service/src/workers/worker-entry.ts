// Clean worker entry point for task processing
// This is a lightweight entry point that delegates to the modular components

import { TaskData } from "../ai/task-validation";
import { processTask } from "./processor/task-processor";
import { WorkerMessage } from "./types";

/**
 * Main worker process that listens for messages from the parent process
 * and delegates to the task processor
 */

// Listen for messages from the parent process
process.on("message", (task: TaskData) => {
  if (!task || !task.id) {
    console.error("Invalid task data received");
    if (process.send) {
      process.send({
        status: "error",
        error: "Invalid task data",
      } as WorkerMessage);
    }
    return;
  }

  console.log(`Worker received task: ${task.id}`);

  processTask(task).catch((error) => {
    console.error(`Failed to process task ${task.id}:`, error);
    if (process.send) {
      process.send({
        status: "error",
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error),
      } as WorkerMessage);
    }
  });
});

// Send a message to the parent process that we're ready
if (process.send) {
  process.send({ status: "ready" } as WorkerMessage);
}
