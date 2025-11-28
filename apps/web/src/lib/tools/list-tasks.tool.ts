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
    console.log("List Tasks Tool called with", { familyId, filter });
    // Get cookie header for authentication
    const cookieHeader = await getCookieHeader();

    try {
      let params = {};

      // Build query parameters based on filter
      if (filter === "today" || filter === "completed-today") {
        const today = new Date();
        const startDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          0,
          0,
          0,
        );
        const endDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          23,
          59,
          59,
        );

        params = {
          from: startDate.toISOString(),
          to: endDate.toISOString(),
        };

        console.log("Filtering tasks for today:", { startDate, endDate });
        console.log(params);
      }

      // Fetch tasks
      let tasks = await getTasks(familyId, params, cookieHeader);

      // Filter for completed today if requested
      if (filter === "completed-today") {
        const today = new Date();
        const startDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          0,
          0,
          0,
        );
        const endDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          23,
          59,
          59,
        );

        tasks = tasks.filter((task) => {
          if (!task.completedAt) return false;
          const completedDate = new Date(task.completedAt);
          return completedDate >= startDate && completedDate <= endDate;
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
