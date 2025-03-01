import { db } from './client';

export const userQueries = {
  /**
   * Check if a user exists with the given email
   */
  checkUserExists: async (email: string) => {
    const existingUser = await db.execute({
      sql: 'SELECT email FROM users WHERE email = ?',
      args: [email]
    });
    
    return existingUser.rows.length > 0;
  },
  
  /**
   * Create a new user
   */
  createUser: async (email: string, firstName: string, lastName: string, hashedPassword: string) => {
    await db.execute({
      sql: 'INSERT INTO users (email, first_name, last_name, password) VALUES (?, ?, ?, ?)',
      args: [email, firstName, lastName, hashedPassword]
    });
  },
  
  /**
   * Get user by email (for login)
   */
  getUserByEmail: async (email: string) => {
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    });
    
    return result.rows.length > 0 ? result.rows[0] : null;
  },
  
  /**
   * Get user by ID
   */
  getUserById: async (userId: number) => {
    const result = await db.execute({
      sql: 'SELECT id, email, first_name, last_name FROM users WHERE id = ?',
      args: [userId]
    });
    
    return result.rows.length > 0 ? result.rows[0] : null;
  }
};
