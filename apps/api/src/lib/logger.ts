import winston from "winston";
import { settings } from "../config/settings";

/**
 * Logger factory that creates a Winston logger instance.
 * Configured for console output with appropriate log levels
 * based on the environment (development vs production).
 *
 * Design: Single Responsibility - this module only manages logger creation and configuration.
 * Follows Dependency Inversion - logger is injected where needed.
 */

const createLogger = (): winston.Logger => {
  const isDevelopment = settings.isDevelopment;

  const logger = winston.createLogger({
    level: isDevelopment ? "debug" : "info",
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level.toUpperCase()}] ${message}`;
      }),
    ),
    transports: [new winston.transports.Console()],
  });

  return logger;
};

// Export singleton logger instance
export const logger = createLogger();

export default logger;
