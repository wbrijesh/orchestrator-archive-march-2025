import { Context } from "hono";
import { taskQueries } from "../database/task-queries";
import { sendTaskToAgentService } from "../utils/agent";

// Create task handler
export async function createTaskHandler(c: Context) {
  try {
    const user = c.get("user");
    const { name } = await c.req.json();

    if (!name) {
      return c.json({ error: "Task name is required" }, 400);
    }

    // Create task and get its ID
    const taskId = await taskQueries.createTask(user.userId, name);

    // Get the complete task data
    const taskData = await taskQueries.getTaskById(taskId, user.userId);

    // Send task data to agent service (don't await to avoid blocking)
    sendTaskToAgentService(taskData).catch((err) => {
      console.error("Failed to send task to agent service:", err);
    });

    // Return the created task
    return c.json({
      id: taskId,
      name,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error creating task:", error);
    return c.json({ error: "Failed to create task" }, 500);
  }
}
