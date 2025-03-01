import { Browserbase } from "@browserbasehq/sdk";
import dotenv from 'dotenv';
import { Browser } from 'playwright-core';

dotenv.config();

// Initialize Browserbase with API key
const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });

/**
 * Create a new Browserbase session
 * @returns The created session object
 */
export async function createBrowserbaseSession() {
  try {
    const session = await bb.sessions.create({
      projectId: process.env.BROWSERBASE_PROJECT_ID!
    });
    return session;
  } catch (error) {
    console.error('Error creating Browserbase session:', error);
    throw error;
  }
}

/**
 * Close a Browserbase session by closing the browser
 * @param browser The Playwright browser instance to close
 * @param sessionId Optional session ID for logging purposes
 */
export async function closeBrowserbaseSession(browser: Browser, sessionId?: string) {
  try {
    await browser.close();
    console.log(`Browser closed for session ${sessionId || 'unknown'}`);
  } catch (error) {
    console.error('Error closing Browserbase session:', error);
    throw error;
  }
}

/**
 * Get the replay URL for a Browserbase session
 * @param sessionId The session ID
 * @returns string The replay URL
 */
export function getBrowserbaseReplayUrl(sessionId: string): string {
  if (!sessionId) return '';
  return `https://browserbase.com/sessions/${sessionId}`;
}