// Worker thread for processing tasks
// prevents TS errors
declare var self: Worker;

import axios from "axios";
import { validateTask, TaskData } from "../ai/task-validation";

// Step interface
interface Step {
  name: string;
  data: any;
}

// API configuration
const API_KEY = process.env.API_KEY || "orchestrator-api-key-12345";
const SERVER_URL = process.env.SERVER_URL || "http://localhost:4000";

/**
 * Add a step to a task via the server API
 */
async function addStepToTask(taskId: string, step: Step): Promise<any> {
  try {
    const response = await axios.post(
      `${SERVER_URL}/programmatic/tasks/${taskId}/steps`,
      step,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Update task validation status in the database
 */
async function updateTaskValidation(
  taskId: string,
  isTaskValid: boolean,
  reason: string,
): Promise<boolean> {
  try {
    const response = await axios.patch(
      `${SERVER_URL}/programmatic/tasks/${taskId}`,
      {
        isTaskValid: isTaskValid,
        reason: reason,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
      },
    );

    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Update task status
 */
async function updateTaskStatus(
  taskId: string,
  status: string,
): Promise<boolean> {
  try {
    const response = await axios.patch(
      `${SERVER_URL}/programmatic/tasks/${taskId}/status`,
      {
        status: status,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
      },
    );
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Process a task by adding steps at intervals
 */
async function processTask(task: TaskData): Promise<void> {
  // First validate the task using AI
  const validation = await validateTask(task);

  // Update task validation status in the database
  const updateSuccess = await updateTaskValidation(
    task.id,
    validation.isTaskValid,
    validation.reason,
  );

  // Log the result of updating task status
  if (updateSuccess) {
    console.log(`Successfully updated task ${task.id} validation status`);
  } else {
    console.log(`Failed to update task ${task.id} validation status`);
  }

  // Add a validation step to the task
  await addStepToTask(task.id, {
    name: "Task Validation",
    data: JSON.stringify({
      timestamp: new Date().toISOString(),
      validation: validation,
      message: validation.isTaskValid
        ? "Task validated successfully"
        : "Task validation failed",
    }),
  });

  // If task is not valid, stop processing
  if (!validation.isTaskValid) {
    return;
  }

  // Add 5 steps, one every 2 seconds
  const totalSteps = 5;

  for (let i = 1; i <= totalSteps; i++) {
    try {
      // Create step data
      const step: Step = {
        name: `Auto-generated step ${i}`,
        data: JSON.stringify({
          timestamp: new Date().toISOString(),
          message: `This is step ${i} of ${totalSteps} for task ${task.name}`,
          taskInfo: {
            id: task.id,
            name: task.name,
            step: i,
          },
        }),
      };

      // Add step to task
      await addStepToTask(task.id, step);

      // Wait 2 seconds before adding the next step (except for the last one)
      if (i < totalSteps) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      // Error is handled silently
    }
  }

  const successStep = {
    name: "Task Completed",
    data: JSON.stringify({
      timestamp: new Date().toISOString(),
      message: `Task ${task.name} completed successfully`,
      taskInfo: {
        id: task.id,
        name: task.name,
        step: totalSteps + 1,
      },
    }),
  };

  // Add completion step to task
  await addStepToTask(task.id, successStep);

  // Update task status to COMPLETE
  await updateTaskStatus(task.id, "COMPLETE");
}

// Listen for messages from the main thread
self.onmessage = async (event: MessageEvent) => {
  const taskData: TaskData = event.data;

  if (!taskData || !taskData.id) {
    self.postMessage({ error: "Invalid task data" });
    return;
  }

  try {
    // Process the task
    await processTask(taskData);

    // Send completion message back to main thread
    self.postMessage({
      status: "completed",
      taskId: taskData.id,
      message: `Successfully processed task ${taskData.id}`,
    });
  } catch (error) {
    self.postMessage({
      status: "error",
      taskId: taskData.id,
      error: `Failed to process task: ${error}`,
    });
  }
};
