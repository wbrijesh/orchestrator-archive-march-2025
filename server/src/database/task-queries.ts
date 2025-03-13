import { db } from "./client";
import { randomUUID } from "crypto";

export const taskQueries = {
  /**
   * Create a new task in the database
   */
  createTask: async (userId: number, name: string) => {
    const taskId = randomUUID();

    await db.execute({
      sql: `INSERT INTO tasks (id, user_id, name)
      VALUES (?, ?, ?)`,
      args: [taskId, userId, name],
    });

    return taskId;
  },

  /**
   * Get a task by ID and ensure it belongs to the specified user
   */
  getTaskById: async (taskId: string, userId: number) => {
    const result = await db.execute({
      sql: `SELECT * FROM tasks WHERE id = ? AND user_id = ?`,
      args: [taskId, userId],
    });

    return result.rows.length > 0 ? result.rows[0] : null;
  },

  /**
   * Get all tasks for a user
   */
  getAllTasks: async (userId: number) => {
    const tasks = await db.execute({
      sql: `SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC`,
      args: [userId],
    });

    return tasks.rows;
  },

  /**
   * Delete a task by ID and ensure it belongs to the specified user
   */
  deleteTask: async (taskId: string, userId: number) => {
    const result = await db.execute({
      sql: "DELETE FROM tasks WHERE id = ? AND user_id = ?",
      args: [taskId, userId],
    });

    return result.rowsAffected;
  },

  /**
   * Verify if a task belongs to a user
   */
  verifyTaskOwnership: async (taskId: string, userId: number) => {
    const task = await db.execute({
      sql: "SELECT id FROM tasks WHERE id = ? AND user_id = ?",
      args: [taskId, userId],
    });

    return task.rows.length > 0;
  },

  /**
   * Check if a task exists (without user verification)
   */
  taskExists: async (taskId: string) => {
    const task = await db.execute({
      sql: "SELECT id FROM tasks WHERE id = ?",
      args: [taskId],
    });

    return task.rows.length > 0;
  },

  /**
   * Update task fields: isTaskValid and reason
   * @param taskId The ID of the task to update
   * @param userId The ID of the user who owns the task
   * @param updateData Object containing fields to update: isTaskValid and reason
   * @returns The number of rows affected
   */
  updateTask: async (
    taskId: string,
    userId: number,
    updateData: {
      isTaskValid: string;
      reason: string;
    },
  ) => {
    const result = await db.execute({
      sql: `UPDATE tasks
            SET isTaskValid = ?,
                reason = ?
            WHERE id = ? AND user_id = ?`,
      args: [updateData.isTaskValid, updateData.reason, taskId, userId],
    });

    return result.rowsAffected;
  },

  updateTaskStatus: async (taskId: string, userId: number, status: string) => {
    const result = await db.execute({
      sql: `UPDATE tasks
            SET status = ?
            WHERE id = ? AND user_id = ?`,
      args: [status, taskId, userId],
    });

    return result.rowsAffected;
  },

  updateTaskBrowserSession: async (
    taskId: string,
    userId: number,
    browserSessionFields: {
      browser_session_id: string;
      browser_connect_url: string;
      live_view_url?: string;
    },
  ) => {
    // Validate that all browser session fields are provided
    const requiredFields = [
      "browser_session_id",
      "browser_connect_url",
    ];

    for (const field of requiredFields) {
      if (
        browserSessionFields[field as keyof typeof browserSessionFields] ===
        undefined
      ) {
        throw new Error(`Missing required browser session field: ${field}`);
      }
    }

    const result = await db.execute({
      sql: `UPDATE tasks
            SET browser_session_id = ?,
                browser_connect_url = ?,
                live_view_url = ?
            WHERE id = ? AND user_id = ?`,
      args: [
        browserSessionFields.browser_session_id,
        browserSessionFields.browser_connect_url,
        browserSessionFields.live_view_url || null,
        taskId,
        userId,
      ],
    });

    return result.rowsAffected;
  },
};

export const stepQueries = {
  /**
   * Get the next sequence number for steps in a task
   * @returns {Promise<number>} The next sequence number
   */
  getNextSequence: async (taskId: string) => {
    const result = await db.execute({
      sql: `SELECT MAX(sequence) as maxSequence FROM steps WHERE task_id = ?`,
      args: [taskId],
    });

    // If there are no steps yet, start with 1
    const maxSequence = result.rows[0].maxSequence;
    return maxSequence ? Number(maxSequence) + 1 : 1;
  },

  /**
   * Create a new step for a task
   */
  createStep: async (
    taskId: string,
    sequence: number,
    name: string,
    data: any,
  ) => {
    const stepId = randomUUID();
    const dataString = data ? JSON.stringify(data) : null;

    await db.execute({
      sql: `INSERT INTO steps (id, task_id, sequence, name, data)
      VALUES (?, ?, ?, ?, ?)`,
      args: [stepId, taskId, sequence, name, dataString],
    });

    return stepId;
  },

  /**
   * Get all steps for a task
   */
  getStepsForTask: async (taskId: string) => {
    const steps = await db.execute({
      sql: `SELECT * FROM steps WHERE task_id = ? ORDER BY sequence ASC`,
      args: [taskId],
    });

    return steps.rows;
  },
};
