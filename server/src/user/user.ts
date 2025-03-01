import { Context } from 'hono';
import { userQueries } from '../database/user-queries';

// Get user data handler
export async function getUserDataHandler(c: Context) {
  try {
    const user = c.get('user');
    
    // Get user details by ID
    const userData = await userQueries.getUserById(user.userId);
    
    if (!userData) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user: userData });
  } catch (error) {
    console.error('User data route error:', error);
    return c.json({ 
      error: 'Failed to fetch user data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
}
