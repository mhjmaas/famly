import { FamilyRole } from "@modules/family/domain/family";
import { addFamilyMemberSchema } from "@modules/family/validators/add-family-member.validator";

describe("addFamilyMemberSchema", () => {
  describe("email validation", () => {
    it("should accept valid email and normalize to lowercase", () => {
      const result = addFamilyMemberSchema.parse({
        email: "Test.User@Example.COM",
        password: "password123",
        name: "Test User",
        birthdate: "1990-01-15",
        role: FamilyRole.Child,
      });

      expect(result.email).toBe("test.user@example.com");
    });

    it("should trim whitespace from email", () => {
      const result = addFamilyMemberSchema.parse({
        email: "  user@example.com  ",
        password: "password123",
        name: "User Name",
        birthdate: "1991-05-20",
        role: FamilyRole.Child,
      });

      expect(result.email).toBe("user@example.com");
    });

    it("should reject invalid email format", () => {
      expect(() =>
        addFamilyMemberSchema.parse({
          email: "not-an-email",
          password: "password123",
          name: "Test User",
          birthdate: "1992-03-10",
          role: FamilyRole.Child,
        }),
      ).toThrow("Invalid email format");
    });

    it("should reject empty email", () => {
      expect(() =>
        addFamilyMemberSchema.parse({
          email: "",
          password: "password123",
          name: "Test User",
          birthdate: "1993-07-25",
          role: FamilyRole.Child,
        }),
      ).toThrow();
    });

    it("should reject missing email", () => {
      expect(() =>
        addFamilyMemberSchema.parse({
          password: "password123",
          name: "Test User",
          birthdate: "1994-11-12",
          role: FamilyRole.Child,
        }),
      ).toThrow();
    });

    it("should reject email exceeding 255 characters", () => {
      const longEmail = `${"a".repeat(250)}@example.com`;
      expect(() =>
        addFamilyMemberSchema.parse({
          email: longEmail,
          password: "password123",
          name: "Test User",
          birthdate: "1995-02-28",
          role: FamilyRole.Child,
        }),
      ).toThrow("Email cannot exceed 255 characters");
    });
  });

  describe("password validation", () => {
    it("should accept password with minimum 8 characters", () => {
      const result = addFamilyMemberSchema.parse({
        email: "user@example.com",
        password: "password",
        name: "Password Test",
        birthdate: "1988-09-09",
        role: FamilyRole.Child,
      });

      expect(result.password).toBe("password");
    });

    it("should reject password shorter than 8 characters", () => {
      expect(() =>
        addFamilyMemberSchema.parse({
          email: "user@example.com",
          password: "pass123",
          name: "Short Pass",
          birthdate: "1989-12-31",
          role: FamilyRole.Child,
        }),
      ).toThrow("Password must be at least 8 characters");
    });

    it("should reject missing password", () => {
      expect(() =>
        addFamilyMemberSchema.parse({
          email: "user@example.com",
          name: "No Password",
          birthdate: "1987-06-06",
          role: FamilyRole.Child,
        }),
      ).toThrow();
    });
  });

  describe("role validation", () => {
    it("should accept Parent role", () => {
      const result = addFamilyMemberSchema.parse({
        email: "user@example.com",
        password: "password123",
        name: "Parent User",
        birthdate: "1980-04-14",
        role: FamilyRole.Parent,
      });

      expect(result.role).toBe(FamilyRole.Parent);
    });

    it("should accept Child role", () => {
      const result = addFamilyMemberSchema.parse({
        email: "user@example.com",
        password: "password123",
        name: "Child User",
        birthdate: "2010-08-22",
        role: FamilyRole.Child,
      });

      expect(result.role).toBe(FamilyRole.Child);
    });

    it("should reject invalid role", () => {
      expect(() =>
        addFamilyMemberSchema.parse({
          email: "user@example.com",
          password: "password123",
          name: "Invalid Role User",
          birthdate: "1985-10-16",
          role: "InvalidRole",
        }),
      ).toThrow();
    });

    it("should reject missing role", () => {
      expect(() =>
        addFamilyMemberSchema.parse({
          email: "user@example.com",
          password: "password123",
          name: "No Role User",
          birthdate: "1986-01-30",
        }),
      ).toThrow();
    });
  });

  describe("name validation", () => {
    it("should accept valid name", () => {
      const result = addFamilyMemberSchema.parse({
        email: "user@example.com",
        password: "password123",
        name: "John Doe",
        birthdate: "2005-03-15",
        role: FamilyRole.Child,
      });

      expect(result.name).toBe("John Doe");
    });

    it("should reject empty name", () => {
      expect(() =>
        addFamilyMemberSchema.parse({
          email: "user@example.com",
          password: "password123",
          name: "",
          birthdate: "2006-07-20",
          role: FamilyRole.Child,
        }),
      ).toThrow("Name is required");
    });

    it("should reject missing name", () => {
      expect(() =>
        addFamilyMemberSchema.parse({
          email: "user@example.com",
          password: "password123",
          birthdate: "2007-11-25",
          role: FamilyRole.Child,
        }),
      ).toThrow();
    });
  });

  describe("birthdate validation", () => {
    it("should accept valid birthdate in ISO format", () => {
      const result = addFamilyMemberSchema.parse({
        email: "user@example.com",
        password: "password123",
        name: "Test User",
        birthdate: "1990-01-15",
        role: FamilyRole.Child,
      });

      expect(result.birthdate).toBe("1990-01-15");
    });

    it("should reject invalid birthdate format", () => {
      expect(() =>
        addFamilyMemberSchema.parse({
          email: "user@example.com",
          password: "password123",
          name: "Bad Date User",
          birthdate: "01-15-1990",
          role: FamilyRole.Child,
        }),
      ).toThrow("ISO 8601");
    });

    it("should reject missing birthdate", () => {
      expect(() =>
        addFamilyMemberSchema.parse({
          email: "user@example.com",
          password: "password123",
          name: "No Birthdate User",
          role: FamilyRole.Child,
        }),
      ).toThrow();
    });
  });

  describe("complete payload validation", () => {
    it("should accept valid payload with all required fields", () => {
      const result = addFamilyMemberSchema.parse({
        email: "child@example.com",
        password: "securepass123",
        name: "Child Name",
        birthdate: "2008-05-10",
        role: FamilyRole.Child,
      });

      expect(result).toEqual({
        email: "child@example.com",
        password: "securepass123",
        name: "Child Name",
        birthdate: "2008-05-10",
        role: FamilyRole.Child,
      });
    });

    it("should reject payload with extra fields", () => {
      const result = addFamilyMemberSchema.parse({
        email: "child@example.com",
        password: "securepass123",
        name: "Child Name",
        birthdate: "2009-09-18",
        role: FamilyRole.Child,
        extraField: "should be stripped",
      });

      expect(result).not.toHaveProperty("extraField");
    });
  });
});
