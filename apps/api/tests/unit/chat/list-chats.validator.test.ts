import { validateListChats } from "@modules/chat/validators/list-chats.validator";
import type { NextFunction, Request, Response } from "express";

describe("Unit: validateListChats middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      query: {},
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  describe("Valid inputs", () => {
    it("should pass with no query parameters", () => {
      mockReq.query = {};

      validateListChats(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as any).paginationParams).toEqual({
        cursor: undefined,
        limit: 20,
      });
    });

    it("should pass with valid cursor (ObjectId)", () => {
      const validCursor = "507f1f77bcf86cd799439011";
      mockReq.query = { cursor: validCursor };

      validateListChats(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as any).paginationParams.cursor).toEqual(validCursor);
      expect((mockReq as any).paginationParams.limit).toBe(20);
    });

    it("should pass with valid limit", () => {
      mockReq.query = { limit: "50" };

      validateListChats(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as any).paginationParams).toEqual({
        cursor: undefined,
        limit: 50,
      });
    });

    it("should pass with minimum limit (1)", () => {
      mockReq.query = { limit: "1" };

      validateListChats(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as any).paginationParams.limit).toBe(1);
    });

    it("should pass with maximum limit (100)", () => {
      mockReq.query = { limit: "100" };

      validateListChats(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as any).paginationParams.limit).toBe(100);
    });

    it("should pass with both cursor and limit", () => {
      const validCursor = "507f1f77bcf86cd799439011";
      mockReq.query = { cursor: validCursor, limit: "25" };

      validateListChats(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as any).paginationParams).toEqual({
        cursor: validCursor,
        limit: 25,
      });
    });

    it("should use default limit when not specified", () => {
      mockReq.query = {};

      validateListChats(mockReq as Request, mockRes as Response, mockNext);

      expect((mockReq as any).paginationParams.limit).toBe(20);
    });
  });

  describe("Invalid cursor", () => {
    it("should reject invalid cursor format", () => {
      mockReq.query = { cursor: "not-a-valid-id" };

      validateListChats(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain("Invalid ObjectId format for cursor");
    });

    it("should reject cursor with invalid ObjectId", () => {
      mockReq.query = { cursor: "123456" };

      validateListChats(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should reject empty cursor string", () => {
      mockReq.query = { cursor: "" };

      validateListChats(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("Invalid limit", () => {
    it("should reject non-numeric limit", () => {
      mockReq.query = { limit: "abc" };

      validateListChats(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain("valid number");
    });

    it("should reject limit below 1", () => {
      mockReq.query = { limit: "0" };

      validateListChats(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain("at least 1");
    });

    it("should reject negative limit", () => {
      mockReq.query = { limit: "-10" };

      validateListChats(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should reject limit exceeding 100", () => {
      mockReq.query = { limit: "101" };

      validateListChats(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain("not exceed 100");
    });

    it("should reject limit of 1000", () => {
      mockReq.query = { limit: "1000" };

      validateListChats(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should accept floating point limit that parses to integer (50.5 -> 50)", () => {
      mockReq.query = { limit: "50.5" };

      validateListChats(mockReq as Request, mockRes as Response, mockNext);

      // parseInt will parse 50.5 as 50, which is valid
      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as any).paginationParams.limit).toBe(50);
    });
  });

  describe("Limit boundary values", () => {
    it("should accept limit of 20 (default)", () => {
      mockReq.query = { limit: "20" };

      validateListChats(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as any).paginationParams.limit).toBe(20);
    });

    it("should accept limit of 99", () => {
      mockReq.query = { limit: "99" };

      validateListChats(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as any).paginationParams.limit).toBe(99);
    });

    it("should accept limit of 100", () => {
      mockReq.query = { limit: "100" };

      validateListChats(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as any).paginationParams.limit).toBe(100);
    });

    it("should reject limit of 101", () => {
      mockReq.query = { limit: "101" };

      validateListChats(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
