// Browser-related functions for managing browser sessions
import { chromium } from "playwright-core";
import browserManager from "../../browser/manager";
import { addStepToTask } from "../api/task-api";

/**
 * Create browser session with proper error handling and recording
 */
export async function createBrowserSession(
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

    // Create the session (now also fetches the live view URL)
    console.log(`Creating browser session for task ${taskId}...`);
    const { session, liveViewUrl } = await browserManager.createNewSession({
      taskId,
    });
    console.log(`Browser session created for task ${taskId}: ${session.id}`);

    // Record successful creation, including live view URL if available
    await addStepToTask(taskId, {
      name: "Browser Session Created",
      data: JSON.stringify({
        timestamp: new Date().toISOString(),
        sessionId: session.id,
        liveViewUrl: liveViewUrl,
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
export async function connectToBrowser(
  taskId: string,
  session: any,
): Promise<any> {
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
 * Create a new browser page and record the action
 */
export async function createBrowserPage(
  browser: any,
  taskId: string,
): Promise<any> {
  const page = await browser.newPage();

  // Record the page creation
  await addStepToTask(taskId, {
    name: "Browser Page Created",
    data: JSON.stringify({
      timestamp: new Date().toISOString(),
      message: "Created a new browser page",
    }),
  });

  return page;
}

export async function useDefaultPage(
  browser: any,
  taskId: string,
): Promise<any> {
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  return page;
}

/**
 * Navigate to a URL and record the action
 */
export async function navigateToUrl(
  page: any,
  taskId: string,
  url: string,
): Promise<void> {
  await page.goto(url);

  // Record the navigation
  await addStepToTask(taskId, {
    name: `Navigated to ${new URL(url).hostname}`,
    data: JSON.stringify({
      timestamp: new Date().toISOString(),
      url: url,
      message: `Navigated to ${url}`,
    }),
  });
}

/**
 * Take a screenshot and record the action
 */
export async function takeScreenshot(
  page: any,
  taskId: string,
  description: string,
): Promise<string> {
  const screenshotBuffer = await page.screenshot();
  const screenshotBase64 = screenshotBuffer.toString("base64");

  // Record the screenshot
  await addStepToTask(taskId, {
    name: "Screenshot Captured",
    data: JSON.stringify({
      timestamp: new Date().toISOString(),
      screenshot: `data:image/png;base64,${screenshotBase64}`,
      message: description || "Captured screenshot",
    }),
  });

  return screenshotBase64;
}

/**
 * Close the browser and record the action
 */
export async function closeBrowser(
  browser: any,
  taskId: string,
): Promise<void> {
  await browser.close();

  // Record browser closure
  await addStepToTask(taskId, {
    name: "Browser Closed",
    data: JSON.stringify({
      timestamp: new Date().toISOString(),
      message: "Browser session closed",
    }),
  });
}
