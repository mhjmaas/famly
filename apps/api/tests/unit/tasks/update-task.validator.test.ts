import { updateTaskSchema } from "@/modules/tasks/validators/update-task.validator";
import { ObjectId } from "mongodb";

describe("updateTaskSchema", () => {
  describe("partial updates", () => {
    it("should validate update with only name", () => {
      const input = {
        name: "Updated task name",
      };

      const result = updateTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe(input.name);
        expect(result.data.description).toBeUndefined();
      }
    });

    it("should validate update with only description", () => {
      const input = {
        description: "Updated description",
      };

      const result = updateTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should validate update with only dueDate", () => {
      const input = {
        dueDate: new Date("2025-01-20T15:00:00Z"),
      };

      const result = updateTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should validate update with only assignment", () => {
      const input = {
        assignment: {
          type: "unassigned" as const,
        },
      };

      const result = updateTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should validate update with multiple fields", () => {
      const input = {
        name: "New name",
        description: "New description",
        dueDate: new Date("2025-01-20T15:00:00Z"),
      };

      const result = updateTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should validate empty update object", () => {
      const input = {};

      const result = updateTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("field-specific validation", () => {
    it("should reject name exceeding 200 characters", () => {
      const input = {
        name: "a".repeat(201),
      };

      const result = updateTaskSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("200");
      }
    });

    it("should reject description exceeding 2000 characters", () => {
      const input = {
        description: "a".repeat(2001),
      };

      const result = updateTaskSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("2000");
      }
    });

    it("should reject invalid dueDate format", () => {
      const input = {
        dueDate: "not-a-date",
      };

      const result = updateTaskSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid assignment type", () => {
      const input = {
        assignment: {
          type: "invalid",
        },
      };

      const result = updateTaskSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject member assignment with invalid ObjectId", () => {
      const input = {
        assignment: {
          type: "member" as const,
          memberId: "invalid-id",
        },
      };

      const result = updateTaskSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("completedAt validation", () => {
    it("should accept valid ISO 8601 completedAt timestamp", () => {
      const input = {
        completedAt: "2025-01-15T10:30:00Z",
      };

      const result = updateTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.completedAt).toBeInstanceOf(Date);
      }
    });

    it("should accept Date object for completedAt", () => {
      const input = {
        completedAt: new Date("2025-01-15T10:30:00Z"),
      };

      const result = updateTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept null for completedAt (mark incomplete)", () => {
      const input = {
        completedAt: null,
      };

      const result = updateTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.completedAt).toBeNull();
      }
    });

    it("should reject invalid completedAt format", () => {
      const input = {
        completedAt: "not-a-date",
      };

      const result = updateTaskSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should accept completedAt with other fields", () => {
      const input = {
        name: "Completed task",
        completedAt: new Date("2025-01-15T10:30:00Z"),
      };

      const result = updateTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("assignment updates", () => {
    it("should validate changing to member assignment", () => {
      const input = {
        assignment: {
          type: "member" as const,
          memberId: new ObjectId().toString(),
        },
      };

      const result = updateTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should validate changing to role assignment", () => {
      const input = {
        assignment: {
          type: "role" as const,
          role: "parent" as const,
        },
      };

      const result = updateTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should validate changing to unassigned", () => {
      const input = {
        assignment: {
          type: "unassigned" as const,
        },
      };

      const result = updateTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
});
