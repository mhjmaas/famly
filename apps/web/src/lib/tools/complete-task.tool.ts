import { z } from "zod";
import { updateTask } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const completeTaskTool = {
  description:
    "Mark a task as completed or uncompleted. When completing a task, the current timestamp is recorded.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
    taskId: z.string().describe("The ID of the task to complete or uncomplete"),
    complete: z
      .boolean()
      .describe("true to mark as completed, false to mark as uncompleted"),
  }),
  execute: async ({
    familyId,
    taskId,
    complete,
  }: {
    familyId: string;
    taskId: string;
    complete: boolean;
  }) => {
    // Get cookie header for authentication
    const cookieHeader = await getCookieHeader();

    try {
      // Set completedAt to current timestamp if completing, null if uncompleting
      const task = await updateTask(
        familyId,
        taskId,
        {
          completedAt: complete ? new Date().toISOString() : null,
        },
        cookieHeader,
      );

      const result = {
        taskId: task._id,
        name: task.name,
        description: task.description,
        dueDate: task.dueDate,
        assignment: task.assignment,
        completedAt: task.completedAt,
        completedBy: task.completedBy,
        karma: task.metadata?.karma,
        status: complete ? "completed" : "uncompleted",
      };

      console.log("Complete Task Tool with result", result);
      return result;
    } catch (error) {
      console.error("Error completing task:", error);
      throw new Error(
        `Failed to ${complete ? "complete" : "uncomplete"} task: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
