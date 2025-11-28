import { z } from "zod";
import { deleteTask } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const deleteTaskTool = {
  description: "Delete a specified task by its ID.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
    taskId: z.string().describe("The ID of the task to delete"),
  }),
  execute: async ({
    familyId,
    taskId,
  }: {
    familyId: string;
    taskId: string;
  }) => {
    // Get cookie header for authentication
    const cookieHeader = await getCookieHeader();

    try {
      await deleteTask(familyId, taskId, cookieHeader);

      const result = {
        taskId,
        status: "deleted",
        message: `Task ${taskId} has been successfully deleted`,
      };

      console.log("Delete Task Tool with result", result);
      return result;
    } catch (error) {
      console.error("Error deleting task:", error);
      throw new Error(
        `Failed to delete task: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
