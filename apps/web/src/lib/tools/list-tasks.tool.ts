import { z } from "zod";
import { getTasks } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const listTasksTool = {
  description:
    "List tasks for a family. Can filter to show all tasks, tasks due today, or tasks completed today.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
    filter: z
      .enum(["all", "today", "completed-today"])
      .optional()
      .describe(
        'Filter: "all" for all tasks (default), "today" for tasks due today, "completed-today" for tasks completed today',
      ),
  }),
  execute: async ({
    familyId,
    filter = "all",
  }: {
    familyId: string;
    filter?: "all" | "today" | "completed-today";
  }) => {
    // Get cookie header for authentication
    const cookieHeader = await getCookieHeader();

    try {
      let params = {};

      // Build query parameters based on filter
      if (filter === "today" || filter === "completed-today") {
        const today = new Date().toISOString().split("T")[0];
        params = {
          dueDateFrom: today,
          dueDateTo: today,
        };
      }

      // Fetch tasks
      let tasks = await getTasks(familyId, params, cookieHeader);

      // Filter for completed today if requested
      if (filter === "completed-today") {
        const today = new Date().toISOString().split("T")[0];
        tasks = tasks.filter((task) => {
          if (!task.completedAt) return false;
          const completedDate = new Date(task.completedAt)
            .toISOString()
            .split("T")[0];
          return completedDate === today;
        });
      }

      const result = tasks.map((task) => ({
        taskId: task._id,
        name: task.name,
        description: task.description,
        dueDate: task.dueDate,
        assignment: task.assignment,
        completedAt: task.completedAt,
        completedBy: task.completedBy,
        karma: task.metadata?.karma,
        createdAt: task.createdAt,
      }));

      console.log("List Tasks Tool with result", result);
      return {
        tasks: result,
        totalCount: result.length,
        filter: filter,
      };
    } catch (error) {
      console.error("Error listing tasks:", error);
      throw new Error(
        `Failed to list tasks: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
