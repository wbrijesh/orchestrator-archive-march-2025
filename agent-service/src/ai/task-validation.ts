import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

// Task data interface
export interface TaskData {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  [key: string]: any; // Allow any other fields
}

// Task validation result interface
export interface TaskValidationResult {
  isTaskValid: boolean;
  reason: string;
}

// Task validation schema
export const TaskValidationSchema = z.object({
  isTaskValid: z
    .boolean()
    .describe("Whether the task is valid and safe to process"),
  reason: z.string().describe("Reason why the task is valid or invalid"),
});

/**
 * Validate a task using AI to determine if it's safe, appropriate, and within the capabilities
 * of the Orchestrator (e.g., tasks performed on a web browser).
 */
export async function validateTask(
  task: TaskData,
): Promise<TaskValidationResult> {
  try {
    const GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!GOOGLE_GENERATIVE_AI_API_KEY) {
      return {
        isTaskValid: true,
        reason: "Google Generative AI API key not set, validation skipped",
      };
    }

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-lite"),
      schema: TaskValidationSchema,
      schemaName: "TaskValidation",
      schemaDescription:
        "Validation result for a task to determine if it is safe, appropriate, and within the capabilities of Orchestrator",
      system:
        "You are a task validator for an orchestration system. " +
        "Your job is to determine if tasks are valid, safe, and appropriate. " +
        "Reject tasks that are harmful, illegal, unethical, or not actually tasks. " +
        "Valid tasks are clear, actionable work items that can be processed by an automated system. " +
        "Additionally, ensure that the task falls within the capabilities of Orchestrator, such as tasks that can be performed in a web browser.",
      prompt: `Please validate the following task:
Task Name: ${task.name}
Task Description: ${task.description || "No description provided"}
Task ID: ${task.id}
Task Creation Time: ${task.created_at}

Determine if this is a valid task that should be processed by our system, considering both ethical constraints and the capabilities of Orchestrator.`,
    });

    return object;
  } catch (error) {
    // Default to invalid if there's an error during validation
    return {
      isTaskValid: false,
      reason: `Error during validation: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
