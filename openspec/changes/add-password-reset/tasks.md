# Implementation Tasks: add-password-reset

## 1. Email Service Infrastructure

- [ ] 1.1 Create `apps/api/src/lib/email.ts`
  - Define `EmailOptions` interface with `to`, `subject`, `text`, `html` fields
  - Implement `sendEmail(options: EmailOptions): Promise<void>` function
  - Environment-aware behavior:
    - Development: Log email to console using Winston logger
    - Test: Store email in global test array (accessed via `getTestEmails()`)
    - Production: TODO comment for email service integration (SendGrid, AWS SES, etc.)
  - Implement `sendPasswordResetEmail(email: string, resetUrl: string, token: string): Promise<void>`
  - Format email with subject "Reset your Famly password"
  - Include reset URL, expiration notice (1 hour), and clear instructions
  - Add structured logging for all email operations
  - Export all functions

- [ ] 1.2 Create test helpers for email
  - Add `apps/api/tests/helpers/test-email.ts` (or extend existing helper)
  - Implement in-memory email store for test environment
  - Export `getTestEmails()` to retrieve captured emails
  - Export `clearTestEmails()` to reset between tests
  - Ensure emails only stored when `NODE_ENV=test`

- [ ] 1.3 Write unit tests for email service
  - Test file: `apps/api/tests/unit/lib/email.test.ts`
  - Test `sendEmail` logs to console in development
  - Test `sendPasswordResetEmail` formats email correctly
  - Test email includes reset URL with token
  - Test email includes expiration notice
  - Test error handling for failed email delivery

## 2. Better Auth Configuration

- [ ] 2.1 Update Better Auth configuration
  - Edit `apps/api/src/modules/auth/better-auth.ts`
  - Add `sendResetPassword` callback to `emailAndPassword` config
  - Call `sendPasswordResetEmail` from callback with user, url, token
  - Set `resetPasswordTokenExpiresIn: 3600` (1 hour)
  - Add `onPasswordReset` callback for logging
  - Log password reset events with structured logging (userId, email)
  - Ensure callback errors are caught and logged (don't crash app)

## 3. Validators

- [ ] 3.1 Create request password reset validator
  - Create `apps/api/src/modules/auth/validators/request-password-reset.validator.ts`
  - Define Zod schema with `email` field
  - Validate email is string, required, and valid email format
  - Export `requestPasswordResetValidator` schema
  - Export `RequestPasswordResetInput` TypeScript type

- [ ] 3.2 Create reset password validator
  - Create `apps/api/src/modules/auth/validators/reset-password.validator.ts`
  - Define Zod schema with `token` and `newPassword` fields
  - Validate token is string and required
  - Validate newPassword is string, required, minimum 8 characters
  - Export `resetPasswordValidator` schema
  - Export `ResetPasswordInput` TypeScript type

- [ ] 3.3 Write unit tests for request password reset validator
  - Test file: `apps/api/tests/unit/auth/request-password-reset.validator.test.ts`
  - Test valid email passes validation
  - Test invalid email format rejected (e.g., "notanemail")
  - Test missing email rejected
  - Test empty string email rejected
  - Test email with whitespace is handled correctly
  - All tests MUST pass before proceeding

- [ ] 3.4 Write unit tests for reset password validator
  - Test file: `apps/api/tests/unit/auth/reset-password.validator.test.ts`
  - Test valid token and password pass validation
  - Test password less than 8 characters rejected
  - Test missing token rejected
  - Test missing password rejected
  - Test empty token rejected
  - Test empty password rejected
  - All tests MUST pass before proceeding

## 4. Custom Routes

- [ ] 4.1 Create request password reset route
  - Create `apps/api/src/modules/auth/routes/request-password-reset.route.ts`
  - Implement POST handler for `/v1/auth/request-password-reset`
  - Validate request body with `requestPasswordResetValidator`
  - Call Better Auth's `forgetPassword` API method
  - Return 200 with message "If your email is registered, you will receive a password reset link"
  - Return same message for non-existent emails (prevent enumeration)
  - Handle errors gracefully (log but return generic message to client)
  - Add structured logging for password reset requests
  - Export `createRequestPasswordResetRoute()` factory function

- [ ] 4.2 Create reset password route
  - Create `apps/api/src/modules/auth/routes/reset-password.route.ts`
  - Implement POST handler for `/v1/auth/reset-password`
  - Validate request body with `resetPasswordValidator`
  - Call Better Auth's `resetPassword` API method with token and new password
  - Return 200 with message "Password reset successful" on success
  - Return 400 with descriptive error for:
    - Expired token
    - Invalid token
    - Used token
    - Weak password
  - Add structured logging for password reset completions and failures
  - Export `createResetPasswordRoute()` factory function

- [ ] 4.3 Integrate routes into auth router
  - Edit `apps/api/src/modules/auth/routes/auth.router.ts`
  - Import `createRequestPasswordResetRoute` and `createResetPasswordRoute`
  - Mount request password reset route before Better Auth wildcard handler
  - Mount reset password route before Better Auth wildcard handler
  - Verify routes are accessible and documented in router comments

## 5. E2E Tests for Password Reset

- [ ] 5.1 Create password reset E2E test file
  - Create `apps/api/tests/e2e/auth/password-reset.e2e.test.ts`
  - Set up test database cleanup in `beforeEach`
  - Import test email helpers to capture sent emails

- [ ] 5.2 Implement request password reset E2E tests
  - Test: Request reset with valid registered email succeeds (200)
  - Test: Response message is "If your email is registered, you will receive a password reset link"
  - Test: Password reset email is sent/captured with correct recipient
  - Test: Email contains reset URL with token in query params
  - Test: Email includes expiration notice (1 hour)
  - Test: Request reset with non-existent email succeeds with same message (200)
  - Test: No email is sent for non-existent email
  - Test: Request reset with invalid email format returns 400
  - Test: Request reset with missing email returns 400
  - Test: Multiple reset requests generate different tokens
  - All tests MUST pass before proceeding

- [ ] 5.3 Implement reset password E2E tests
  - Test: Reset password with valid token succeeds (200)
  - Test: Response message is "Password reset successful"
  - Test: User can login with new password after reset
  - Test: User cannot login with old password after reset
  - Test: Reset with expired token returns 400 (mock time or wait for expiration)
  - Test: Reset with invalid token returns 400
  - Test: Reset with already-used token returns 400
  - Test: Reset with weak password (<8 chars) returns 400
  - Test: Reset with missing token returns 400
  - Test: Reset with missing password returns 400
  - All tests MUST pass before proceeding

- [ ] 5.4 Implement session invalidation E2E tests
  - Test: Create authenticated session via login
  - Test: Reset password with valid token
  - Test: Old session cookie no longer works (401)
  - Test: Old JWT token no longer works (401)
  - Test: User can create new session with new password
  - All tests MUST pass before proceeding

## 6. Environment Configuration (Optional for MVP)

- [ ] 6.1 Document email service environment variables
  - Update `apps/api/README.md` with email configuration section
  - Document that emails are logged to console in development
  - Document future environment variables for production:
    - `EMAIL_SERVICE_API_KEY` (optional, for production email service)
    - `EMAIL_FROM_ADDRESS` (optional, sender email address)
    - `EMAIL_FROM_NAME` (optional, sender name, defaults to "Famly")
  - Include TODO comments in `lib/email.ts` for production integration

## 7. Bruno API Collection

- [ ] 7.1 Create password reset request in Bruno
  - Create `bruno/Famly/auth/request-password-reset.bru`
  - Type: POST
  - URL: `{{baseUrl}}/v1/auth/request-password-reset`
  - Body (JSON):
    ```json
    {
      "email": "user@example.com"
    }
    ```
  - Add documentation in request description
  - Add test assertions for 200 status code

- [ ] 7.2 Create reset password request in Bruno
  - Create `bruno/Famly/auth/reset-password.bru`
  - Type: POST
  - URL: `{{baseUrl}}/v1/auth/reset-password`
  - Body (JSON):
    ```json
    {
      "token": "{{resetToken}}",
      "newPassword": "NewSecurePassword123!"
    }
    ```
  - Add documentation explaining token must be obtained from email
  - Add test assertions for 200 status code

- [ ] 7.3 Update Bruno environment variables
  - Add `resetToken` variable to `bruno/Famly/environments/local.bru`
  - Set default value with instructions to replace with actual token from email/logs
  - Document the password reset flow in folder description

## 8. Integration and System Tests

- [ ] 8.1 Run full unit test suite
  - Execute: `pnpm -C apps/api run test:unit`
  - Verify all unit tests pass including new validator tests
  - Fix any failing tests before proceeding

- [ ] 8.2 Run full E2E test suite
  - Execute: `pnpm -C apps/api run test:e2e`
  - Verify all E2E tests pass including new password reset tests
  - Confirm no regressions in existing auth flows (login, register, me)
  - Fix any failing tests before proceeding

- [ ] 8.3 Manual testing with Bruno
  - Register a new user via Bruno
  - Request password reset for the user's email
  - Check console logs for password reset email with token
  - Copy token from logs
  - Reset password using token via Bruno
  - Verify login with new password succeeds
  - Verify login with old password fails
  - Verify password reset flow works end-to-end

## 9. Documentation and Cleanup

- [ ] 9.1 Add API documentation comments
  - Document `sendEmail` and `sendPasswordResetEmail` functions with JSDoc
  - Document password reset route handlers with JSDoc
  - Document validator schemas with descriptions
  - Document email behavior by environment

- [ ] 9.2 Update auth module documentation
  - Update `apps/api/src/modules/auth/README.md` (if exists) or create it
  - Document password reset endpoints
  - Document email configuration
  - Document testing approach for email

- [ ] 9.3 Run linter
  - Execute: `pnpm -C apps/api run lint`
  - Fix any linting errors in new files
  - Ensure code style consistency with existing auth module

- [ ] 9.4 Run formatter
  - Execute: `pnpm -C apps/api run format` (if available via Biome)
  - Ensure all new code is properly formatted

## 10. Verification and Sign-off

- [ ] 10.1 Verify all requirements met
  - Review spec scenarios in `openspec/changes/add-password-reset/specs/auth/spec.md`
  - Confirm all scenarios are covered by E2E tests
  - Confirm all API endpoints implemented and working
  - Confirm logging is in place for monitoring

- [ ] 10.2 Verify constitution compliance
  - Confirm SOLID principles followed (SRP, DIP, OCP)
  - Confirm DRY (no duplicate logic between routes)
  - Confirm KISS (straightforward email service, no over-engineering)
  - Confirm TDD (tests written for validators, routes, and flows)

- [ ] 10.3 Security review
  - Verify tokens expire after 1 hour
  - Verify tokens are single-use (consumed after successful reset)
  - Verify sessions invalidated on password reset
  - Verify email enumeration protection (same response for all emails)
  - Verify password strength requirements enforced
  - Verify no sensitive data logged (passwords, tokens)

- [ ] 10.4 Performance check
  - Verify password reset doesn't block request handling
  - Verify email sending is async and doesn't delay response
  - Verify no unnecessary database queries

- [ ] 10.5 Final full test run
  - Execute: `pnpm test` (all tests)
  - Confirm 100% test pass rate
  - Confirm no regressions in existing functionality
  - Verify test email helpers work correctly

## Notes for Implementation

### Test-First Approach
Per the constitution's TDD requirement, follow this sequence for each task:
1. Write failing tests for the functionality
2. Run tests and verify they fail (Red)
3. Implement the minimum code to pass tests (Green)
4. Refactor for clarity and quality (Refactor)
5. Re-run tests to ensure they still pass

### Error Handling Pattern
All password reset operations should follow this error handling pattern:
- Validation errors → HTTP 400 with descriptive message
- Server errors → HTTP 500, log full error details
- Email delivery errors → Log error but return success to user (don't reveal email existence)

### Logging Standards
Use Winston logger with structured logging:
```typescript
logger.info('Password reset requested', { email, userId: userId?.toString() });
logger.info('Password reset successful', { userId: user.id, email: user.email });
logger.error('Password reset email failed', { email, error: error.message });
```

### Email Security
- Never log full reset tokens (only log token existence)
- Never log passwords (old or new)
- Log email delivery attempts for debugging
- Use structured logging for monitoring password reset patterns

### Token Expiration Testing
To test token expiration in E2E tests:
- Option 1: Use shorter expiration in test environment (e.g., 5 seconds)
- Option 2: Mock time using jest's timer mocks
- Option 3: Directly insert expired token in database for testing
- Choose approach that best fits existing test patterns
