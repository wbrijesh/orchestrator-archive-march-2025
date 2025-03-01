import { Context } from 'hono';
import { taskQueries, stepQueries } from '../database/task-queries';

// Create step handler
export async function createStepHandler(c: Context) {
  try {
    const user = c.get('user');
    const taskId = c.req.param('taskId');
    const { name, data } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Step name is required' }, 400);
    }

    // Verify task belongs to user
    const isOwner = await taskQueries.verifyTaskOwnership(taskId, user.userId);
    if (!isOwner) {
      return c.json({ error: 'Task not found or unauthorized' }, 404);
    }

    // Get next sequence number and create step
    const nextSequence = await stepQueries.getNextSequence(taskId);
    // Ensure sequence is a number
    const sequence = typeof nextSequence === 'number' ? nextSequence : 1;
    const step = await stepQueries.createStep(taskId, sequence, name, data);

    return c.json(step);
  } catch (error) {
    console.error('Error creating step:', error);
    return c.json({ error: 'Failed to create step' }, 500);
  }
}

// Get steps for task handler
export async function getStepsForTaskHandler(c: Context) {
  try {
    const user = c.get('user');
    const taskId = c.req.param('taskId');

    // Verify task belongs to user
    const isOwner = await taskQueries.verifyTaskOwnership(taskId, user.userId);
    if (!isOwner) {
      return c.json({ error: 'Task not found or unauthorized' }, 404);
    }

    // Get steps for task
    const steps = await stepQueries.getStepsForTask(taskId);

    return c.json(steps);
  } catch (error) {
    console.error('Error fetching steps:', error);
    return c.json({ error: 'Failed to fetch steps' }, 500);
  }
}
