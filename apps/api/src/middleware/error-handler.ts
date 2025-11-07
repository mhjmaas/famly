import { isHttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error("[Error]", err);

  if (isHttpError(err)) {
    const response: ErrorResponse = {
      error: err.message,
    };
    if (err.error) {
      response.code = err.error;
    }
    if (err.details) {
      response.details = err.details;
    }
    res.status(err.statusCode).json(response);
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    const response: ErrorResponse = {
      error: "Invalid JSON",
      code: "BAD_REQUEST",
    };
    res.status(400).json(response);
    return;
  }

  if (err instanceof multer.MulterError) {
    const response: ErrorResponse = {
      error: "File upload error",
      code: "FILE_UPLOAD_ERROR",
    };

    if (err.code === "LIMIT_FILE_SIZE") {
      response.error = "File size must be less than 5MB";
      response.code = "FILE_TOO_LARGE";
      res.status(413).json(response);
      return;
    }

    res.status(400).json(response);
    return;
  }

  // Include details in development and test modes
  const response: ErrorResponse = {
    error: "Internal Server Error",
    code: "INTERNAL_SERVER_ERROR",
  };

  // Always show details for debugging
  response.details = err instanceof Error ? err.message : String(err);

  res.status(500).json(response);
}
