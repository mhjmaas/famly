import type { Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { settings } from "@/config/settings";

/**
 * Standard rate limiter for general API endpoints
 * - 100 requests per 15 minutes per IP
 */
export const standardLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting in test environment
  skip: () => settings.isTest,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: "Too many requests from this IP, please try again later.",
      retryAfter: "15 minutes",
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * - 5 attempts per 15 minutes per IP
 * Prevents brute force attacks on login/registration
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: "Too many authentication attempts, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skip: () => settings.isTest,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: "Too many authentication attempts, please try again later.",
      retryAfter: "15 minutes",
    });
  },
});

/**
 * Moderate rate limiter for search and resource-intensive endpoints
 * - 30 requests per 15 minutes per IP
 */
export const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: {
    error: "Too many search requests, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => settings.isTest,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: "Too many search requests, please try again later.",
      retryAfter: "15 minutes",
    });
  },
});

/**
 * Lenient rate limiter for file uploads
 * - 20 uploads per 15 minutes per IP
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 uploads per windowMs
  message: {
    error: "Too many upload requests, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => settings.isTest,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: "Too many upload requests, please try again later.",
      retryAfter: "15 minutes",
    });
  },
});

/**
 * Very lenient rate limiter for health check and status endpoints
 * - 300 requests per 15 minutes per IP
 */
export const healthCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // High limit for monitoring tools
  message: {
    error: "Too many requests to health endpoint.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => settings.isTest,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: "Too many requests to health endpoint.",
    });
  },
});
