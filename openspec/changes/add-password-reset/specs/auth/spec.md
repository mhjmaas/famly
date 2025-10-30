# auth Specification

## Purpose
Enable users to recover their accounts by resetting forgotten passwords through a secure email-based flow.

## ADDED Requirements

### Requirement: Request Password Reset
Users MUST be able to request a password reset by providing their email address, triggering an email with a time-limited reset link.

#### Scenario: Request reset with valid registered email
- **GIVEN** a user with email "user@example.com" exists in the system
- **WHEN** a client POSTs to `/v1/auth/request-password-reset` with `{ email: "user@example.com" }`
- **THEN** the API responds with HTTP 200
- **AND** the response body contains `{ message: "If your email is registered, you will receive a password reset link" }`
- **AND** a password reset email is sent to "user@example.com" containing a reset link with token
- **AND** the reset token is valid for 1 hour

#### Scenario: Request reset with non-existent email returns same response
- **GIVEN** no user exists with email "nonexistent@example.com"
- **WHEN** a client POSTs to `/v1/auth/request-password-reset` with `{ email: "nonexistent@example.com" }`
- **THEN** the API responds with HTTP 200
- **AND** the response body contains `{ message: "If your email is registered, you will receive a password reset link" }`
- **AND** no email is sent (but response does not reveal this)

#### Scenario: Reject request with invalid email format
- **GIVEN** a client submits an invalid email format
- **WHEN** they POST to `/v1/auth/request-password-reset` with `{ email: "not-an-email" }`
- **THEN** the API responds with HTTP 400
- **AND** the error message indicates invalid email format

#### Scenario: Reject request with missing email
- **GIVEN** a client submits a request without an email field
- **WHEN** they POST to `/v1/auth/request-password-reset` with `{}`
- **THEN** the API responds with HTTP 400
- **AND** the error message indicates email is required

#### Scenario: Password reset email contains valid token and instructions
- **GIVEN** a user requests a password reset
- **WHEN** the password reset email is generated
- **THEN** the email contains a reset URL with format `{baseUrl}/reset-password?token={token}`
- **AND** the email includes clear instructions on resetting the password
- **AND** the email indicates the link expires in 1 hour
- **AND** the token in the URL is a secure, single-use token

#### Scenario: Multiple password reset requests generate new tokens
- **GIVEN** a user has already requested a password reset
- **WHEN** they request another password reset before the first token expires
- **THEN** a new token is generated and sent via email
- **AND** the previous token remains valid until expiration
- **AND** both tokens can be used to reset the password (until one is used)

### Requirement: Reset Password with Token
Users MUST be able to reset their password by providing a valid reset token and a new password, with automatic session invalidation.

#### Scenario: Reset password with valid token
- **GIVEN** a user has requested a password reset and received a token
- **AND** the token has not expired (within 1 hour)
- **WHEN** they POST to `/v1/auth/reset-password` with `{ token: "{valid-token}", newPassword: "NewSecurePass123!" }`
- **THEN** the API responds with HTTP 200
- **AND** the response body contains `{ message: "Password reset successful" }`
- **AND** the user's password is updated to the new password
- **AND** all existing user sessions are invalidated

#### Scenario: User can login with new password after reset
- **GIVEN** a user has successfully reset their password to "NewPassword123!"
- **WHEN** they POST to `/v1/auth/login` with the new credentials
- **THEN** the login succeeds with HTTP 200
- **AND** a new session is created

#### Scenario: User cannot login with old password after reset
- **GIVEN** a user had password "OldPassword123!" and reset it to "NewPassword123!"
- **WHEN** they attempt to POST to `/v1/auth/login` with the old password
- **THEN** the login fails with HTTP 401
- **AND** the error message indicates invalid credentials

#### Scenario: Existing sessions are invalidated after password reset
- **GIVEN** a user has an active authenticated session
- **AND** they reset their password using a reset token
- **WHEN** they attempt to use the old session cookie or JWT
- **THEN** the API responds with HTTP 401
- **AND** they must login again to obtain a new session

#### Scenario: Reject password reset with expired token
- **GIVEN** a user requested a password reset more than 1 hour ago
- **WHEN** they POST to `/v1/auth/reset-password` with the expired token
- **THEN** the API responds with HTTP 400
- **AND** the error message indicates the token has expired

#### Scenario: Reject password reset with invalid token
- **GIVEN** a client submits a non-existent or malformed token
- **WHEN** they POST to `/v1/auth/reset-password` with `{ token: "invalid-token", newPassword: "NewPass123!" }`
- **THEN** the API responds with HTTP 400
- **AND** the error message indicates the token is invalid

#### Scenario: Reject password reset with already-used token
- **GIVEN** a user has successfully used a reset token to change their password
- **WHEN** they attempt to POST to `/v1/auth/reset-password` with the same token again
- **THEN** the API responds with HTTP 400
- **AND** the error message indicates the token is invalid or has been used

#### Scenario: Reject password reset with weak password
- **GIVEN** a user submits a valid reset token
- **WHEN** they POST to `/v1/auth/reset-password` with `{ token: "{valid-token}", newPassword: "short" }`
- **THEN** the API responds with HTTP 400
- **AND** the error message indicates password must be at least 8 characters

#### Scenario: Reject password reset with missing token
- **GIVEN** a client submits a request without a token
- **WHEN** they POST to `/v1/auth/reset-password` with `{ newPassword: "NewPass123!" }`
- **THEN** the API responds with HTTP 400
- **AND** the error message indicates token is required

#### Scenario: Reject password reset with missing password
- **GIVEN** a client submits a request without a password
- **WHEN** they POST to `/v1/auth/reset-password` with `{ token: "{valid-token}" }`
- **THEN** the API responds with HTTP 400
- **AND** the error message indicates password is required

### Requirement: Password Reset Logging and Monitoring
All password reset activities MUST be logged for security monitoring and debugging purposes.

#### Scenario: Password reset request is logged
- **GIVEN** a user requests a password reset
- **WHEN** the request is processed successfully
- **THEN** a structured log entry is created with level "info"
- **AND** the log includes the user's email and user ID (if exists)
- **AND** the log message indicates "Password reset requested"

#### Scenario: Password reset completion is logged
- **GIVEN** a user successfully resets their password
- **WHEN** the password reset completes
- **THEN** a structured log entry is created with level "info"
- **AND** the log includes the user's ID and email
- **AND** the log message indicates "Password reset successful"

#### Scenario: Failed password reset attempts are logged
- **GIVEN** a user attempts to reset password with invalid token
- **WHEN** the reset fails due to validation error
- **THEN** a structured log entry is created with level "warn"
- **AND** the log includes the failure reason
- **AND** the log message indicates "Password reset failed"

#### Scenario: Email delivery failures are logged
- **GIVEN** the email service fails to send a password reset email
- **WHEN** the email sending operation fails
- **THEN** a structured log entry is created with level "error"
- **AND** the log includes the error details and recipient email
- **AND** the log message indicates "Password reset email failed"
