import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';

// Define user data type
type UserData = {
  userId: number;
  email: string;
};

// Add type to Hono context
declare module 'hono' {
  interface ContextVariableMap {
    user: UserData;
  }
}

// Authentication middleware
export const authMiddleware = async (c: Context, next: Next) => {
  try {
    // Get JWT token from headers
    const authHeader = c.req.header('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }
    
    const token = authHeader.substring(7);
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserData;
    
    // Set user data in request context 
    c.set('user', decoded);
    
    // Continue to the next middleware/handler
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
};
