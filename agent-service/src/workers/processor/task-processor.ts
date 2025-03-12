// Task processing logic
import { TaskData, validateTask } from "../../ai/task-validation";
import { addStepToTask, updateTaskStatus, updateTaskValidation } from "../api/task-api";
import {
  createBrowserSession,
  connectToBrowser,
  createBrowserPage,
  navigateToUrl,
  takeScreenshot,
  closeBrowser,
} from "../browser/browser-utils";

/**
 * Process a task by adding steps at intervals
 */
export async function processTask(task: TaskData): Promise<void> {
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
    const page = await createBrowserPage(browser, task.id);

    // Navigate to Twitter
    console.log(`Navigating to Twitter for task: ${task.id}`);
    await navigateToUrl(page, task.id, "https://twitter.com");

    // Take a screenshot
    await takeScreenshot(page, task.id, "Captured screenshot of Twitter homepage");

    // Close the browser
    await closeBrowser(browser, task.id);

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
