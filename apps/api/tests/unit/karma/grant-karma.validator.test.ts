import { ObjectId } from "mongodb";
import { grantKarmaSchema } from "../../../src/modules/karma/validators/grant-karma.validator";

describe("Grant Karma Validator", () => {
  describe("grantKarmaSchema", () => {
    it("should accept valid grant karma input", () => {
      const validInput = {
        userId: new ObjectId().toString(),
        amount: 50,
        description: "Great job on cleaning your room!",
      };

      const result = grantKarmaSchema.safeParse(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    it("should accept valid input without description", () => {
      const validInput = {
        userId: new ObjectId().toString(),
        amount: 25,
      };

      const result = grantKarmaSchema.safeParse(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
      }
    });

    it("should accept minimum amount (1)", () => {
      const validInput = {
        userId: new ObjectId().toString(),
        amount: 1,
      };

      const result = grantKarmaSchema.safeParse(validInput);

      expect(result.success).toBe(true);
    });

    it("should accept maximum amount (1000)", () => {
      const validInput = {
        userId: new ObjectId().toString(),
        amount: 1000,
      };

      const result = grantKarmaSchema.safeParse(validInput);

      expect(result.success).toBe(true);
    });

    it("should reject invalid ObjectId", () => {
      const invalidInput = {
        userId: "not-a-valid-objectid",
        amount: 50,
      };

      const result = grantKarmaSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject empty userId", () => {
      const invalidInput = {
        userId: "",
        amount: 50,
      };

      const result = grantKarmaSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject missing userId", () => {
      const invalidInput = {
        amount: 50,
      };

      const result = grantKarmaSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject amount less than 1", () => {
      const invalidInput = {
        userId: new ObjectId().toString(),
        amount: 0,
      };

      const result = grantKarmaSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject negative amount", () => {
      const invalidInput = {
        userId: new ObjectId().toString(),
        amount: -10,
      };

      const result = grantKarmaSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject amount greater than 1000", () => {
      const invalidInput = {
        userId: new ObjectId().toString(),
        amount: 1001,
      };

      const result = grantKarmaSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject non-integer amount", () => {
      const invalidInput = {
        userId: new ObjectId().toString(),
        amount: 25.5,
      };

      const result = grantKarmaSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject missing amount", () => {
      const invalidInput = {
        userId: new ObjectId().toString(),
      };

      const result = grantKarmaSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject description exceeding 500 characters", () => {
      const invalidInput = {
        userId: new ObjectId().toString(),
        amount: 50,
        description: "a".repeat(501),
      };

      const result = grantKarmaSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should accept description of exactly 500 characters", () => {
      const validInput = {
        userId: new ObjectId().toString(),
        amount: 50,
        description: "a".repeat(500),
      };

      const result = grantKarmaSchema.safeParse(validInput);

      expect(result.success).toBe(true);
    });

    it("should reject non-string description", () => {
      const invalidInput = {
        userId: new ObjectId().toString(),
        amount: 50,
        description: 123,
      };

      const result = grantKarmaSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });
  });
});
