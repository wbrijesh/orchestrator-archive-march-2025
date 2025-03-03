import { Context } from 'hono';
import { taskQueries } from '../database/task-queries';
import { db } from '../database/client';

/**
 * Handler for programmatic task updates (without user authentication)
 * @param c Hono context
 * @returns JSON response
 */
export async function updateTaskHandler(c: Context) {
  try {
    const taskId = c.req.param('taskId');
    const { isTaskValid, reason, browser_ended_at } = await c.req.json();
    
    // Validate required fields
    if (isTaskValid === undefined) {
      return c.json({ error: 'isTaskValid field is required' }, 400);
    }
    
    // Check if task exists (without user verification)
    const taskExists = await taskQueries.taskExists(taskId);
    if (!taskExists) {
      return c.json({ error: 'Task not found' }, 404);
    }
    
    // For programmatic updates, we need to get the user_id from the task
    const taskInfo = await db.execute({
      sql: 'SELECT user_id FROM tasks WHERE id = ?',
      args: [taskId]
    });
    
    if (taskInfo.rows.length === 0) {
      return c.json({ error: 'Task not found' }, 404);
    }
    
    // Ensure userId is a number
    const userId = Number(taskInfo.rows[0].user_id);
    
    if (isNaN(userId)) {
      return c.json({ error: 'Invalid user ID associated with task' }, 500);
    }
    
    // Update the task
    const updateData = {
      isTaskValid: isTaskValid.toString(), // Ensure it's a string for TEXT field
      reason: reason || '',                // Default to empty string if not provided
      browser_ended_at: browser_ended_at || new Date().toISOString() // Default to current time if not provided
    };
    
    const rowsAffected = await taskQueries.updateTask(
      taskId, 
      userId, 
      updateData
    );
    
    if (rowsAffected === 0) {
      return c.json({ error: 'Failed to update task' }, 500);
    }
    
    // Get the updated task data
    const updatedTask = await taskQueries.getTaskById(taskId, userId);
    
    return c.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error updating task programmatically:', error);
    return c.json({ error: 'Failed to update task' }, 500);
  }
}
