import axios from "axios";

// Define the agent service URL
const AGENT_SERVICE_URL =
  process.env.AGENT_SERVICE_URL || "http://localhost:6000";

/**
 * Send task data to the agent service
 * @param taskData The task data to send
 */
export async function sendTaskToAgentService(taskData: any): Promise<void> {
  try {
    await axios.post(`${AGENT_SERVICE_URL}/tasks`, taskData);
    console.log(`Task ${taskData.id} sent to agent service`);
  } catch (error) {
    console.error("Error sending task to agent service:", error);
    // We don't throw the error here to avoid affecting the main flow
  }
}
