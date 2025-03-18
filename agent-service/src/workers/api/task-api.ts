import axios from "axios";
import { Step } from "../types";
// crypto
import { randomUUID } from "crypto";

// API configuration
const API_KEY = process.env.API_KEY || "orchestrator-api-key-12345";
const SERVER_URL = process.env.SERVER_URL || "http://localhost:4000";

/**
 * Add a step to a task via the server API and broadcast via SSE
 */
export async function addStepToTask(taskId: string, step: Step): Promise<any> {
  try {
    // Send to the database via API
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

    // Also send to the parent process for SSE broadcast
    if (process.send) {
      process.send({
        type: "step",
        taskId,
        // Include all necessary fields the client expects
        step: {
          id: randomUUID(),
          name: step.name,
          data: step.data,
          created_at: new Date().toISOString(),
          task_id: taskId,
        },
      });
    }

    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Update task validation status in the database and broadcast via SSE
 */
export async function updateTaskValidation(
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

    // Also send to the parent process for SSE broadcast
    if (process.send) {
      process.send({
        type: "validation",
        taskId,
        isTaskValid,
        reason,
      });
    }

    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Update task status and broadcast via SSE
 */
export async function updateTaskStatus(
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

    // Also send to the parent process for SSE broadcast
    if (process.send) {
      process.send({
        type: "status",
        taskId,
        status,
      });
    }

    return response.status === 200;
  } catch (error) {
    return false;
  }
}
