import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth';
import { initDb } from './database/init';

// User handlers
import { registerHandler, loginHandler } from './user/auth';
import { getUserDataHandler } from './user/user';

// Task handlers
import { createTaskHandler } from './task/create';
import { getTaskByIdHandler, getAllTasksHandler } from './task/get';
import { deleteTaskHandler } from './task/delete';
import { createStepHandler, getStepsForTaskHandler } from './task/steps';

dotenv.config();

// Initialize database tables
initDb().catch(console.error);

const app = new Hono();

// Configure CORS
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true,
}));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// Hello world route
app.get('/', (c) => {
  return c.json({ message: 'Hello World!' });
});

// =====================
// User Routes
// =====================

// Auth routes
app.post('/register', registerHandler);
app.post('/login', loginHandler);

// User data route
app.get('/user-data', authMiddleware, getUserDataHandler);

// =====================
// Task Routes
// =====================

// Task routes with auth middleware 
app.post('/tasks', authMiddleware, createTaskHandler);
app.get('/tasks/:id', authMiddleware, getTaskByIdHandler);
app.get('/tasks', authMiddleware, getAllTasksHandler);
app.delete('/tasks/:id', authMiddleware, deleteTaskHandler);

// Step routes with auth middleware
app.post('/tasks/:taskId/steps', authMiddleware, createStepHandler);
app.get('/tasks/:taskId/steps', authMiddleware, getStepsForTaskHandler);

// Start the server
const port = 4000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
