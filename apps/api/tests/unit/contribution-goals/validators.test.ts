import { HttpError } from "@lib/http-error";
import {
  addDeductionSchema,
  validateAddDeduction,
} from "@modules/contribution-goals/validators/add-deduction.validator";
import {
  createContributionGoalSchema,
  validateCreateContributionGoal,
} from "@modules/contribution-goals/validators/create-contribution-goal.validator";
import {
  updateContributionGoalSchema,
  validateUpdateContributionGoal,
} from "@modules/contribution-goals/validators/update-contribution-goal.validator";
import type { NextFunction, Request, Response } from "express";
import { ObjectId } from "mongodb";

describe("Contribution Goal Validators", () => {
  describe("createContributionGoalSchema", () => {
    it("should accept valid input", () => {
      const validInput = {
        memberId: new ObjectId().toString(),
        title: "Complete 5 chores",
        description: "Help around the house",
        maxKarma: 100,
      };

      const result = createContributionGoalSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject invalid ObjectId", () => {
      const invalidInput = {
        memberId: "invalid-id",
        title: "Complete 5 chores",
        description: "Help around the house",
        maxKarma: 100,
      };

      const result = createContributionGoalSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid ObjectId format");
      }
    });

    it("should reject empty title", () => {
      const invalidInput = {
        memberId: new ObjectId().toString(),
        title: "",
        description: "Help around the house",
        maxKarma: 100,
      };

      const result = createContributionGoalSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Title is required");
      }
    });

    it("should reject title exceeding 200 characters", () => {
      const invalidInput = {
        memberId: new ObjectId().toString(),
        title: "a".repeat(201),
        description: "Help around the house",
        maxKarma: 100,
      };

      const result = createContributionGoalSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Title must not exceed 200 characters",
        );
      }
    });

    it("should reject description exceeding 2000 characters", () => {
      const invalidInput = {
        memberId: new ObjectId().toString(),
        title: "Complete 5 chores",
        description: "a".repeat(2001),
        maxKarma: 100,
      };

      const result = createContributionGoalSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Description must not exceed 2000 characters",
        );
      }
    });

    it("should reject non-integer maxKarma", () => {
      const invalidInput = {
        memberId: new ObjectId().toString(),
        title: "Complete 5 chores",
        description: "Help around the house",
        maxKarma: 100.5,
      };

      const result = createContributionGoalSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Max karma must be an integer",
        );
      }
    });

    it("should reject maxKarma less than 1", () => {
      const invalidInput = {
        memberId: new ObjectId().toString(),
        title: "Complete 5 chores",
        description: "Help around the house",
        maxKarma: 0,
      };

      const result = createContributionGoalSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Max karma must be at least 1",
        );
      }
    });

    it("should reject maxKarma greater than 10000", () => {
      const invalidInput = {
        memberId: new ObjectId().toString(),
        title: "Complete 5 chores",
        description: "Help around the house",
        maxKarma: 10001,
      };

      const result = createContributionGoalSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Max karma cannot exceed 10000",
        );
      }
    });

    it("should accept maxKarma at boundary values (1 and 10000)", () => {
      const validInput1 = {
        memberId: new ObjectId().toString(),
        title: "Complete 5 chores",
        description: "Help around the house",
        maxKarma: 1,
      };

      const validInput2 = {
        memberId: new ObjectId().toString(),
        title: "Complete 5 chores",
        description: "Help around the house",
        maxKarma: 10000,
      };

      expect(createContributionGoalSchema.safeParse(validInput1).success).toBe(
        true,
      );
      expect(createContributionGoalSchema.safeParse(validInput2).success).toBe(
        true,
      );
    });
  });

  describe("updateContributionGoalSchema", () => {
    it("should accept valid partial update", () => {
      const validInput = {
        title: "Updated title",
      };

      const result = updateContributionGoalSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should accept update with all fields", () => {
      const validInput = {
        title: "Updated title",
        description: "Updated description",
        maxKarma: 200,
      };

      const result = updateContributionGoalSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject empty object", () => {
      const invalidInput = {};

      const result = updateContributionGoalSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "At least one field must be provided for update",
        );
      }
    });

    it("should reject empty title", () => {
      const invalidInput = {
        title: "",
      };

      const result = updateContributionGoalSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Title cannot be empty");
      }
    });

    it("should reject title exceeding 200 characters", () => {
      const invalidInput = {
        title: "a".repeat(201),
      };

      const result = updateContributionGoalSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Title must not exceed 200 characters",
        );
      }
    });

    it("should reject description exceeding 2000 characters", () => {
      const invalidInput = {
        description: "a".repeat(2001),
      };

      const result = updateContributionGoalSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Description must not exceed 2000 characters",
        );
      }
    });

    it("should reject non-integer maxKarma", () => {
      const invalidInput = {
        maxKarma: 100.5,
      };

      const result = updateContributionGoalSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Max karma must be an integer",
        );
      }
    });

    it("should reject maxKarma less than 1", () => {
      const invalidInput = {
        maxKarma: 0,
      };

      const result = updateContributionGoalSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Max karma must be at least 1",
        );
      }
    });

    it("should reject maxKarma greater than 10000", () => {
      const invalidInput = {
        maxKarma: 10001,
      };

      const result = updateContributionGoalSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Max karma cannot exceed 10000",
        );
      }
    });
  });

  describe("addDeductionSchema", () => {
    it("should accept valid input", () => {
      const validInput = {
        amount: 10,
        reason: "Forgot to complete chore",
      };

      const result = addDeductionSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject non-integer amount", () => {
      const invalidInput = {
        amount: 10.5,
        reason: "Forgot to complete chore",
      };

      const result = addDeductionSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Amount must be an integer",
        );
      }
    });

    it("should reject zero amount", () => {
      const invalidInput = {
        amount: 0,
        reason: "Forgot to complete chore",
      };

      const result = addDeductionSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Amount must be a positive number",
        );
      }
    });

    it("should reject negative amount", () => {
      const invalidInput = {
        amount: -10,
        reason: "Forgot to complete chore",
      };

      const result = addDeductionSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Amount must be a positive number",
        );
      }
    });

    it("should reject empty reason", () => {
      const invalidInput = {
        amount: 10,
        reason: "",
      };

      const result = addDeductionSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Reason is required");
      }
    });

    it("should reject reason exceeding 500 characters", () => {
      const invalidInput = {
        amount: 10,
        reason: "a".repeat(501),
      };

      const result = addDeductionSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Reason must not exceed 500 characters",
        );
      }
    });
  });

  describe("Middleware functions", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockRequest = {
        body: {},
      };
      mockResponse = {};
      mockNext = jest.fn();
    });

    describe("validateCreateContributionGoal", () => {
      it("should call next() for valid input", () => {
        mockRequest.body = {
          memberId: new ObjectId().toString(),
          title: "Complete 5 chores",
          description: "Help around the house",
          maxKarma: 100,
        };

        validateCreateContributionGoal(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
      });

      it("should throw HttpError for invalid input", () => {
        mockRequest.body = {
          memberId: "invalid-id",
          title: "Complete 5 chores",
          description: "Help around the house",
          maxKarma: 100,
        };

        expect(() => {
          validateCreateContributionGoal(
            mockRequest as Request,
            mockResponse as Response,
            mockNext,
          );
        }).toThrow(HttpError);
      });
    });

    describe("validateUpdateContributionGoal", () => {
      it("should call next() for valid input", () => {
        mockRequest.body = {
          title: "Updated title",
        };

        validateUpdateContributionGoal(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
      });

      it("should throw HttpError for empty object", () => {
        mockRequest.body = {};

        expect(() => {
          validateUpdateContributionGoal(
            mockRequest as Request,
            mockResponse as Response,
            mockNext,
          );
        }).toThrow(HttpError);
      });
    });

    describe("validateAddDeduction", () => {
      it("should call next() for valid input", () => {
        mockRequest.body = {
          amount: 10,
          reason: "Forgot to complete chore",
        };

        validateAddDeduction(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
      });

      it("should throw HttpError for invalid input", () => {
        mockRequest.body = {
          amount: -10,
          reason: "Forgot to complete chore",
        };

        expect(() => {
          validateAddDeduction(
            mockRequest as Request,
            mockResponse as Response,
            mockNext,
          );
        }).toThrow(HttpError);
      });
    });
  });
});
