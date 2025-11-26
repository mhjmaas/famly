import { z } from "zod";
import { type CreateTaskRequest, createTask } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const createTaskTool = {
  description:
    "Create a new task for a family member or role. The task can have a due date and karma points.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
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
  execute: async ({
    familyId,
    name,
    description,
    dueDate,
    assignment,
    karma,
  }: {
    familyId: string;
    name: string;
    description?: string;
    dueDate?: string;
    assignment: {
      type: "member" | "role" | "unassigned";
      memberId?: string;
      role?: "parent" | "child";
    };
    karma?: number;
  }) => {
    // Get cookie header for authentication
    const cookieHeader = await getCookieHeader();

    try {
      // Build task data with proper discriminated union for assignment
      const taskData: CreateTaskRequest = {
        name,
        description,
        dueDate,
        assignment:
          assignment.type === "unassigned"
            ? { type: "unassigned" }
            : assignment.type === "member" && assignment.memberId
              ? { type: "member", memberId: assignment.memberId }
              : assignment.type === "role" && assignment.role
                ? { type: "role", role: assignment.role }
                : { type: "unassigned" }, // fallback
        metadata: karma !== undefined ? { karma } : undefined,
      };

      const task = await createTask(familyId, taskData, cookieHeader);

      const result = {
        taskId: task._id,
        name: task.name,
        description: task.description,
        dueDate: task.dueDate,
        assignment: task.assignment,
        karma: task.metadata?.karma,
        createdAt: task.createdAt,
      };

      console.log("Create Task Tool with result", result);
      return result;
    } catch (error) {
      console.error("Error creating task:", error);
      throw new Error(
        `Failed to create task: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
