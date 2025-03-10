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
};

export const stepQueries = {
  /**
   * Get the next sequence number for steps in a task
   * @returns {Promise<number>} The next sequence number
   */
  getNextSequence: async (taskId: string): Promise<number> => {
    const result = await db.execute({
      sql: `SELECT MAX(sequence) as max_sequence FROM steps WHERE task_id = ?`,
      args: [taskId],
    });

    // Handle potential null value from MAX function
    const maxSequence = result.rows[0]?.max_sequence;
    // Convert to number or use 0 if null/undefined
    return typeof maxSequence === "number" ? maxSequence + 1 : 1;
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
    await db.execute({
      sql: "INSERT INTO steps (id, task_id, sequence, name, data) VALUES (?, ?, ?, ?, ?)",
      args: [stepId, taskId, sequence, name, data],
    });

    return {
      id: stepId,
      task_id: taskId,
      sequence,
      name,
      data,
      created_at: new Date().toISOString(),
    };
  },

  /**
   * Get all steps for a task
   */
  getStepsForTask: async (taskId: string) => {
    const steps = await db.execute({
      sql: "SELECT * FROM steps WHERE task_id = ? ORDER BY sequence",
      args: [taskId],
    });

    return steps.rows;
  },
};
