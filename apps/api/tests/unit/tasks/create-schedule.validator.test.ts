import { ObjectId } from "mongodb";
import { createScheduleSchema } from "@/modules/tasks/validators/create-schedule.validator";

describe("createScheduleSchema", () => {
  describe("valid schedule creation", () => {
    it("should validate complete schedule with all fields", () => {
      const input = {
        name: "Weekly cleaning",
        description: "Clean the house every week",
        assignment: {
          type: "role" as const,
          role: "child" as const,
        },
        schedule: {
          daysOfWeek: [1, 3, 5],
          weeklyInterval: 1,
          startDate: new Date("2025-01-01"),
          endDate: new Date("2025-12-31"),
        },
        timeOfDay: "09:00",
      };

      const result = createScheduleSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe(input.name);
        expect(result.data.schedule.daysOfWeek).toEqual([1, 3, 5]);
        expect(result.data.schedule.weeklyInterval).toBe(1);
      }
    });

    it("should validate schedule without optional fields", () => {
      const input = {
        name: "Basic schedule",
        assignment: {
          type: "unassigned" as const,
        },
        schedule: {
          daysOfWeek: [0],
          weeklyInterval: 1,
          startDate: new Date("2025-01-01"),
        },
      };

      const result = createScheduleSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
        expect(result.data.schedule.endDate).toBeUndefined();
        expect(result.data.timeOfDay).toBeUndefined();
      }
    });

    it("should validate schedule with all weeklyInterval values", () => {
      for (const interval of [1, 2, 3, 4]) {
        const input = {
          name: "Test",
          assignment: { type: "unassigned" as const },
          schedule: {
            daysOfWeek: [1],
            weeklyInterval: interval as 1 | 2 | 3 | 4,
            startDate: new Date("2025-01-01"),
          },
        };

        const result = createScheduleSchema.safeParse(input);
        expect(result.success).toBe(true);
      }
    });
  });

  describe("days of week validation", () => {
    it("should accept valid days 0-6", () => {
      const input = {
        name: "Test",
        assignment: { type: "unassigned" as const },
        schedule: {
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          weeklyInterval: 1,
          startDate: new Date("2025-01-01"),
        },
      };

      const result = createScheduleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject day value 7", () => {
      const input = {
        name: "Test",
        assignment: { type: "unassigned" as const },
        schedule: {
          daysOfWeek: [7],
          weeklyInterval: 1,
          startDate: new Date("2025-01-01"),
        },
      };

      const result = createScheduleSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("0");
        expect(result.error.issues[0].message).toContain("6");
      }
    });

    it("should reject day value -1", () => {
      const input = {
        name: "Test",
        assignment: { type: "unassigned" as const },
        schedule: {
          daysOfWeek: [-1],
          weeklyInterval: 1,
          startDate: new Date("2025-01-01"),
        },
      };

      const result = createScheduleSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty daysOfWeek array", () => {
      const input = {
        name: "Test",
        assignment: { type: "unassigned" as const },
        schedule: {
          daysOfWeek: [],
          weeklyInterval: 1,
          startDate: new Date("2025-01-01"),
        },
      };

      const result = createScheduleSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("At least one");
      }
    });

    it("should accept single day", () => {
      const input = {
        name: "Test",
        assignment: { type: "unassigned" as const },
        schedule: {
          daysOfWeek: [3],
          weeklyInterval: 1,
          startDate: new Date("2025-01-01"),
        },
      };

      const result = createScheduleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("weekly interval validation", () => {
    it("should reject weeklyInterval 0", () => {
      const input = {
        name: "Test",
        assignment: { type: "unassigned" as const },
        schedule: {
          daysOfWeek: [1],
          weeklyInterval: 0,
          startDate: new Date("2025-01-01"),
        },
      };

      const result = createScheduleSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("1");
        expect(result.error.issues[0].message).toContain("4");
      }
    });

    it("should reject weeklyInterval 5", () => {
      const input = {
        name: "Test",
        assignment: { type: "unassigned" as const },
        schedule: {
          daysOfWeek: [1],
          weeklyInterval: 5,
          startDate: new Date("2025-01-01"),
        },
      };

      const result = createScheduleSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("date validation", () => {
    it("should require startDate", () => {
      const input = {
        name: "Test",
        assignment: { type: "unassigned" as const },
        schedule: {
          daysOfWeek: [1],
          weeklyInterval: 1,
        },
      };

      const result = createScheduleSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("startDate");
      }
    });

    it("should accept valid startDate and endDate", () => {
      const input = {
        name: "Test",
        assignment: { type: "unassigned" as const },
        schedule: {
          daysOfWeek: [1],
          weeklyInterval: 1,
          startDate: new Date("2025-01-01"),
          endDate: new Date("2025-12-31"),
        },
      };

      const result = createScheduleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept endDate after startDate", () => {
      const input = {
        name: "Test",
        assignment: { type: "unassigned" as const },
        schedule: {
          daysOfWeek: [1],
          weeklyInterval: 1,
          startDate: new Date("2025-01-01"),
          endDate: new Date("2025-01-02"),
        },
      };

      const result = createScheduleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject endDate before startDate", () => {
      const input = {
        name: "Test",
        assignment: { type: "unassigned" as const },
        schedule: {
          daysOfWeek: [1],
          weeklyInterval: 1,
          startDate: new Date("2025-12-31"),
          endDate: new Date("2025-01-01"),
        },
      };

      const result = createScheduleSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("after");
      }
    });
  });

  describe("timeOfDay validation", () => {
    it("should accept valid HH:mm format", () => {
      const validTimes = ["00:00", "09:30", "12:00", "23:59"];

      for (const time of validTimes) {
        const input = {
          name: "Test",
          assignment: { type: "unassigned" as const },
          schedule: {
            daysOfWeek: [1],
            weeklyInterval: 1,
            startDate: new Date("2025-01-01"),
          },
          timeOfDay: time,
        };

        const result = createScheduleSchema.safeParse(input);
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid timeOfDay format", () => {
      const invalidTimes = ["9:30", "25:00", "12:60", "not-a-time", "12:00:00"];

      for (const time of invalidTimes) {
        const input = {
          name: "Test",
          assignment: { type: "unassigned" as const },
          schedule: {
            daysOfWeek: [1],
            weeklyInterval: 1,
            startDate: new Date("2025-01-01"),
          },
          timeOfDay: time,
        };

        const result = createScheduleSchema.safeParse(input);
        expect(result.success).toBe(false);
      }
    });
  });

  describe("assignment validation", () => {
    it("should accept member assignment", () => {
      const input = {
        name: "Test",
        assignment: {
          type: "member" as const,
          memberId: new ObjectId().toString(),
        },
        schedule: {
          daysOfWeek: [1],
          weeklyInterval: 1,
          startDate: new Date("2025-01-01"),
        },
      };

      const result = createScheduleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept role assignment", () => {
      const input = {
        name: "Test",
        assignment: {
          type: "role" as const,
          role: "parent" as const,
        },
        schedule: {
          daysOfWeek: [1],
          weeklyInterval: 1,
          startDate: new Date("2025-01-01"),
        },
      };

      const result = createScheduleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid assignment", () => {
      const input = {
        name: "Test",
        assignment: {
          type: "invalid",
        },
        schedule: {
          daysOfWeek: [1],
          weeklyInterval: 1,
          startDate: new Date("2025-01-01"),
        },
      };

      const result = createScheduleSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
