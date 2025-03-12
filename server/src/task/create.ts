import { Context } from "hono";
import { taskQueries } from "../database/task-queries";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL;

export async function sendTaskToAgentService(taskData: any): Promise<void> {
  try {
    await axios.post(`${AGENT_SERVICE_URL}/tasks`, taskData);
    console.log(`Task ${taskData.id} sent to agent service`);
  } catch (error) {
    console.error("Error sending task to agent service:", error);
    // We don't throw the error here to avoid affecting the main flow
  }
}

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
