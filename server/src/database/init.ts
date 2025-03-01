import { db } from './client';

/**
 * Initialize database tables if they don't exist
 */
export async function initDb() {
  try {
    // Create users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        password TEXT NOT NULL
      )
    `);

    // Create tasks table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        browser_session_id TEXT,
        browser_created_at TEXT,
        browser_updated_at TEXT,
        browser_project_id TEXT,
        browser_started_at TEXT,
        browser_ended_at TEXT,
        browser_expires_at TEXT,
        browser_status TEXT,
        browser_proxy_bytes INTEGER,
        browser_avg_cpu_usage REAL,
        browser_memory_usage REAL,
        browser_keep_alive BOOLEAN,
        browser_context_id TEXT,
        browser_region TEXT,
        browser_connect_url TEXT,
        browser_selenium_remote_url TEXT,
        browser_signing_key TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create steps table
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
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
