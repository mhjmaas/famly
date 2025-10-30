# Proposal: add-password-reset

## Why

Users need the ability to recover their accounts when they forget their passwords. Currently, the Famly application only supports email/password authentication for registration and login, but provides no password recovery mechanism. This creates a poor user experience and increases support burden when users are locked out of their accounts.

This change implements a standard password reset flow using Better Auth's built-in `forgetPassword` and `resetPassword` functionality, following security best practices with time-limited tokens sent via email.

## What Changes

### Capabilities Affected
- **auth** (modified): Add password reset request and password reset endpoints

### User-Visible Changes
1. Users can request a password reset by providing their email address
2. Users receive an email with a secure, time-limited reset link
3. Users can set a new password using the reset token from the email
4. Password reset tokens expire after 1 hour for security

### Technical Changes
1. Enable Better Auth password reset functionality in `better-auth.ts`
2. Add email service configuration for sending password reset emails
3. Create custom password reset request route with validation
4. Create custom password reset completion route with validation
5. Add Zod validators for password reset flows
6. Implement email sending infrastructure (console logging for development/test, actual email for production)
7. Add comprehensive unit tests for validators
8. Add comprehensive E2E tests for password reset flows
9. Add Bruno API collection requests for manual testing

## Implementation Strategy

### Minimal Approach
Following KISS principles, this implementation:
- Uses Better Auth's built-in password reset functionality (no custom token generation)
- Logs emails to console in development/test environments (no external email service dependency for MVP)
- Adds TODO comments for production email service integration
- Follows existing auth patterns (custom routes override Better Auth defaults for better DX)
- Reuses existing validator, route, and test patterns from login/register

### Email Strategy
For MVP and testing:
- Development: Log password reset emails to console with Winston
- Test: Capture emails in memory for E2E test assertions
- Production: TODO - integrate with email service (SendGrid, AWS SES, etc.)

This approach allows full testing and development without external dependencies, while providing a clear path for production email integration.

## Dependencies
- No new external dependencies required
- Uses existing Better Auth email/password plugin
- Uses existing Winston logger for development email logging

## Risks and Mitigations

### Risk 1: Email delivery failures
- **Likelihood**: Medium (external service dependency)
- **Impact**: High (users cannot reset passwords)
- **Mitigation**:
  - Log all email attempts with structured logging
  - Implement graceful error handling with user-friendly messages
  - Rate limit password reset requests to prevent abuse

### Risk 2: Token security
- **Likelihood**: Low (Better Auth provides secure tokens)
- **Impact**: High (unauthorized account access)
- **Mitigation**:
  - Use Better Auth's default 1-hour token expiration
  - Tokens are single-use (consumed on successful reset)
  - Require strong passwords (existing 8-char minimum)

### Risk 3: Email enumeration
- **Likelihood**: Medium (attackers can probe for registered emails)
- **Impact**: Low (privacy concern, not security breach)
- **Mitigation**:
  - Return same success message regardless of email existence
  - Rate limit requests to prevent bulk enumeration
  - Consider adding CAPTCHA in future if abuse detected

## Success Metrics
- Users can successfully request password resets via API
- Password reset emails are sent/logged correctly
- Password reset tokens work within expiration window
- Expired tokens are properly rejected
- Invalid tokens are properly rejected
- All auth E2E tests pass including new password reset scenarios
- Zero regressions in existing auth flows

## Timeline Estimate
- **Design & Planning**: Complete (this proposal)
- **Implementation**: 1-2 days
  - Day 1: Email infrastructure, Better Auth configuration, validators, routes
  - Day 2: Unit tests, E2E tests, Bruno collection, documentation
- **Testing & Review**: 0.5 days
- **Total**: 1.5-2.5 days

## Open Questions

### Q1: Should we add rate limiting immediately or defer to future work?
**Proposed**: Add basic rate limiting using Better Auth's built-in protection, document need for advanced rate limiting (e.g., Redis-based) as future enhancement.

### Q2: What email service should production use?
**Proposed**: Leave as TODO with configuration structure in place. Common options: SendGrid, AWS SES, Mailgun. Decision can be made during production deployment planning.

### Q3: Should password reset invalidate existing sessions?
**Proposed**: Yes, follow security best practice. Better Auth automatically invalidates sessions on password change. Document this behavior in tests.

### Q4: Should we send confirmation email after successful password reset?
**Proposed**: Not in MVP. Add as TODO for future enhancement to improve security awareness.
