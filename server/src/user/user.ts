import { Context } from 'hono';
import { userQueries } from '../database/user-queries';
import { posthogClient } from '../index';
import crypto from 'crypto';

// Get user data handler
export async function getUserDataHandler(c: Context) {
  try {
    const user = c.get('user');
    
    // Get user details by ID
    const userData = await userQueries.getUserById(user.userId);
    
    if (!userData) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Track user data retrieval event
    posthogClient.capture({
      distinctId: crypto.randomUUID(),
      event: 'user_data_retrieved',
      properties: {
        user_id: user.userId,
        timestamp: new Date().toISOString()
      }
    });

    return c.json({ user: userData });
  } catch (error) {
    console.error('User data route error:', error);
    return c.json({ 
      error: 'Failed to fetch user data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
}
