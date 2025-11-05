import { randomUUID } from "node:crypto";
import type { Logger } from "winston";
import type { Ack } from "../types";

/**
 * Standard error codes used across realtime handlers
 */
export enum ErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RATE_LIMITED = "RATE_LIMITED",
  NOT_FOUND = "NOT_FOUND",
  INTERNAL = "INTERNAL",
}

/**
 * Create a standardized error acknowledgment response
 *
 * @param error The error code
 * @param message The error message
 * @param correlationId Optional correlation ID for tracing
 * @returns Standardized error ack response
 */
export function createErrorAck(
  error: ErrorCode | string,
  message: string,
  correlationId?: string,
): Ack {
  return {
    ok: false,
    error,
    message,
    correlationId: correlationId || randomUUID(),
  };
}

/**
 * Error handling context for logging
 */
export interface ErrorContext {
  socketId: string;
  eventName: string;
  userId?: string;
  chatId?: string;
  [key: string]: unknown;
}

/**
 * Handle and log errors from event handlers
 * Generates correlation ID, logs error with context, and returns standardized error ack
 *
 * @param error The error that occurred
 * @param logger The logger instance
 * @param context Additional context for error logging
 * @param errorCode Optional error code (defaults to INTERNAL)
 * @returns Standardized error ack response
 */
export function handleEventError(
  error: unknown,
  logger: Logger,
  context: ErrorContext,
  errorCode: ErrorCode | string = ErrorCode.INTERNAL,
): Ack {
  const correlationId = randomUUID();

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error(`Event handler error in ${context.eventName}`, {
    correlationId,
    ...context,
    error: errorMessage,
    stack: errorStack,
  });

  return createErrorAck(
    errorCode,
    `Error processing ${context.eventName}`,
    correlationId,
  );
}

/**
 * Extract error message from various error types
 * Handles Error objects, strings, and unknown types
 *
 * @param error The error to extract message from
 * @returns The error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return String(error);
}

/**
 * Check if error is a network error (for retry logic)
 * Network errors are transient and often recoverable
 *
 * @param error The error to check
 * @returns true if error appears to be network-related
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const networkErrorPatterns = [
    /ECONNREFUSED/,
    /ECONNRESET/,
    /ETIMEDOUT/,
    /EHOSTUNREACH/,
    /ENETUNREACH/,
    /network/i,
    /connection/i,
  ];

  return networkErrorPatterns.some((pattern) => pattern.test(error.message));
}

/**
 * Check if error is a validation error
 *
 * @param error The error to check
 * @returns true if error appears to be validation-related
 */
export function isValidationError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const validationErrorPatterns = [
    /validation/i,
    /invalid/i,
    /required/i,
    /must be/i,
    /format/i,
  ];

  return validationErrorPatterns.some((pattern) => pattern.test(error.message));
}

/**
 * Determine appropriate error code from error instance
 * Uses error message patterns to categorize errors
 *
 * @param error The error to categorize
 * @param defaultCode Default error code if no pattern matches
 * @returns The appropriate error code
 */
export function getErrorCode(
  error: unknown,
  defaultCode: ErrorCode | string = ErrorCode.INTERNAL,
): ErrorCode | string {
  if (isValidationError(error)) {
    return ErrorCode.VALIDATION_ERROR;
  }

  if (isNetworkError(error)) {
    return ErrorCode.INTERNAL;
  }

  return defaultCode;
}
