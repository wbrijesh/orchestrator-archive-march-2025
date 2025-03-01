import { db } from './client';
import { randomUUID } from 'crypto';

// Define types for browser fields
type BrowserFields = {
  browser_session_id: string;
  browser_created_at: string;
  browser_updated_at: string;
  browser_project_id: string;
  browser_started_at: string;
  browser_ended_at: string;
  browser_expires_at: string;
  browser_status: string;
  browser_proxy_bytes: number;
  browser_avg_cpu_usage: number;
  browser_memory_usage: number;
  browser_keep_alive: number;
  browser_context_id: string;
  browser_region: string;
  browser_connect_url: string;
  browser_selenium_remote_url: string;
  browser_signing_key: string;
};

export const taskQueries = {
  /**
   * Create a new task in the database
   */
  createTask: async (userId: number, name: string, browserFields: Partial<BrowserFields>) => {
    const taskId = randomUUID();
    
    // Create an array of values ensuring they're all valid SQL parameter types
    const browserValues = Object.values(browserFields).map(value => 
      // Convert null or undefined to empty string for SQL compatibility
      value === null || value === undefined ? '' : value
    );
    
    await db.execute({
      sql: `INSERT INTO tasks (
        id, user_id, name, 
        browser_session_id, browser_created_at, browser_updated_at, 
        browser_project_id, browser_started_at, browser_ended_at, 
        browser_expires_at, browser_status, browser_proxy_bytes, 
        browser_avg_cpu_usage, browser_memory_usage, browser_keep_alive, 
        browser_context_id, browser_region, browser_connect_url, 
        browser_selenium_remote_url, browser_signing_key
      ) VALUES (
        ?, ?, ?, 
        ?, ?, ?, 
        ?, ?, ?, 
        ?, ?, ?, 
        ?, ?, ?, 
        ?, ?, ?, 
        ?, ?
      )`,
      args: [
        taskId, userId, name,
        ...browserValues
      ]
    });
    
    return taskId;
  },
  
  /**
   * Get a task by ID and ensure it belongs to the specified user
   */
  getTaskById: async (taskId: string, userId: number) => {
    const result = await db.execute({
      sql: `SELECT id, name, created_at, 
        browser_session_id, browser_created_at, browser_updated_at, 
        browser_project_id, browser_started_at, browser_ended_at, 
        browser_expires_at, browser_status, browser_proxy_bytes, 
        browser_avg_cpu_usage, browser_memory_usage, browser_keep_alive, 
        browser_context_id, browser_region, browser_connect_url, 
        browser_selenium_remote_url, browser_signing_key
      FROM tasks 
      WHERE id = ? AND user_id = ?`,
      args: [taskId, userId]
    });
    
    return result.rows.length > 0 ? result.rows[0] : null;
  },
  
  /**
   * Get all tasks for a user
   */
  getAllTasks: async (userId: number) => {
    const tasks = await db.execute({
      sql: `SELECT id, name, created_at, 
        browser_session_id, browser_status, browser_connect_url 
      FROM tasks 
      WHERE user_id = ? 
      ORDER BY created_at DESC`,
      args: [userId]
    });
    
    return tasks.rows;
  },
  
  /**
   * Delete a task by ID and ensure it belongs to the specified user
   */
  deleteTask: async (taskId: string, userId: number) => {
    const result = await db.execute({
      sql: 'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      args: [taskId, userId]
    });
    
    return result.rowsAffected;
  },
  
  /**
   * Verify if a task belongs to a user
   */
  verifyTaskOwnership: async (taskId: string, userId: number) => {
    const task = await db.execute({
      sql: 'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
      args: [taskId, userId]
    });
    
    return task.rows.length > 0;
  }
};

export const stepQueries = {
  /**
   * Get the next sequence number for steps in a task
   * @returns {Promise<number>} The next sequence number
   */
  getNextSequence: async (taskId: string): Promise<number> => {
    const result = await db.execute({
      sql: `SELECT MAX(sequence) as max_sequence FROM steps WHERE task_id = ?`,
      args: [taskId]
    });
    
    // Handle potential null value from MAX function
    const maxSequence = result.rows[0]?.max_sequence;
    // Convert to number or use 0 if null/undefined
    return typeof maxSequence === 'number' ? maxSequence + 1 : 1;
  },
  
  /**
   * Create a new step for a task
   */
  createStep: async (taskId: string, sequence: number, name: string, data: any) => {
    const stepId = randomUUID();
    await db.execute({
      sql: 'INSERT INTO steps (id, task_id, sequence, name, data) VALUES (?, ?, ?, ?, ?)',
      args: [stepId, taskId, sequence, name, data]
    });
    
    return {
      id: stepId,
      task_id: taskId,
      sequence,
      name,
      data,
      created_at: new Date().toISOString()
    };
  },
  
  /**
   * Get all steps for a task
   */
  getStepsForTask: async (taskId: string) => {
    const steps = await db.execute({
      sql: 'SELECT id, sequence, name, data, created_at FROM steps WHERE task_id = ? ORDER BY sequence',
      args: [taskId]
    });
    
    return steps.rows;
  }
};
