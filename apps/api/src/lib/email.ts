import { settings } from "@config/settings";
import { logger } from "./logger";

/**
 * Email configuration options
 */
export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * In-memory email store for testing
 * Only populated when NODE_ENV=test
 */
let testEmails: EmailOptions[] = [];

/**
 * Retrieve captured test emails
 * @returns Array of captured emails (only populated in test environment)
 */
export function getTestEmails(): EmailOptions[] {
  return testEmails;
}

/**
 * Clear test email store
 * Should be called in test setup/teardown
 */
export function clearTestEmails(): void {
  testEmails = [];
}

/**
 * Send an email with environment-aware behavior
 *
 * Behavior by environment:
 * - Development: Logs email content to console
 * - Test: Stores email in memory for assertions
 * - Production: TODO - Integrate with external email service (SendGrid, AWS SES, etc.)
 *
 * @param options - Email configuration
 * @throws Error if email sending fails (in production)
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const { to, subject, text, html } = options;

  try {
    if (settings.isTest) {
      // Test environment: Store email in memory
      testEmails.push(options);
      logger.info("Email captured for testing", {
        to,
        subject,
        textLength: text.length,
      });
    } else if (settings.isDevelopment) {
      // Development environment: Log to console
      logger.info("Email sent (development mode - logged only)", {
        to,
        subject,
        text,
        html: html ? `${html.substring(0, 100)}...` : undefined,
      });
    } else {
      // Production environment: TODO - Integrate with email service
      // Examples:
      // - SendGrid: https://sendgrid.com/docs/for-developers/sending-email/api-getting-started/
      // - AWS SES: https://docs.aws.amazon.com/ses/latest/DeveloperGuide/send-email-api.html
      // - Mailgun: https://documentation.mailgun.com/en/latest/api-sending.html
      //
      // Configuration via environment variables:
      // - EMAIL_SERVICE_API_KEY: API key for email service
      // - EMAIL_FROM_ADDRESS: Sender email address (e.g., noreply@famly.app)
      // - EMAIL_FROM_NAME: Sender name (e.g., "Famly")
      //
      // Example SendGrid integration:
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(process.env.EMAIL_SERVICE_API_KEY);
      // await sgMail.send({
      //   to,
      //   from: { email: process.env.EMAIL_FROM_ADDRESS, name: process.env.EMAIL_FROM_NAME },
      //   subject,
      //   text,
      //   html,
      // });

      logger.warn("Email not sent - production email service not configured", {
        to,
        subject,
      });

      throw new Error(
        "Email service not configured for production environment",
      );
    }
  } catch (error) {
    logger.error("Failed to send email", {
      to,
      subject,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Send password reset email with secure reset link
 *
 * @param email - Recipient email address
 * @param resetUrl - Complete password reset URL with token
 * @param token - Reset token (for logging purposes only, not included separately in email)
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  token: string,
): Promise<void> {
  const subject = "Reset your Famly password";

  const text = `
Hello,

You recently requested to reset your password for your Famly account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you did not request a password reset, please ignore this email or contact support if you have concerns.

Best regards,
The Famly Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">Reset Your Famly Password</h2>

  <p>Hello,</p>

  <p>You recently requested to reset your password for your Famly account.</p>

  <p>Click the button below to reset your password:</p>

  <div style="margin: 30px 0;">
    <a href="${resetUrl}"
       style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
      Reset Password
    </a>
  </div>

  <p>Or copy and paste this link into your browser:</p>
  <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>

  <p style="color: #dc2626; font-weight: bold;">This link will expire in 1 hour for security reasons.</p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

  <p style="color: #6b7280; font-size: 14px;">
    If you did not request a password reset, please ignore this email or contact support if you have concerns.
  </p>

  <p style="color: #6b7280; font-size: 14px;">
    Best regards,<br>
    The Famly Team
  </p>
</body>
</html>
  `.trim();

  logger.info("Sending password reset email", {
    email,
    // Note: Never log the actual token for security reasons
    hasToken: Boolean(token),
    resetUrlLength: resetUrl.length,
  });

  await sendEmail({
    to: email,
    subject,
    text,
    html,
  });

  logger.info("Password reset email sent successfully", { email });
}
