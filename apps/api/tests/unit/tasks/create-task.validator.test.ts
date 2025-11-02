import { ObjectId } from "mongodb";
import { createTaskSchema } from "@/modules/tasks/validators/create-task.validator";

describe("createTaskSchema", () => {
  describe("valid task creation", () => {
    it("should validate task with member assignment", () => {
      const input = {
        name: "Clean the kitchen",
        description: "Wipe counters and do dishes",
        dueDate: new Date("2025-01-15T10:00:00Z"),
        assignment: {
          type: "member" as const,
          memberId: new ObjectId().toString(),
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe(input.name);
        expect(result.data.assignment.type).toBe("member");
      }
    });

    it("should validate task with role assignment", () => {
      const input = {
        name: "Take out trash",
        assignment: {
          type: "role" as const,
          role: "child" as const,
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.assignment.type).toBe("role");
        if (result.data.assignment.type === "role") {
          expect(result.data.assignment.role).toBe("child");
        }
      }
    });

    it("should validate task with unassigned", () => {
      const input = {
        name: "Water plants",
        assignment: {
          type: "unassigned" as const,
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.assignment.type).toBe("unassigned");
      }
    });

    it("should validate task with parent role", () => {
      const input = {
        name: "Pay bills",
        assignment: {
          type: "role" as const,
          role: "parent" as const,
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should validate minimal task (name and assignment only)", () => {
      const input = {
        name: "Quick task",
        assignment: {
          type: "unassigned" as const,
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
        expect(result.data.dueDate).toBeUndefined();
      }
    });
  });

  describe("name validation", () => {
    it("should reject task with missing name", () => {
      const input = {
        assignment: {
          type: "unassigned" as const,
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("name");
      }
    });

    it("should reject task with empty name", () => {
      const input = {
        name: "",
        assignment: {
          type: "unassigned" as const,
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject task with name exceeding 200 characters", () => {
      const input = {
        name: "a".repeat(201),
        assignment: {
          type: "unassigned" as const,
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("200");
      }
    });

    it("should accept task with name at 200 characters", () => {
      const input = {
        name: "a".repeat(200),
        assignment: {
          type: "unassigned" as const,
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("description validation", () => {
    it("should accept task without description", () => {
      const input = {
        name: "Task",
        assignment: {
          type: "unassigned" as const,
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject description exceeding 2000 characters", () => {
      const input = {
        name: "Task",
        description: "a".repeat(2001),
        assignment: {
          type: "unassigned" as const,
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("2000");
      }
    });

    it("should accept description at 2000 characters", () => {
      const input = {
        name: "Task",
        description: "a".repeat(2000),
        assignment: {
          type: "unassigned" as const,
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("due date validation", () => {
    it("should accept valid ISO 8601 date string", () => {
      const input = {
        name: "Task",
        dueDate: "2025-01-15T10:30:00Z",
        assignment: {
          type: "unassigned" as const,
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dueDate).toBeInstanceOf(Date);
      }
    });

    it("should accept Date object", () => {
      const input = {
        name: "Task",
        dueDate: new Date("2025-01-15T10:30:00Z"),
        assignment: {
          type: "unassigned" as const,
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid date format", () => {
      const input = {
        name: "Task",
        dueDate: "not-a-date",
        assignment: {
          type: "unassigned" as const,
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("assignment validation", () => {
    it("should reject missing assignment", () => {
      const input = {
        name: "Task",
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("assignment");
      }
    });

    it("should reject invalid assignment type", () => {
      const input = {
        name: "Task",
        assignment: {
          type: "invalid",
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject member assignment with missing memberId", () => {
      const input = {
        name: "Task",
        assignment: {
          type: "member" as const,
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject member assignment with invalid ObjectId format", () => {
      const input = {
        name: "Task",
        assignment: {
          type: "member" as const,
          memberId: "invalid-id",
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("ObjectId");
      }
    });

    it("should reject role assignment with invalid role", () => {
      const input = {
        name: "Task",
        assignment: {
          type: "role" as const,
          role: "invalid-role",
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject role assignment with missing role", () => {
      const input = {
        name: "Task",
        assignment: {
          type: "role" as const,
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("metadata validation", () => {
    it("should accept task with karma metadata", () => {
      const input = {
        name: "Task",
        assignment: {
          type: "unassigned" as const,
        },
        metadata: {
          karma: 50,
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata?.karma).toBe(50);
      }
    });

    it("should accept task with claimId metadata", () => {
      const claimId = new ObjectId().toString();
      const input = {
        name: "Provide reward",
        assignment: {
          type: "role" as const,
          role: "parent" as const,
        },
        metadata: {
          claimId,
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata?.claimId).toBe(claimId);
      }
    });

    it("should accept task with both karma and claimId metadata", () => {
      const claimId = new ObjectId().toString();
      const input = {
        name: "Task",
        assignment: {
          type: "unassigned" as const,
        },
        metadata: {
          karma: 30,
          claimId,
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata?.karma).toBe(30);
        expect(result.data.metadata?.claimId).toBe(claimId);
      }
    });

    it("should accept task without metadata", () => {
      const input = {
        name: "Task",
        assignment: {
          type: "unassigned" as const,
        },
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata).toBeUndefined();
      }
    });

    it("should accept task with empty metadata object", () => {
      const input = {
        name: "Task",
        assignment: {
          type: "unassigned" as const,
        },
        metadata: {},
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
});
