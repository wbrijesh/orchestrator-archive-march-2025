import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './lib/db';
import { authMiddleware } from './middleware/auth';
import dotenv from 'dotenv';

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

// Start the server
const port = 4000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
