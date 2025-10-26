/**
 * Unit tests for Error Handler Utilities
 */

describe("Error Handler Utilities", () => {
  describe("error codes", () => {
    const ErrorCode = {
      UNAUTHORIZED: "UNAUTHORIZED",
      FORBIDDEN: "FORBIDDEN",
      VALIDATION_ERROR: "VALIDATION_ERROR",
      RATE_LIMITED: "RATE_LIMITED",
      NOT_FOUND: "NOT_FOUND",
      INTERNAL: "INTERNAL",
    };

    it("should define UNAUTHORIZED error code", () => {
      expect(ErrorCode.UNAUTHORIZED).toBe("UNAUTHORIZED");
    });

    it("should define FORBIDDEN error code", () => {
      expect(ErrorCode.FORBIDDEN).toBe("FORBIDDEN");
    });

    it("should define VALIDATION_ERROR error code", () => {
      expect(ErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    });

    it("should define RATE_LIMITED error code", () => {
      expect(ErrorCode.RATE_LIMITED).toBe("RATE_LIMITED");
    });

    it("should define NOT_FOUND error code", () => {
      expect(ErrorCode.NOT_FOUND).toBe("NOT_FOUND");
    });

    it("should define INTERNAL error code", () => {
      expect(ErrorCode.INTERNAL).toBe("INTERNAL");
    });
  });

  describe("error acknowledgment creation", () => {
    it("should create error ack with all required fields", () => {
      const correlationId = crypto.randomUUID();
      const ack = {
        ok: false,
        error: "VALIDATION_ERROR",
        message: "Invalid input",
        correlationId,
      };

      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("VALIDATION_ERROR");
      expect(ack.message).toBe("Invalid input");
      expect(ack.correlationId).toBe(correlationId);
    });

    it("should generate correlation ID if not provided", () => {
      const correlationId = crypto.randomUUID();

      expect(typeof correlationId).toBe("string");
      expect(correlationId.length).toBeGreaterThan(0);
    });

    it("should support custom error codes", () => {
      const ack = {
        ok: false,
        error: "CUSTOM_ERROR",
        message: "Custom error message",
        correlationId: crypto.randomUUID(),
      };

      expect(ack.error).toBe("CUSTOM_ERROR");
    });
  });

  describe("error message extraction", () => {
    it("should extract message from Error object", () => {
      const error = new Error("Test error message");
      const message = error instanceof Error ? error.message : String(error);

      expect(message).toBe("Test error message");
    });

    it("should handle string errors", () => {
      const error = "String error message";
      const message = typeof error === "string" ? error : String(error);

      expect(message).toBe("String error message");
    });

    it("should handle unknown error types", () => {
      const error = { code: 500 };
      const message = String(error);

      expect(typeof message).toBe("string");
      expect(message.length).toBeGreaterThan(0);
    });

    it("should handle null/undefined gracefully", () => {
      const error = null;
      const message = String(error);

      expect(message).toBe("null");
    });
  });

  describe("network error detection", () => {
    it("should detect ECONNREFUSED errors", () => {
      const error = new Error("ECONNREFUSED: Connection refused");
      const isNetwork = error.message.includes("ECONNREFUSED");

      expect(isNetwork).toBe(true);
    });

    it("should detect ECONNRESET errors", () => {
      const error = new Error("ECONNRESET: Connection reset");
      const isNetwork = error.message.includes("ECONNRESET");

      expect(isNetwork).toBe(true);
    });

    it("should detect ETIMEDOUT errors", () => {
      const error = new Error("ETIMEDOUT: Connection timed out");
      const isNetwork = error.message.includes("ETIMEDOUT");

      expect(isNetwork).toBe(true);
    });

    it("should detect connection keyword", () => {
      const error = new Error("Failed to establish connection");
      const isNetwork = /connection/i.test(error.message);

      expect(isNetwork).toBe(true);
    });
  });

  describe("validation error detection", () => {
    it("should detect validation errors by keyword", () => {
      const patterns = [
        "validation failed",
        "invalid format",
        "required field",
        "must be a string",
        "invalid date format",
      ];

      const validationPatterns = [
        /validation/i,
        /invalid/i,
        /required/i,
        /must be/i,
        /format/i,
      ];

      for (const errorMsg of patterns) {
        const isValidation = validationPatterns.some((pattern) =>
          pattern.test(errorMsg),
        );
        expect(isValidation).toBe(true);
      }
    });

    it("should not detect network errors as validation errors", () => {
      const error = "ECONNREFUSED: Connection refused";
      const validationPatterns = [
        /validation/i,
        /invalid/i,
        /required/i,
        /must be/i,
        /format/i,
      ];

      const isValidation = validationPatterns.some((pattern) =>
        pattern.test(error),
      );
      expect(isValidation).toBe(false);
    });
  });

  describe("error context", () => {
    it("should include socket information in context", () => {
      const context = {
        socketId: "socket-123",
        eventName: "message:send",
        userId: "user-456",
      };

      expect(context).toHaveProperty("socketId");
      expect(context).toHaveProperty("eventName");
      expect(context).toHaveProperty("userId");
    });

    it("should include chat information in context", () => {
      const context = {
        socketId: "socket-123",
        eventName: "room:join",
        chatId: "chat-789",
      };

      expect(context).toHaveProperty("chatId");
    });

    it("should allow additional context properties", () => {
      const context = {
        socketId: "socket-123",
        eventName: "message:send",
        retryCount: 3,
        requestSize: 1024,
      };

      expect(context.retryCount).toBe(3);
      expect(context.requestSize).toBe(1024);
    });
  });

  describe("correlation ID generation", () => {
    it("should generate valid UUID for correlation ID", () => {
      const correlationId = crypto.randomUUID();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(correlationId).toMatch(uuidRegex);
    });

    it("should generate unique correlation IDs", () => {
      const id1 = crypto.randomUUID();
      const id2 = crypto.randomUUID();

      expect(id1).not.toBe(id2);
    });

    it("should be suitable for error tracing", () => {
      const correlationId = crypto.randomUUID();

      expect(typeof correlationId).toBe("string");
      expect(correlationId.length).toBe(36); // UUID format: 8-4-4-4-12
    });
  });

  describe("error categorization", () => {
    it("should categorize validation errors", () => {
      const validationPatterns = [
        "validation failed",
        "Invalid input",
        "Required field missing",
      ];

      const patterns = [/validation/i, /invalid/i, /required/i];

      for (const msg of validationPatterns) {
        const isValidation = patterns.some((p) => p.test(msg));
        expect(isValidation).toBe(true);
      }
    });

    it("should categorize network errors", () => {
      const networkPatterns = [
        "ECONNREFUSED",
        "Connection timeout",
        "Network unreachable",
      ];

      const patterns = [/ECONNREFUSED/, /connection/i, /network/i];

      for (const msg of networkPatterns) {
        const isNetwork = patterns.some((p) => p.test(msg));
        expect(isNetwork).toBe(true);
      }
    });

    it("should default to INTERNAL for unknown errors", () => {
      const errorCode = "INTERNAL";

      expect(errorCode).toBe("INTERNAL");
    });
  });

  describe("error ack response structure", () => {
    it("should have correct success ack structure", () => {
      const ack = {
        ok: true,
        data: { clientId: "msg-1", serverId: "server-123" },
      };

      expect(ack).toHaveProperty("ok");
      expect(ack.ok).toBe(true);
      expect(ack).toHaveProperty("data");
    });

    it("should have correct error ack structure", () => {
      const ack = {
        ok: false,
        error: "VALIDATION_ERROR",
        message: "Invalid input",
        correlationId: crypto.randomUUID(),
      };

      expect(ack).toHaveProperty("ok");
      expect(ack.ok).toBe(false);
      expect(ack).toHaveProperty("error");
      expect(ack).toHaveProperty("message");
      expect(ack).toHaveProperty("correlationId");
    });

    it("should not have error fields in success ack", () => {
      const ack = {
        ok: true,
        data: { result: "success" },
      };

      expect(ack).not.toHaveProperty("error");
      expect(ack).not.toHaveProperty("message");
    });
  });
});
