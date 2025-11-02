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

    it("should accept minimum positive amount (1)", () => {
      const validInput = {
        userId: new ObjectId().toString(),
        amount: 1,
      };

      const result = grantKarmaSchema.safeParse(validInput);

      expect(result.success).toBe(true);
    });

    it("should accept maximum positive amount (100,000)", () => {
      const validInput = {
        userId: new ObjectId().toString(),
        amount: 100000,
      };

      const result = grantKarmaSchema.safeParse(validInput);

      expect(result.success).toBe(true);
    });

    it("should accept minimum negative amount (-100,000)", () => {
      const validInput = {
        userId: new ObjectId().toString(),
        amount: -100000,
      };

      const result = grantKarmaSchema.safeParse(validInput);

      expect(result.success).toBe(true);
    });

    it("should accept negative amount (-50)", () => {
      const validInput = {
        userId: new ObjectId().toString(),
        amount: -50,
        description: "Penalty for not completing chores",
      };

      const result = grantKarmaSchema.safeParse(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(-50);
      }
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

    it("should reject zero amount", () => {
      const invalidInput = {
        userId: new ObjectId().toString(),
        amount: 0,
      };

      const result = grantKarmaSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject amount below -100,000", () => {
      const invalidInput = {
        userId: new ObjectId().toString(),
        amount: -100001,
      };

      const result = grantKarmaSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject amount greater than 100,000", () => {
      const invalidInput = {
        userId: new ObjectId().toString(),
        amount: 100001,
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
