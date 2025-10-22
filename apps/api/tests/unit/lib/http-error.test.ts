import { HttpError, isHttpError } from "@lib/http-error";

describe("HttpError", () => {
  describe("constructor", () => {
    it("should create an error with required properties", () => {
      const error = new HttpError({
        statusCode: 400,
        message: "Bad request",
      });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(HttpError);
      expect(error.name).toBe("HttpError");
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Bad request");
      expect(error.error).toBeUndefined();
      expect(error.details).toBeUndefined();
    });

    it("should create an error with all properties", () => {
      const details = { field: "email", issue: "invalid format" };
      const error = new HttpError({
        statusCode: 422,
        message: "Validation failed",
        error: "VALIDATION_ERROR",
        details,
      });

      expect(error.statusCode).toBe(422);
      expect(error.message).toBe("Validation failed");
      expect(error.error).toBe("VALIDATION_ERROR");
      expect(error.details).toEqual(details);
    });

    it("should maintain proper prototype chain for instanceof checks", () => {
      const error = new HttpError({
        statusCode: 500,
        message: "Server error",
      });

      expect(error instanceof HttpError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe("toJSON", () => {
    it("should serialize error with only message", () => {
      const error = new HttpError({
        statusCode: 404,
        message: "Resource not found",
      });

      const json = error.toJSON();

      expect(json).toEqual({
        error: "Resource not found",
      });
    });

    it("should serialize error with code", () => {
      const error = new HttpError({
        statusCode: 401,
        message: "Unauthorized",
        error: "UNAUTHORIZED",
      });

      const json = error.toJSON();

      expect(json).toEqual({
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      });
    });

    it("should serialize error with details", () => {
      const details = { fields: ["email", "password"] };
      const error = new HttpError({
        statusCode: 400,
        message: "Validation failed",
        error: "VALIDATION_ERROR",
        details,
      });

      const json = error.toJSON();

      expect(json).toEqual({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details,
      });
    });

    it("should handle complex details objects", () => {
      const details = {
        fields: [
          { name: "email", errors: ["required", "invalid format"] },
          { name: "password", errors: ["too short"] },
        ],
        timestamp: "2025-10-20T20:00:00Z",
      };
      const error = new HttpError({
        statusCode: 400,
        message: "Multiple validation errors",
        details,
      });

      const json = error.toJSON();

      expect(json.details).toEqual(details);
    });
  });

  describe("static factory methods", () => {
    describe("badRequest", () => {
      it("should create 400 error with message", () => {
        const error = HttpError.badRequest("Invalid input");

        expect(error.statusCode).toBe(400);
        expect(error.message).toBe("Invalid input");
        expect(error.error).toBe("BAD_REQUEST");
        expect(error.details).toBeUndefined();
      });

      it("should create 400 error with details", () => {
        const details = { field: "email" };
        const error = HttpError.badRequest("Invalid email", details);

        expect(error.statusCode).toBe(400);
        expect(error.message).toBe("Invalid email");
        expect(error.error).toBe("BAD_REQUEST");
        expect(error.details).toEqual(details);
      });
    });

    describe("unauthorized", () => {
      it("should create 401 error with default message", () => {
        const error = HttpError.unauthorized();

        expect(error.statusCode).toBe(401);
        expect(error.message).toBe("Unauthorized");
        expect(error.error).toBe("UNAUTHORIZED");
      });

      it("should create 401 error with custom message", () => {
        const error = HttpError.unauthorized("Invalid credentials");

        expect(error.statusCode).toBe(401);
        expect(error.message).toBe("Invalid credentials");
        expect(error.error).toBe("UNAUTHORIZED");
      });
    });

    describe("forbidden", () => {
      it("should create 403 error with default message", () => {
        const error = HttpError.forbidden();

        expect(error.statusCode).toBe(403);
        expect(error.message).toBe("Forbidden");
        expect(error.error).toBe("FORBIDDEN");
      });

      it("should create 403 error with custom message", () => {
        const error = HttpError.forbidden("Access denied");

        expect(error.statusCode).toBe(403);
        expect(error.message).toBe("Access denied");
        expect(error.error).toBe("FORBIDDEN");
      });
    });

    describe("notFound", () => {
      it("should create 404 error with default message", () => {
        const error = HttpError.notFound();

        expect(error.statusCode).toBe(404);
        expect(error.message).toBe("Not Found");
        expect(error.error).toBe("NOT_FOUND");
      });

      it("should create 404 error with custom message", () => {
        const error = HttpError.notFound("User not found");

        expect(error.statusCode).toBe(404);
        expect(error.message).toBe("User not found");
        expect(error.error).toBe("NOT_FOUND");
      });
    });

    describe("conflict", () => {
      it("should create 409 error with message", () => {
        const error = HttpError.conflict("Resource already exists");

        expect(error.statusCode).toBe(409);
        expect(error.message).toBe("Resource already exists");
        expect(error.error).toBe("CONFLICT");
      });
    });

    describe("internalServerError", () => {
      it("should create 500 error with default message", () => {
        const error = HttpError.internalServerError();

        expect(error.statusCode).toBe(500);
        expect(error.message).toBe("Internal Server Error");
        expect(error.error).toBe("INTERNAL_SERVER_ERROR");
      });

      it("should create 500 error with custom message", () => {
        const error = HttpError.internalServerError(
          "Database connection failed",
        );

        expect(error.statusCode).toBe(500);
        expect(error.message).toBe("Database connection failed");
        expect(error.error).toBe("INTERNAL_SERVER_ERROR");
      });
    });
  });
});

describe("isHttpError", () => {
  it("should return true for HttpError instances", () => {
    const error = new HttpError({
      statusCode: 400,
      message: "Bad request",
    });

    expect(isHttpError(error)).toBe(true);
  });

  it("should return true for errors created by factory methods", () => {
    expect(isHttpError(HttpError.badRequest("test"))).toBe(true);
    expect(isHttpError(HttpError.unauthorized())).toBe(true);
    expect(isHttpError(HttpError.forbidden())).toBe(true);
    expect(isHttpError(HttpError.notFound())).toBe(true);
    expect(isHttpError(HttpError.conflict("test"))).toBe(true);
    expect(isHttpError(HttpError.internalServerError())).toBe(true);
  });

  it("should return false for standard Error instances", () => {
    const error = new Error("Standard error");

    expect(isHttpError(error)).toBe(false);
  });

  it("should return false for non-error objects", () => {
    expect(isHttpError({})).toBe(false);
    expect(isHttpError({ statusCode: 400 })).toBe(false);
    expect(isHttpError("error string")).toBe(false);
    expect(isHttpError(null)).toBe(false);
    expect(isHttpError(undefined)).toBe(false);
    expect(isHttpError(123)).toBe(false);
  });

  it("should return false for objects that look like HttpError but are not", () => {
    const fakeError = {
      statusCode: 400,
      message: "Bad request",
      error: "BAD_REQUEST",
      toJSON: () => ({}),
    };

    expect(isHttpError(fakeError)).toBe(false);
  });
});
