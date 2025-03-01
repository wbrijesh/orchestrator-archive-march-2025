import { Context } from 'hono';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userQueries } from '../database/user-queries';

// Register endpoint handler
export async function registerHandler(c: Context) {
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
    const userExists = await userQueries.checkUserExists(email);
    if (userExists) {
      return c.json({ error: 'Email already registered' }, 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    await userQueries.createUser(email, firstName, lastName, hashedPassword);
    console.log('User registered successfully');

    return c.json({ message: 'User registered successfully' }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ 
      error: 'Registration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
}

// Login endpoint handler
export async function loginHandler(c: Context) {
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

    // Get user by email
    const user = await userQueries.getUserByEmail(email);
    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password as string);
    if (!isValidPassword) {
      return c.json({ error: 'Invalid password' }, 401);
    }

    // Generate JWT token
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
}
