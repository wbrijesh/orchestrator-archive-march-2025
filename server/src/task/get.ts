import { Context } from "hono";
import { taskQueries } from "../database/task-queries";

// Get task by ID handler
export async function getTaskByIdHandler(c: Context) {
  try {
    const user = c.get("user");
    const taskId = c.req.param("id");

    // Get task by ID
    const task = await taskQueries.getTaskById(taskId, user.userId);

    if (!task) {
      return c.json({ error: "Task not found or unauthorized" }, 404);
    }

    // Add browser replay URL to the response if browser_session_id exists
    if (task.browser_session_id) {
      task.browser_replay_url = `https://browserbase.com/sessions/${task.browser_session_id}`;
    }

    return c.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return c.json({ error: "Failed to fetch task" }, 500);
  }
}

// Get all tasks handler
export async function getAllTasksHandler(c: Context) {
  try {
    const user = c.get("user");

    // Get all tasks for user
    const tasks = await taskQueries.getAllTasks(user.userId);

    // Add browser replay URLs to the response if browser_session_id exists
    const tasksWithReplayUrls = tasks.map((task) => {
      if (task.browser_session_id) {
        return {
          ...task,
          browser_replay_url: `https://browserbase.com/sessions/${task.browser_session_id}`,
        };
      }
      return task;
    });

    return c.json(tasksWithReplayUrls);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return c.json({ error: "Failed to fetch tasks" }, 500);
  }
}
