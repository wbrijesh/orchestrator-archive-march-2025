import { db } from '../database/client';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration script to add browser session fields to the existing tasks table
 */
async function addBrowserFieldsToTasks() {
  try {
    console.log('Starting migration: Adding browser fields to tasks table...');
    
    // Check if column already exists to avoid errors
    const tableInfo = await db.execute(`PRAGMA table_info(tasks)`);
    const columns = tableInfo.rows.map((row: any) => row.name);
    
    // Add each new column if it doesn't exist
    const columnsToAdd = [
      { name: 'browser_session_id', type: 'TEXT' },
      { name: 'browser_created_at', type: 'TEXT' },
      { name: 'browser_updated_at', type: 'TEXT' },
      { name: 'browser_project_id', type: 'TEXT' },
      { name: 'browser_started_at', type: 'TEXT' },
      { name: 'browser_ended_at', type: 'TEXT' },
      { name: 'browser_expires_at', type: 'TEXT' },
      { name: 'browser_status', type: 'TEXT' },
      { name: 'browser_proxy_bytes', type: 'INTEGER' },
      { name: 'browser_avg_cpu_usage', type: 'REAL' },
      { name: 'browser_memory_usage', type: 'REAL' },
      { name: 'browser_keep_alive', type: 'BOOLEAN' },
      { name: 'browser_context_id', type: 'TEXT' },
      { name: 'browser_region', type: 'TEXT' },
      { name: 'browser_connect_url', type: 'TEXT' },
      { name: 'browser_selenium_remote_url', type: 'TEXT' },
      { name: 'browser_signing_key', type: 'TEXT' }
    ];
    
    for (const column of columnsToAdd) {
      if (!columns.includes(column.name)) {
        console.log(`Adding column ${column.name} to tasks table...`);
        await db.execute(`ALTER TABLE tasks ADD COLUMN ${column.name} ${column.type}`);
      } else {
        console.log(`Column ${column.name} already exists in tasks table`);
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run the migration
addBrowserFieldsToTasks()
  .then(() => {
    console.log('Migration script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
