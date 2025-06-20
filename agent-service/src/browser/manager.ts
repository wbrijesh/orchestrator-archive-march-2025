import { Browserbase } from "@browserbasehq/sdk";
import { chromium } from "playwright-core";
import { mapBrowserSessionToFields } from "./map-fields";
import axios from "axios";

const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });

const API_KEY = process.env.API_KEY || "orchestrator-api-key-12345";
const SERVER_URL = process.env.SERVER_URL || "http://localhost:4000";

const browserManager = {
  async createNewSession({ taskId }: { taskId: string }) {
    // Create the browser session
    const session = await bb.sessions.create({
      projectId: process.env.BROWSERBASE_PROJECT_ID!,
    });
    let liveViewUrl;

    try {
      // Separately fetch the live view URL
      const liveViewLinks = await bb.sessions.debug(session.id);
      liveViewUrl = liveViewLinks.debuggerFullscreenUrl;

      // Map browser session to individual fields including the live view URL
      const browserSessionFields = mapBrowserSessionToFields(
        session,
        liveViewUrl,
      );

      // Call the new API endpoint to update the task with browser session data
      await axios.patch(
        `${SERVER_URL}/programmatic/tasks/${taskId}/browser-session`,
        browserSessionFields,
        {
          headers: {
            "X-API-Key": API_KEY,
            "Content-Type": "application/json",
          },
        },
      );

      console.log(`Browser session details saved for task: ${taskId}`);
    } catch (error) {
      console.error("Error saving session details:", error);
      console.error(error instanceof Error ? error.message : String(error));
    }

    return { session, liveViewUrl };
  },
};

export default browserManager;
