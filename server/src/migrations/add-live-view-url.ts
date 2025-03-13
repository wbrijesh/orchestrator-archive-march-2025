import { db } from '../database/client';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration script to add live_view_url field to the tasks table
 */
async function addLiveViewUrlField() {
  try {
    console.log('Starting migration: Adding live_view_url field to tasks table...');
    
    // Check if column already exists to avoid errors
    const tableInfo = await db.execute(`PRAGMA table_info(tasks)`);
    const columns = tableInfo.rows.map((row: any) => row.name);
    
    // Add the new column if it doesn't exist
    if (!columns.includes('live_view_url')) {
      console.log(`Adding column live_view_url to tasks table...`);
      await db.execute(`ALTER TABLE tasks ADD COLUMN live_view_url TEXT`);
      console.log('Column live_view_url added successfully!');
    } else {
      console.log(`Column live_view_url already exists in tasks table`);
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run the migration
addLiveViewUrlField()
  .then(() => {
    console.log('Migration script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
