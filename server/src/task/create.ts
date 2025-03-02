import { Context } from 'hono';
import { createBrowserbaseSession, getBrowserbaseReplayUrl } from '../browser/session';
import { mapBrowserSessionToFields } from '../utils/browser';
import { taskQueries } from '../database/task-queries';
import { sendTaskToAgentService } from '../utils/agent';

// Create task handler
export async function createTaskHandler(c: Context) {
  try {
    const user = c.get('user');
    const { name } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Task name is required' }, 400);
    }

    // Create a browser session
    const browserSession = await createBrowserbaseSession();
    const browserFields = mapBrowserSessionToFields(browserSession);
    
    // Create task and get its ID
    const taskId = await taskQueries.createTask(user.userId, name, browserFields);
    
    // Get the complete task data
    const taskData = await taskQueries.getTaskById(taskId, user.userId);
    
    // Send task data to agent service (don't await to avoid blocking)
    sendTaskToAgentService(taskData).catch(err => {
      console.error('Failed to send task to agent service:', err);
    });
    
    // Return the created task with browser session data
    return c.json({
      id: taskId,
      name,
      created_at: new Date().toISOString(),
      browser_session_id: browserFields.browser_session_id,
      browser_connect_url: browserFields.browser_connect_url,
      browser_status: browserFields.browser_status,
      browser_replay_url: getBrowserbaseReplayUrl(browserFields.browser_session_id)
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return c.json({ error: 'Failed to create task' }, 500);
  }
}
