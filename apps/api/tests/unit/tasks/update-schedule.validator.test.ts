import { updateScheduleSchema } from "@/modules/tasks/validators/update-schedule.validator";
import { ObjectId } from "mongodb";

describe("updateScheduleSchema", () => {
  describe("partial updates", () => {
    it("should validate update with only name", () => {
      const input = {
        name: "Updated schedule name",
      };

      const result = updateScheduleSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe(input.name);
      }
    });

    it("should validate update with only description", () => {
      const input = {
        description: "Updated description",
      };

      const result = updateScheduleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should validate update with only assignment", () => {
      const input = {
        assignment: {
          type: "role" as const,
          role: "parent" as const,
        },
      };

      const result = updateScheduleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should validate update with only schedule", () => {
      const input = {
        schedule: {
          daysOfWeek: [1, 3, 5],
          weeklyInterval: 2,
          startDate: new Date("2025-02-01"),
        },
      };

      const result = updateScheduleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should validate update with only timeOfDay", () => {
      const input = {
        timeOfDay: "14:30",
      };

      const result = updateScheduleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should validate update with multiple fields", () => {
      const input = {
        name: "New name",
        description: "New description",
        timeOfDay: "10:00",
      };

      const result = updateScheduleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should validate empty update object", () => {
      const input = {};

      const result = updateScheduleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("field validation", () => {
    it("should reject name exceeding 200 characters", () => {
      const input = {
        name: "a".repeat(201),
      };

      const result = updateScheduleSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject description exceeding 2000 characters", () => {
      const input = {
        description: "a".repeat(2001),
      };

      const result = updateScheduleSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid timeOfDay format", () => {
      const input = {
        timeOfDay: "25:00",
      };

      const result = updateScheduleSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("schedule updates", () => {
    it("should validate schedule with all fields", () => {
      const input = {
        schedule: {
          daysOfWeek: [0, 6],
          weeklyInterval: 1,
          startDate: new Date("2025-01-01"),
          endDate: new Date("2025-12-31"),
        },
      };

      const result = updateScheduleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should validate schedule with partial fields", () => {
      const input = {
        schedule: {
          daysOfWeek: [1],
          weeklyInterval: 1,
          startDate: new Date("2025-01-01"),
        },
      };

      const result = updateScheduleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject schedule with invalid daysOfWeek", () => {
      const input = {
        schedule: {
          daysOfWeek: [7],
          weeklyInterval: 1,
          startDate: new Date("2025-01-01"),
        },
      };

      const result = updateScheduleSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject schedule with empty daysOfWeek", () => {
      const input = {
        schedule: {
          daysOfWeek: [],
          weeklyInterval: 1,
          startDate: new Date("2025-01-01"),
        },
      };

      const result = updateScheduleSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject schedule with invalid weeklyInterval", () => {
      const input = {
        schedule: {
          daysOfWeek: [1],
          weeklyInterval: 5,
          startDate: new Date("2025-01-01"),
        },
      };

      const result = updateScheduleSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject schedule with endDate before startDate", () => {
      const input = {
        schedule: {
          daysOfWeek: [1],
          weeklyInterval: 1,
          startDate: new Date("2025-12-31"),
          endDate: new Date("2025-01-01"),
        },
      };

      const result = updateScheduleSchema.safeParse(input);
      expect(result.success).toBe(false);
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

      const result = updateScheduleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should validate changing to role assignment", () => {
      const input = {
        assignment: {
          type: "role" as const,
          role: "child" as const,
        },
      };

      const result = updateScheduleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should validate changing to unassigned", () => {
      const input = {
        assignment: {
          type: "unassigned" as const,
        },
      };

      const result = updateScheduleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid assignment", () => {
      const input = {
        assignment: {
          type: "invalid",
        },
      };

      const result = updateScheduleSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
