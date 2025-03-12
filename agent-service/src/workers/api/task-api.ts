// API functions for communicating with the server
import axios from "axios";
import { Step } from "../types";

// API configuration
const API_KEY = process.env.API_KEY || "orchestrator-api-key-12345";
const SERVER_URL = process.env.SERVER_URL || "http://localhost:4000";

/**
 * Add a step to a task via the server API
 */
export async function addStepToTask(taskId: string, step: Step): Promise<any> {
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

    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Update task status
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
    return response.status === 200;
  } catch (error) {
    return false;
  }
}
