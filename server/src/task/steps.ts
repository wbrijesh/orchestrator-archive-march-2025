import { Context } from 'hono';
import { taskQueries, stepQueries } from '../database/task-queries';
import { posthogClient } from '../index';
import crypto from 'crypto';

// Common function to check if user has access to a task
async function checkTaskAccess(taskId: string, user?: any): Promise<boolean> {
  // If user is provided, verify ownership
  if (user) {
    return await taskQueries.verifyTaskOwnership(taskId, user.userId);
  } 
  // Otherwise just check if task exists (programmatic access)
  else {
    return await taskQueries.taskExists(taskId);
  }
}

// Get steps for task handler (works with both user auth and programmatic access)
export async function getStepsForTaskHandler(c: Context) {
  try {
    const taskId = c.req.param('taskId');
    const user = c.get('user');
    
    // Check access based on whether it's a user or programmatic request
    const hasAccess = await checkTaskAccess(taskId, user);
    if (!hasAccess) {
      return c.json({ error: 'Task not found or unauthorized' }, 404);
    }

    // Get steps for task
    const steps = await stepQueries.getStepsForTask(taskId);

    // Track steps fetched event
    posthogClient.capture({
      distinctId: crypto.randomUUID(),
      event: 'steps_fetched',
      properties: {
        task_id: taskId,
        user_id: user?.userId,
        step_count: steps.length.toString(),
        timestamp: new Date().toISOString()
      }
    });

    return c.json(steps);
  } catch (error) {
    console.error('Error fetching steps:', error);
    return c.json({ error: 'Failed to fetch steps' }, 500);
  }
}

// Create step programmatic handler (no user authentication required)
export async function createStepProgrammaticHandler(c: Context) {
  try {
    const taskId = c.req.param('taskId');
    const { name, data } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Step name is required' }, 400);
    }

    // Check access based on whether it's a user or programmatic request
    const hasAccess = await checkTaskAccess(taskId);
    if (!hasAccess) {
      return c.json({ error: 'Task not found' }, 404);
    }

    // Get next sequence number and create step
    const nextSequence = await stepQueries.getNextSequence(taskId);
    // Ensure sequence is a number
    const sequence = typeof nextSequence === 'number' ? nextSequence : 1;
    const step = await stepQueries.createStep(taskId, sequence, name, data);

    // Track step created event
    posthogClient.capture({
      distinctId: crypto.randomUUID(),
      event: 'step_created',
      properties: {
        task_id: taskId,
        step_name: name,
        timestamp: new Date().toISOString()
      }
    });

    return c.json(step);
  } catch (error) {
    console.error('Error creating step programmatically:', error);
    return c.json({ error: 'Failed to create step' }, 500);
  }
}
