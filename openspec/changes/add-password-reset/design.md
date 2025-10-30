# Design: add-password-reset

## Architecture Overview

This change adds password reset functionality to the existing auth module following Better Auth's built-in email/password reset patterns. The implementation follows the project's established patterns for auth routes, validators, and middleware.

## System Components

### 1. Better Auth Configuration (`better-auth.ts`)
**Purpose**: Configure Better Auth to enable password reset functionality

**Changes**:
```typescript
emailAndPassword: {
  enabled: true,
  // ... existing config ...

  // Password reset configuration
  sendResetPassword: async ({ user, url, token }, request) => {
    await sendPasswordResetEmail(user.email, url, token);
  },
  resetPasswordTokenExpiresIn: 3600, // 1 hour
  onPasswordReset: async ({ user }, request) => {
    logger.info('Password reset successful', {
      userId: user.id,
      email: user.email
    });
  },
}
```

### 2. Email Service (`lib/email.ts`)
**Purpose**: Centralize email sending logic with environment-aware behavior

**Interface**:
```typescript
interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void>

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  token: string
): Promise<void>
```

**Behavior by Environment**:
- **Development**: Log email content to console using Winston
- **Test**: Store email in memory array for test assertions
- **Production**: TODO - Integrate with external email service

**Rationale**:
- Enables full E2E testing without external dependencies
- Allows development without email service setup
- Provides clear integration point for production email service
- Follows KISS principle by deferring complexity until needed

### 3. Validators (`validators/`)
**Purpose**: Validate password reset requests using Zod

**Files**:
- `request-password-reset.validator.ts`: Validates email format
- `reset-password.validator.ts`: Validates token and new password

**Patterns**:
- Follow existing `register.validator.ts` patterns
- Use descriptive error messages
- Export TypeScript types from Zod schemas

### 4. Custom Routes (`routes/`)
**Purpose**: Override Better Auth defaults for better DX and consistent error handling

**Files**:
- `request-password-reset.route.ts`: POST /v1/auth/request-password-reset
- `reset-password.route.ts`: POST /v1/auth/reset-password

**Why Custom Routes?**:
- Consistent error response format with existing routes
- Custom validation with Zod (Better Auth uses different validation)
- Ability to add logging and monitoring
- Consistent with existing `login.route.ts` and `register.route.ts` patterns

### 5. Router Integration (`auth.router.ts`)
**Purpose**: Mount custom routes before Better Auth wildcard handler

**Pattern**:
```typescript
router.use(createRequestPasswordResetRoute());
router.use(createResetPasswordRoute());
router.all("*", toNodeHandler(getAuth())); // Fallback to Better Auth
```

## Data Flow

### Password Reset Request Flow
```
User
  └─> POST /v1/auth/request-password-reset { email }
      └─> Zod Validator (email format)
          └─> Better Auth (via custom route)
              └─> Check user exists
                  └─> Generate reset token
                      └─> Call sendResetPassword callback
                          └─> Email Service
                              ├─> Development: Log to console
                              ├─> Test: Store in memory
                              └─> Production: Send via email service
```

### Password Reset Completion Flow
```
User
  └─> POST /v1/auth/reset-password { token, newPassword }
      └─> Zod Validator (token format, password strength)
          └─> Better Auth (via custom route)
              └─> Validate token (existence, expiration)
                  └─> Hash new password
                      └─> Update user password
                          └─> Invalidate all sessions
                              └─> Call onPasswordReset callback
                                  └─> Log password reset event
```

## Database Schema

Better Auth manages token storage automatically in MongoDB collections:

**Collection**: `verificationToken`
```typescript
{
  _id: ObjectId,
  identifier: string,  // user email
  token: string,       // hashed token
  expiresAt: Date,     // expiration timestamp
  type: "reset-password"
}
```

No schema changes required to existing `user` collection.

## Security Considerations

### Token Security
- **Generation**: Better Auth generates cryptographically secure random tokens
- **Storage**: Tokens are hashed before storage (like passwords)
- **Expiration**: 1-hour expiration (configurable)
- **Single-use**: Tokens are deleted after successful use

### Email Enumeration Protection
- Return same success message for existing and non-existing emails
- Log actual behavior internally for debugging
- Rate limiting via Better Auth's built-in protection

### Session Invalidation
- Better Auth automatically invalidates all user sessions on password reset
- Requires users to log in again with new password
- Prevents session hijacking after password change

## Testing Strategy

### Unit Tests
**Validators** (`tests/unit/auth/`):
- `request-password-reset.validator.test.ts`
  - Valid email passes validation
  - Invalid email formats rejected
  - Missing email rejected
  - Email with whitespace trimmed

- `reset-password.validator.test.ts`
  - Valid token and password passes
  - Short password rejected (<8 chars)
  - Missing token rejected
  - Missing password rejected

### E2E Tests
**Password Reset Flow** (`tests/e2e/auth/password-reset.e2e.test.ts`):

**Request Password Reset**:
- Request reset with valid email succeeds (200)
- Request reset with non-existent email succeeds (200, same message)
- Email is sent/logged with correct token
- Invalid email format returns 400
- Missing email returns 400

**Reset Password**:
- Reset with valid token and password succeeds (200)
- User can login with new password
- User cannot login with old password
- Expired token returns 400
- Invalid token returns 400
- Used token cannot be reused (400)
- Weak password returns 400

**Session Invalidation**:
- Active sessions invalidated after password reset
- Previous session cookies no longer work

### Test Email Assertions
E2E tests assert email behavior:
```typescript
const emails = getTestEmails(); // Memory store in test env
expect(emails).toHaveLength(1);
expect(emails[0].to).toBe('user@example.com');
expect(emails[0].subject).toContain('Reset your password');
expect(emails[0].text).toContain('reset-password?token=');
```

## Integration Points

### Existing Systems
- **Better Auth**: Uses built-in email/password reset functionality
- **Winston Logger**: Logs email delivery and password reset events
- **MongoDB**: Stores tokens via Better Auth's adapter
- **Express**: Mounts routes in existing auth router

### Future Integrations
- **Email Service** (Production):
  - Integration point: `lib/email.ts`
  - Candidates: SendGrid, AWS SES, Mailgun, Postmark
  - Environment variables: `EMAIL_SERVICE_API_KEY`, `EMAIL_FROM_ADDRESS`

- **Rate Limiting** (Production):
  - Integration point: Middleware on password reset routes
  - Candidates: Express-rate-limit + Redis
  - Protects against abuse and enumeration attacks

## Deployment Considerations

### Environment Variables
No new environment variables required for MVP.

**Future Production Variables**:
```bash
EMAIL_SERVICE_API_KEY=...        # Email service authentication
EMAIL_FROM_ADDRESS=noreply@...   # Sender address
EMAIL_FROM_NAME=Famly            # Sender name
```

### Configuration
Password reset token expiration configurable in `better-auth.ts`:
```typescript
resetPasswordTokenExpiresIn: 3600 // seconds (1 hour default)
```

### Monitoring
Log events for monitoring:
- `Password reset requested` (userId, email)
- `Password reset email sent` (userId, email)
- `Password reset email failed` (error, email)
- `Password reset successful` (userId, email)
- `Password reset failed` (error, reason)

## Open Design Questions

### Q: Should we implement custom token generation instead of using Better Auth's?
**A**: No. Better Auth's token generation is cryptographically secure and well-tested. Custom implementation would increase maintenance burden and security risk without benefit.

### Q: Should password reset links include the token in query params or headers?
**A**: Query params (Better Auth default). This is standard practice for email-based password reset flows and required for clickable links in emails.

### Q: Should we add CAPTCHA to prevent automated password reset requests?
**A**: Not in MVP. Better Auth provides basic rate limiting. Add CAPTCHA as future enhancement if abuse is detected in production metrics.

### Q: Should the reset link redirect to the web app or include the API endpoint?
**A**: Reset link should point to web app page (e.g., `/reset-password?token=...`). The web app submits the token to the API. This provides better UX and allows web app to handle success/error states with proper UI.
