import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import dotenv from "dotenv";
import { PostHog } from "posthog-node";
import { authMiddleware, programmaticMiddleware } from "./middleware/auth";
import { initDb } from "./database/init";

// User handlers
import { registerHandler, loginHandler } from "./user/auth";
import { getUserDataHandler } from "./user/user";

// Task handlers
import { createTaskHandler } from "./task/create";
import { getTaskByIdHandler, getAllTasksHandler } from "./task/get";
import { deleteTaskHandler } from "./task/delete";
import {
  getStepsForTaskHandler,
  createStepProgrammaticHandler,
} from "./task/steps";
import {
  updateTaskHandler,
  UpdateTaskStatusHandler,
  updateTaskBrowserSessionHandler,
} from "./task/update";

dotenv.config();

const OBSERVABILITY_ENABLED = process.env.OBSERVABILITY_ENABLED === "true";

const dummyPosthogClient = {
  async capture(data: any) {
    null;
  },

  async shutdown() {
    null;
  },
};

// Initialize PostHog client
export const posthogClient = OBSERVABILITY_ENABLED
  ? new PostHog(process.env.POSTHOG_API_KEY as string, {
      host: "https://eu.i.posthog.com",
    })
  : dummyPosthogClient;

// Initialize database tables
initDb().catch(console.error);

const app = new Hono();

// Configure CORS
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  }),
);

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// =====================
// User Routes
// =====================

// Auth routes
app.post("/register", registerHandler);
app.post("/login", loginHandler);

// User data route
app.get("/user-data", authMiddleware, getUserDataHandler);

// =====================
// Task Routes
// =====================

// Task routes with auth middleware
app.post("/tasks", authMiddleware, createTaskHandler);
app.get("/tasks/:id", authMiddleware, getTaskByIdHandler);
app.get("/tasks", authMiddleware, getAllTasksHandler);
app.delete("/tasks/:id", authMiddleware, deleteTaskHandler);

// =====================
// Task Steps API Routes
// =====================

// Get steps route with auth middleware
app.get("/tasks/:taskId/steps", authMiddleware, getStepsForTaskHandler);

// Programmatic step routes with API key middleware
app.post(
  "/programmatic/tasks/:taskId/steps",
  programmaticMiddleware,
  createStepProgrammaticHandler,
);
app.get(
  "/programmatic/tasks/:taskId/steps",
  programmaticMiddleware,
  getStepsForTaskHandler,
);
app.patch(
  "/programmatic/tasks/:taskId",
  programmaticMiddleware,
  updateTaskHandler,
);
app.patch(
  "/programmatic/tasks/:taskId/status",
  programmaticMiddleware,
  UpdateTaskStatusHandler,
);
app.patch(
  "/programmatic/tasks/:taskId/browser-session",
  programmaticMiddleware,
  updateTaskBrowserSessionHandler,
);

// Start the server
const port = 4000;
console.log(`Server is running on port ${port}`);

const server = serve({
  fetch: app.fetch,
  port,
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await posthogClient.shutdown();
  server.close();
});
