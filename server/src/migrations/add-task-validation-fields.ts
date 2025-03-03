import { db } from '../database/client';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration script to add task validation fields to the existing tasks table
 */
async function addTaskValidationFields() {
  try {
    console.log('Starting migration: Adding task validation fields to tasks table...');
    
    // Check if columns already exist to avoid errors
    const tableInfo = await db.execute(`PRAGMA table_info(tasks)`);
    const columns = tableInfo.rows.map((row: any) => row.name);
    
    // Add each new column if it doesn't exist
    const columnsToAdd = [
      { name: 'isTaskValid', type: 'TEXT' }, // Using TEXT as SQLite/libsql doesn't have BOOLEAN
      { name: 'reason', type: 'TEXT' }
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
addTaskValidationFields()
  .then(() => {
    console.log('Migration script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
