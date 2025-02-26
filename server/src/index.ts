import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './lib/db';
import { authMiddleware } from './middleware/auth';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const app = new Hono();
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true,
}));

// Initialize database table
const initDb = async () => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      password TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS steps (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      name TEXT NOT NULL,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);
};

initDb().catch(console.error);

// Register endpoint
app.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    console.log('Registration attempt:', body);

    const { email, firstName, lastName, password } = body;

    // Validate input
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    if (!firstName) {
      return c.json({ error: 'First name is required' }, 400);
    }
    if (!lastName) {
      return c.json({ error: 'Last name is required' }, 400);
    }
    if (!password) {
      return c.json({ error: 'Password is required' }, 400);
    }

    // Check if user already exists
    const existingUser = await db.execute({
      sql: 'SELECT email FROM users WHERE email = ?',
      args: [email]
    });

    if (existingUser.rows.length > 0) {
      return c.json({ error: 'Email already registered' }, 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    console.log('Attempting to insert user into database...');
    await db.execute({
      sql: 'INSERT INTO users (email, first_name, last_name, password) VALUES (?, ?, ?, ?)',
      args: [email, firstName, lastName, hashedPassword]
    });
    console.log('User inserted successfully');

    return c.json({ message: 'User registered successfully' }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ 
      error: 'Registration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
});

// Login endpoint
app.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    console.log('Login attempt:', body);

    const { email, password } = body;

    // Validate input
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    if (!password) {
      return c.json({ error: 'Password is required' }, 400);
    }

    console.log('Attempting to retrieve user from database...');
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    });
    console.log('Database result:', result.rows);

    const user = result.rows[0];

    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password as string);
    if (!isValidPassword) {
      return c.json({ error: 'Invalid password' }, 401);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    return c.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ 
      error: 'Login failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// User data route
app.get('/user-data', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const result = await db.execute({
      sql: 'SELECT id, email, first_name, last_name FROM users WHERE id = ?',
      args: [user.userId]
    });
    
    if (result.rows.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user: result.rows[0] });
  } catch (error) {
    console.error('User data route error:', error);
    return c.json({ 
      error: 'Failed to fetch user data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
});

// Hello world route
app.get('/', (c) => {
  return c.json({ message: 'Hello World!' });
});

// Tasks endpoints
app.post('/tasks', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { name } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Task name is required' }, 400);
    }

    const taskId = randomUUID();
    await db.execute({
      sql: 'INSERT INTO tasks (id, user_id, name) VALUES (?, ?, ?)',
      args: [taskId, user.userId, name]
    });

    return c.json({
      id: taskId,
      name,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return c.json({ error: 'Failed to create task' }, 500);
  }
});

app.get('/tasks/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const taskId = c.req.param('id');

    const result = await db.execute({
      sql: 'SELECT id, name, created_at FROM tasks WHERE id = ? AND user_id = ?',
      args: [taskId, user.userId]
    });

    if (result.rows.length === 0) {
      return c.json({ error: 'Task not found or unauthorized' }, 404);
    }

    return c.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching task:', error);
    return c.json({ error: 'Failed to fetch task' }, 500);
  }
});

app.get('/tasks', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const tasks = await db.execute({
      sql: 'SELECT id, name, created_at FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
      args: [user.userId]
    });

    return c.json(tasks.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return c.json({ error: 'Failed to fetch tasks' }, 500);
  }
});

app.delete('/tasks/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const taskId = c.req.param('id');

    const result = await db.execute({
      sql: 'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      args: [taskId, user.userId]
    });

    if (result.rowsAffected === 0) {
      return c.json({ error: 'Task not found or unauthorized' }, 404);
    }

    return c.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return c.json({ error: 'Failed to delete task' }, 500);
  }
});

// Steps endpoints
app.post('/tasks/:taskId/steps', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const taskId = c.req.param('taskId');
    const { name, data } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Step name is required' }, 400);
    }

    // Verify task belongs to user
    const task = await db.execute({
      sql: 'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
      args: [taskId, user.userId]
    });

    if (task.rows.length === 0) {
      return c.json({ error: 'Task not found or unauthorized' }, 404);
    }

    // Get next sequence number
    const sequenceResult = await db.execute({
      sql: 'SELECT COALESCE(MAX(sequence), 0) + 1 as next_sequence FROM steps WHERE task_id = ?',
      args: [taskId]
    });
    const sequence = sequenceResult.rows[0].next_sequence;

    const stepId = randomUUID();
    const result = await db.execute({
      sql: 'INSERT INTO steps (id, task_id, sequence, name, data) VALUES (?, ?, ?, ?, ?)',
      args: [stepId, taskId, sequence, name, data]
    });

    return c.json({
      id: stepId,
      task_id: taskId,
      sequence,
      name,
      data,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating step:', error);
    return c.json({ error: 'Failed to create step' }, 500);
  }
});

app.get('/tasks/:taskId/steps', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const taskId = c.req.param('taskId');

    // Verify task belongs to user
    const task = await db.execute({
      sql: 'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
      args: [taskId, user.userId]
    });

    if (task.rows.length === 0) {
      return c.json({ error: 'Task not found or unauthorized' }, 404);
    }

    const steps = await db.execute({
      sql: 'SELECT id, sequence, name, data, created_at FROM steps WHERE task_id = ? ORDER BY sequence',
      args: [taskId]
    });

    return c.json(steps.rows);
  } catch (error) {
    console.error('Error fetching steps:', error);
    return c.json({ error: 'Failed to fetch steps' }, 500);
  }
});

// Start the server
const port = 4000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
