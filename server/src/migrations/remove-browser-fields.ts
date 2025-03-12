import { db } from '../database/client';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration script to remove unused browser fields from the tasks table,
 * keeping only browser_session_id and browser_connect_url
 */
async function removeBrowserFields() {
  try {
    console.log('Starting migration: Removing unused browser fields from tasks table...');
    
    // Check if columns exist before attempting to remove them
    const tableInfo = await db.execute(`PRAGMA table_info(tasks)`);
    const columns = tableInfo.rows.map((row: any) => row.name);
    
    // List of browser fields to remove
    const columnsToRemove = [
      'browser_created_at',
      'browser_updated_at',
      'browser_project_id',
      'browser_started_at',
      'browser_ended_at',
      'browser_expires_at',
      'browser_status',
      'browser_proxy_bytes',
      'browser_avg_cpu_usage',
      'browser_memory_usage',
      'browser_keep_alive',
      'browser_region',
      'browser_selenium_remote_url',
      'browser_signing_key'
    ];
    
    // SQLite doesn't support DROP COLUMN directly in older versions
    // We need to create a new table without those columns and copy the data
    
    // 1. Get all columns except the ones we want to remove
    const allColumns = columns.filter(col => !columnsToRemove.includes(col));
    const columnsList = allColumns.join(', ');
    
    // 2. Create a new table with the desired schema
    await db.execute(`
      CREATE TABLE tasks_new (
        id TEXT PRIMARY KEY, 
        user_id INTEGER NOT NULL, 
        name TEXT NOT NULL, 
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
        browser_session_id TEXT, 
        browser_context_id TEXT, 
        browser_connect_url TEXT, 
        isTaskValid TEXT, 
        reason TEXT, 
        status TEXT DEFAULT 'RUNNING', 
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    // 3. Copy data from the old table to the new one
    await db.execute(`
      INSERT INTO tasks_new (${columnsList})
      SELECT ${columnsList} FROM tasks
    `);
    
    // 4. Drop the old table
    await db.execute(`DROP TABLE tasks`);
    
    // 5. Rename the new table to the original name
    await db.execute(`ALTER TABLE tasks_new RENAME TO tasks`);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run the migration
removeBrowserFields()
  .then(() => {
    console.log('Migration script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
