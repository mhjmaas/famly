import { z } from "zod";
import { type CreateTaskRequest, createTask } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const createMultipleTasksTool = {
  description:
    "Create multiple tasks at once for a family. This is a convenience method for creating several tasks in a single operation.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
    tasks: z
      .array(
        z.object({
          name: z.string().describe("Name of the task"),
          description: z
            .string()
            .optional()
            .describe("Optional description of the task"),
          dueDate: z
            .string()
            .optional()
            .describe(
              "Optional due date for the task (ISO format, e.g., 2024-12-31)",
            ),
          assignment: z
            .object({
              type: z
                .enum(["member", "role", "unassigned"])
                .describe(
                  "Assignment type: member (specific person), role (parent/child), or unassigned",
                ),
              memberId: z
                .string()
                .optional()
                .describe('Member ID if type is "member"'),
              role: z
                .enum(["parent", "child"])
                .optional()
                .describe('Role if type is "role"'),
            })
            .describe("Who the task is assigned to"),
          karma: z
            .number()
            .optional()
            .describe("Optional karma points awarded for completing this task"),
        }),
      )
      .min(1)
      .max(10)
      .describe("Array of tasks to create (maximum 10 tasks)"),
  }),
  execute: async ({
    familyId,
    tasks,
  }: {
    familyId: string;
    tasks: Array<{
      name: string;
      description?: string;
      dueDate?: string;
      assignment: {
        type: "member" | "role" | "unassigned";
        memberId?: string;
        role?: "parent" | "child";
      };
      karma?: number;
    }>;
  }) => {
    // Get cookie header for authentication
    const cookieHeader = await getCookieHeader();

    try {
      const createdTasks = [];
      const errors = [];

      // Create each task sequentially
      for (let i = 0; i < tasks.length; i++) {
        const taskInput = tasks[i];
        try {
          // Build task data with proper discriminated union for assignment
          const taskData: CreateTaskRequest = {
            name: taskInput.name,
            description: taskInput.description,
            dueDate: taskInput.dueDate,
            assignment:
              taskInput.assignment.type === "unassigned"
                ? { type: "unassigned" }
                : taskInput.assignment.type === "member" &&
                    taskInput.assignment.memberId
                  ? { type: "member", memberId: taskInput.assignment.memberId }
                  : taskInput.assignment.type === "role" &&
                      taskInput.assignment.role
                    ? { type: "role", role: taskInput.assignment.role }
                    : { type: "unassigned" }, // fallback
            metadata:
              taskInput.karma !== undefined
                ? { karma: taskInput.karma }
                : undefined,
          };

          const task = await createTask(familyId, taskData, cookieHeader);

          createdTasks.push({
            taskId: task._id,
            name: task.name,
            description: task.description,
            dueDate: task.dueDate,
            assignment: task.assignment,
            karma: task.metadata?.karma,
            createdAt: task.createdAt,
          });
        } catch (error) {
          errors.push({
            index: i,
            taskName: taskInput.name,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      const result = {
        created: createdTasks,
        totalCreated: createdTasks.length,
        totalRequested: tasks.length,
        errors: errors.length > 0 ? errors : undefined,
      };

      console.log("Create Multiple Tasks Tool with result", result);
      return result;
    } catch (error) {
      console.error("Error creating multiple tasks:", error);
      throw new Error(
        `Failed to create tasks: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
