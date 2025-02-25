import { chromium } from "playwright-core";
import Browserbase from "@browserbasehq/sdk";
import dotenv from 'dotenv';

dotenv.config();

const bb = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY as string,
});

(async () => {
  // Create a new session
  const session = await bb.sessions.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID as string,
  });

  // Connect to the session
  const browser = await chromium.connectOverCDP(session.connectUrl);

  // Getting the default context to ensure the sessions are recorded.
  const defaultContext = browser.contexts()[0];
  const page = defaultContext?.pages()[0];

  await page?.goto("https://brije.sh/");
  await page?.close();
  await browser.close();
  console.log(
    `Session complete! View replay at https://browserbase.com/sessions/${session.id}`,
  );
})().catch((error) => console.error(error.message));