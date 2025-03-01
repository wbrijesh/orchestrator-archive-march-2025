import { Context } from 'hono';
import { taskQueries } from '../database/task-queries';

// Delete task handler
export async function deleteTaskHandler(c: Context) {
  try {
    const user = c.get('user');
    const taskId = c.req.param('id');

    // Delete task
    const rowsAffected = await taskQueries.deleteTask(taskId, user.userId);

    if (rowsAffected === 0) {
      return c.json({ error: 'Task not found or unauthorized' }, 404);
    }

    return c.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return c.json({ error: 'Failed to delete task' }, 500);
  }
}
