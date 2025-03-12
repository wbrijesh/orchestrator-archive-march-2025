// Worker thread for processing tasks using Node.js child_process
import { TaskData, validateTask } from "../ai/task-validation";
import axios from "axios";
import browserManager from "../browser/manager";
import { chromium } from "playwright-core";

// Step interface
interface Step {
  name: string;
  data: any;
}

// API configuration
const API_KEY = process.env.API_KEY || "orchestrator-api-key-12345";
const SERVER_URL = process.env.SERVER_URL || "http://localhost:4000";

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
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Update task validation status in the database
 */
async function updateTaskValidation(
  taskId: string,
  isTaskValid: boolean,
  reason: string,
): Promise<boolean> {
  try {
    const response = await axios.patch(
      `${SERVER_URL}/programmatic/tasks/${taskId}`,
      {
        isTaskValid: isTaskValid,
        reason: reason,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
      },
    );

    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Update task status
 */
async function updateTaskStatus(
  taskId: string,
  status: string,
): Promise<boolean> {
  try {
    const response = await axios.patch(
      `${SERVER_URL}/programmatic/tasks/${taskId}/status`,
      {
        status: status,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
      },
    );
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Create browser session with proper error handling and recording
 */
async function createBrowserSession(
  taskId: string,
  taskName: string,
): Promise<any> {
  try {
    // First record that we're about to create a session
    await addStepToTask(taskId, {
      name: "Creating Browser Session",
      data: JSON.stringify({
        timestamp: new Date().toISOString(),
        message: "Starting browser session creation...",
      }),
    });

    // Create the session
    console.log(`Creating browser session for task ${taskId}...`);
    const session = await browserManager.createNewSession({ taskId });
    console.log(`Browser session created for task ${taskId}: ${session.id}`);

    // Record successful creation
    await addStepToTask(taskId, {
      name: "Browser Session Created",
      data: JSON.stringify({
        timestamp: new Date().toISOString(),
        sessionId: session.id,
        message: "Browser session created successfully",
      }),
    });

    return session;
  } catch (error) {
    console.error(
      `Failed to create browser session for task ${taskId}:`,
      error,
    );

    // Record the failure
    await addStepToTask(taskId, {
      name: "Browser Session Creation Failed",
      data: JSON.stringify({
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        message: "Failed to create browser session",
      }),
    });

    throw error; // Re-throw to be handled by the caller
  }
}

/**
 * Connect to browser using CDP with proper error handling
 * @returns The browser object if connection successful, null otherwise
 */
async function connectToBrowser(taskId: string, session: any): Promise<any> {
  try {
    // Add a step to show connection attempt is starting
    await addStepToTask(taskId, {
      name: "Browser Connection Starting",
      data: JSON.stringify({
        timestamp: new Date().toISOString(),
        sessionId: session.id,
        connectUrl: session.connectUrl,
        message: "Attempting to connect to browser via CDP...",
      }),
    });

    // Actually connect to the browser using Playwright's CDP
    console.log(`Connecting to browser at ${session.connectUrl}...`);
    const browser = await chromium.connectOverCDP(session.connectUrl);
    console.log(`Successfully connected to browser for task ${taskId}`);

    // Record successful connection
    await addStepToTask(taskId, {
      name: "Browser Connected",
      data: JSON.stringify({
        timestamp: new Date().toISOString(),
        sessionId: session.id,
        message: "Successfully connected to browser using CDP",
      }),
    });

    return browser;
  } catch (error) {
    console.error(`Failed to connect to browser for task ${taskId}:`, error);

    // Record the connection failure
    await addStepToTask(taskId, {
      name: "Browser Connection Failed",
      data: JSON.stringify({
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        message: "Failed to connect to browser using CDP",
      }),
    });

    return null; // Signal that connection failed
  }
}

/**
 * Process a task by adding steps at intervals
 */
async function processTask(task: TaskData): Promise<void> {
  try {
    console.log(`Worker starting to process task: ${task.id}`);

    // First validate the task using AI
    const validation = await validateTask(task);

    // Update task validation status in the database
    const updateSuccess = await updateTaskValidation(
      task.id,
      validation.isTaskValid,
      validation.reason,
    );

    // Log the result of updating task status
    if (updateSuccess) {
      console.log(`Successfully updated task ${task.id} validation status`);
    } else {
      console.log(`Failed to update task ${task.id} validation status`);
    }

    // Add a validation step to the task
    await addStepToTask(task.id, {
      name: "Task Validation",
      data: JSON.stringify({
        timestamp: new Date().toISOString(),
        validation: validation,
        message: validation.isTaskValid
          ? "Task validated successfully"
          : "Task validation failed",
      }),
    });

    // If task is not valid, update status and stop processing
    if (!validation.isTaskValid) {
      await updateTaskStatus(task.id, "error");

      if (process.send) {
        process.send({
          status: "error",
          taskId: task.id,
          error: validation.reason,
        });
      }
      return;
    }

    // Create a browser session
    console.log(`Creating browser session for task: ${task.id}`);
    let session;
    try {
      session = await createBrowserSession(task.id, task.name);
    } catch (error) {
      // If we can't create a session, we can't proceed
      console.error(`Failed to create browser session: ${error}`);
      await updateTaskStatus(task.id, "error");

      if (process.send) {
        process.send({
          status: "error",
          taskId: task.id,
          error: `Failed to create browser session: ${error}`,
        });
      }
      return;
    }

    // Connect to the browser
    console.log(`Connecting to browser for task: ${task.id}`);
    const browser = await connectToBrowser(task.id, session);
    if (!browser) {
      // If we can't connect to the browser, we can't proceed
      console.error("Failed to connect to browser");
      await updateTaskStatus(task.id, "error");

      if (process.send) {
        process.send({
          status: "error",
          taskId: task.id,
          error: "Failed to connect to browser",
        });
      }
      return;
    }

    // Create a new page
    console.log(`Creating new page for task: ${task.id}`);
    const page = await browser.newPage();

    // Record the page creation
    await addStepToTask(task.id, {
      name: "Browser Page Created",
      data: JSON.stringify({
        timestamp: new Date().toISOString(),
        message: "Created a new browser page",
      }),
    });

    // Navigate to Twitter
    console.log(`Navigating to Twitter for task: ${task.id}`);
    await page.goto("https://twitter.com");

    // Record the navigation
    await addStepToTask(task.id, {
      name: "Navigated to Twitter",
      data: JSON.stringify({
        timestamp: new Date().toISOString(),
        url: "https://twitter.com",
        message: "Navigated to Twitter homepage",
      }),
    });

    // Take a screenshot
    const screenshotBuffer = await page.screenshot();
    const screenshotBase64 = screenshotBuffer.toString("base64");

    // Record the screenshot
    await addStepToTask(task.id, {
      name: "Screenshot Captured",
      data: JSON.stringify({
        timestamp: new Date().toISOString(),
        screenshot: `data:image/png;base64,${screenshotBase64}`,
        message: "Captured screenshot of Twitter homepage",
      }),
    });

    // Close the browser
    await browser.close();

    // Record browser closure
    await addStepToTask(task.id, {
      name: "Browser Closed",
      data: JSON.stringify({
        timestamp: new Date().toISOString(),
        message: "Browser session closed",
      }),
    });

    // Add completion step
    const successStep = {
      name: "Task Completed",
      data: JSON.stringify({
        timestamp: new Date().toISOString(),
        message: `Task ${task.name} completed successfully`,
        taskInfo: {
          id: task.id,
          name: task.name,
        },
      }),
    };

    // Add completion step to task
    await addStepToTask(task.id, successStep);

    // Update task status to completed
    await updateTaskStatus(task.id, "completed");

    if (process.send) {
      process.send({ status: "completed", taskId: task.id });
    }

    console.log(`Worker completed task: ${task.id}`);
  } catch (error) {
    console.error(`Error processing task ${task.id}:`, error);
    try {
      await updateTaskStatus(task.id, "error");
    } catch {}

    if (process.send) {
      process.send({
        status: "error",
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

// Listen for messages from the parent process
process.on("message", (task: TaskData) => {
  if (!task || !task.id) {
    console.error("Invalid task data received");
    if (process.send) {
      process.send({
        status: "error",
        error: "Invalid task data",
      });
    }
    return;
  }

  console.log(`Worker received task: ${task.id}`);

  processTask(task).catch((error) => {
    console.error(`Failed to process task ${task.id}:`, error);
    if (process.send) {
      process.send({
        status: "error",
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
});

// Send a message to the parent process that we're ready
if (process.send) {
  process.send({ status: "ready" });
}
