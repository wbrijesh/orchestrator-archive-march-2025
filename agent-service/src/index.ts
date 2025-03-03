import { Hono } from 'hono';
import 'dotenv/config';

const app = new Hono();

// Configure simple CORS
app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', 'http://localhost:4000');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  c.header('Access-Control-Allow-Credentials', 'true');
  
  if (c.req.method === 'OPTIONS') {
    return c.text('');
  }
  
  await next();
});

const activeWorkers = new Map<string, Worker>();

app.get('/health', (c) => c.json({ status: 'ok' }));

app.post('/tasks', async (c) => {
  try {
    const taskData = await c.req.json();
    
    if (!taskData?.id) {
      return c.json({ error: 'Invalid task data' }, 400);
    }
    
    console.log(`Received task: ${taskData.id} - ${taskData.name}`);
    
    if (activeWorkers.has(taskData.id)) {
      return c.json({ message: 'Task is already being processed', taskId: taskData.id });
    }
    
    const worker = new Worker("src/workers/task-worker.ts");
    
    activeWorkers.set(taskData.id, worker);
    
    // Use the correct type for the message event
    worker.onmessage = (event: MessageEvent) => {
      console.log(`Worker message for task ${taskData.id}:`, event.data);
      
      if (event.data.status === 'completed' || event.data.status === 'error') {
        activeWorkers.delete(taskData.id);
      }
    };
    
    // Use the correct error event handler
    worker.onerror = (event: ErrorEvent) => {
      console.error(`Worker for task ${taskData.id} encountered an error:`, event);
      activeWorkers.delete(taskData.id);
    };
    
    worker.postMessage(taskData);
    
    return c.json({ message: 'Task processing started', taskId: taskData.id });
  } catch (error) {
    console.error('Error processing task:', error);
    return c.json({ error: 'Failed to process task' }, 500);
  }
});

app.get('/status', (c) => {
  const activeTaskIds = Array.from(activeWorkers.keys());
  return c.json({ activeWorkers: activeTaskIds.length, tasks: activeTaskIds });
});

export default {
  port: 6000, 
  fetch: app.fetch,
};
