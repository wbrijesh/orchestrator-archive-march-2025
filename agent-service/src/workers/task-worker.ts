// Worker thread for processing tasks
// prevents TS errors
declare var self: Worker;

import axios from 'axios';

// Task data interface
interface TaskData {
  id: string;
  name: string;
  created_at: string;
  [key: string]: any; // Allow any other fields
}

// Step interface
interface Step {
  name: string;
  data: any;
}

// API configuration
const API_KEY = process.env.API_KEY || 'orchestrator-api-key-12345';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000';

/**
 * Add a step to a task via the server API
 */
async function addStepToTask(taskId: string, step: Step): Promise<any> {
  try {
    const response = await axios.post(
      `${SERVER_URL}/programmatic/tasks/${taskId}/steps`, 
      step,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error adding step to task ${taskId}:`, error);
    throw error;
  }
}

/**
 * Process a task by adding steps at intervals
 */
async function processTask(task: TaskData): Promise<void> {
  console.log(`Starting processing for task: ${task.id} - ${task.name}`);
  
  // Add 5 steps, one every 20 seconds
  const totalSteps = 5;
  
  for (let i = 1; i <= totalSteps; i++) {
    try {
      // Create step data
      const step: Step = {
        name: `Auto-generated step ${i}`,
        data: {
          timestamp: new Date().toISOString(),
          message: `This is step ${i} of ${totalSteps} for task ${task.name}`,
          taskInfo: {
            id: task.id,
            name: task.name,
            step: i,
            totalSteps
          }
        }
      };
      
      // Add step to task
      const result = await addStepToTask(task.id, step);
      console.log(`Added step ${i}/${totalSteps} to task ${task.id}:`, result.id);
      
      // Wait 20 seconds before adding the next step (except for the last one)
      if (i < totalSteps) {
        await new Promise(resolve => setTimeout(resolve, 20000));
      }
    } catch (error) {
      console.error(`Failed to add step ${i} to task ${task.id}:`, error);
    }
  }
  
  console.log(`Completed processing for task: ${task.id} - ${task.name}`);
}

// Listen for messages from the main thread
self.onmessage = async (event: MessageEvent) => {
  const taskData: TaskData = event.data;
  
  if (!taskData || !taskData.id) {
    console.error('Invalid task data received:', taskData);
    self.postMessage({ error: 'Invalid task data' });
    return;
  }
  
  try {
    // Process the task
    await processTask(taskData);
    
    // Send completion message back to main thread
    self.postMessage({ 
      status: 'completed', 
      taskId: taskData.id,
      message: `Successfully processed task ${taskData.id}`
    });
  } catch (error) {
    console.error(`Error processing task ${taskData.id}:`, error);
    self.postMessage({ 
      status: 'error', 
      taskId: taskData.id,
      error: `Failed to process task: ${error}`
    });
  }
};
