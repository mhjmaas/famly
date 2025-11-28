import { z } from "zod";
import { deleteTask } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const deleteMultipleTasksTool = {
  description:
    "Delete multiple tasks at once for a family. This is a convenience method for deleting several tasks in a single operation.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
    taskIds: z
      .array(z.string())
      .min(1)
      .max(10)
      .describe("Array of task IDs to delete (maximum 10 tasks)"),
  }),
  execute: async ({
    familyId,
    taskIds,
  }: {
    familyId: string;
    taskIds: string[];
  }) => {
    // Get cookie header for authentication
    const cookieHeader = await getCookieHeader();

    try {
      const deletedTasks = [];
      const errors = [];

      // Delete each task sequentially
      for (let i = 0; i < taskIds.length; i++) {
        const taskId = taskIds[i];
        try {
          await deleteTask(familyId, taskId, cookieHeader);

          deletedTasks.push({
            taskId,
            status: "deleted",
          });
        } catch (error) {
          errors.push({
            index: i,
            taskId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      const result = {
        deleted: deletedTasks,
        totalDeleted: deletedTasks.length,
        totalRequested: taskIds.length,
        errors: errors.length > 0 ? errors : undefined,
      };

      console.log("Delete Multiple Tasks Tool with result", result);
      return result;
    } catch (error) {
      console.error("Error deleting multiple tasks:", error);
      throw new Error(
        `Failed to delete tasks: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
