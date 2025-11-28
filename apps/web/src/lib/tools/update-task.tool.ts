import { z } from "zod";
import { type UpdateTaskRequest, updateTask } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const updateTaskTool = {
  description:
    "Update a task by ID. Can modify name, description, due date, assignment, or complete/uncomplete the task.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family the task belongs to"),
    taskId: z.string().describe("The ID of the task to update"),
    name: z.string().optional().describe("New name for the task"),
    description: z.string().optional().describe("New description for the task"),
    dueDate: z
      .string()
      .optional()
      .describe("New due date for the task (ISO format)"),
    assignment: z
      .object({
        type: z
          .enum(["member", "role", "unassigned"])
          .describe("Assignment type: member, role, or unassigned"),
        memberId: z
          .string()
          .optional()
          .describe('Member ID if type is "member"'),
        role: z
          .enum(["parent", "child"])
          .optional()
          .describe('Role if type is "role"'),
      })
      .optional()
      .describe("New assignment for the task"),
    completedAt: z
      .string()
      .optional()
      .describe("Set to current date to complete, or null to uncomplete"),
    metadata: z
      .object({
        karma: z
          .number()
          .optional()
          .describe("Karma points for completing this task"),
      })
      .optional()
      .describe("Metadata including karma points"),
  }),
  execute: async ({
    familyId,
    taskId,
    name,
    description,
    dueDate,
    assignment,
    completedAt,
    metadata,
  }: {
    familyId: string;
    taskId: string;
    name?: string;
    description?: string;
    dueDate?: string;
    assignment?: {
      type: "member" | "role" | "unassigned";
      memberId?: string;
      role?: "parent" | "child";
    };
    completedAt?: string | null;
    metadata?: {
      karma?: number;
    };
  }) => {
    // Get cookie header for authentication
    const cookieHeader = await getCookieHeader();

    try {
      // Build update data object with only provided fields
      const updateData: UpdateTaskRequest = {};

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (dueDate !== undefined) updateData.dueDate = dueDate;
      if (completedAt !== undefined) updateData.completedAt = completedAt;
      if (metadata !== undefined) updateData.metadata = metadata;

      // Handle assignment as a discriminated union
      if (assignment !== undefined) {
        if (assignment.type === "unassigned") {
          updateData.assignment = { type: "unassigned" };
        } else if (assignment.type === "member" && assignment.memberId) {
          updateData.assignment = {
            type: "member",
            memberId: assignment.memberId,
          };
        } else if (assignment.type === "role" && assignment.role) {
          updateData.assignment = { type: "role", role: assignment.role };
        }
      }

      const task = await updateTask(familyId, taskId, updateData, cookieHeader);

      const result = {
        taskId: task._id,
        name: task.name,
        description: task.description,
        dueDate: task.dueDate,
        assignment: task.assignment,
        completedAt: task.completedAt,
        completedBy: task.completedBy,
        karma: task.metadata?.karma,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      };

      console.log("Update Task Tool with result", result);
      return result;
    } catch (error) {
      console.error("Error updating task:", error);
      throw new Error(
        `Failed to update task: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
