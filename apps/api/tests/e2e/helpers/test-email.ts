import type { EmailOptions } from "@lib/email";
import { clearTestEmails, getTestEmails } from "@lib/email";

/**
 * E2E Test Email Helpers
 *
 * These helpers provide utilities for testing email functionality in E2E tests.
 * Emails are captured in memory during test runs (NODE_ENV=test).
 */

/**
 * Get all captured test emails
 * @returns Array of captured emails
 */
export function getTestEmailsHelper(): EmailOptions[] {
  return getTestEmails();
}

/**
 * Clear all captured test emails
 * Should be called in test setup (beforeEach)
 */
export function clearTestEmailsHelper(): void {
  clearTestEmails();
}

/**
 * Get the most recent captured email
 * @returns Most recent email or undefined if no emails captured
 */
export function getLatestTestEmail(): EmailOptions | undefined {
  const emails = getTestEmails();
  return emails[emails.length - 1];
}

/**
 * Find test email by recipient address
 * @param email - Recipient email to search for
 * @returns First email sent to the recipient or undefined
 */
export function findTestEmailByRecipient(
  email: string,
): EmailOptions | undefined {
  return getTestEmails().find((e) => e.to === email);
}

/**
 * Extract token from password reset email
 * Looks for token in URLs with format: /reset-password?token={token}
 * @param email - Email to extract token from (can be undefined if no email sent)
 * @returns Extracted token or null if not found
 */
export function extractResetTokenFromEmail(
  email: EmailOptions | undefined,
): string | null {
  if (!email) {
    return null;
  }

  // Try to extract from text content
  const tokenMatch =
    email.text.match(/token=([a-zA-Z0-9\-_]+)/) ||
    email.html?.match(/token=([a-zA-Z0-9\-_]+)/);

  return tokenMatch ? tokenMatch[1] : null;
}
