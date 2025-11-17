## ADDED Requirements
### Requirement: Authenticated password rotation endpoint
The auth module MUST expose a cookie- or bearer-authenticated password change route that proxies Better Auth while enforcing Famly's validation rules.

#### Scenario: Password change succeeds and sessions are revoked
- **GIVEN** an authenticated request with a valid session cookie or bearer session token
- **AND** a JSON body `{ "currentPassword": "oldPassw0rd!", "newPassword": "newPassw0rd!", "revokeOtherSessions": true }`
- **WHEN** the client calls `POST /v1/auth/change-password`
- **THEN** the API validates that both passwords are at least 12 characters and different values
- **AND** the route calls `auth.api.changePassword` with the provided input while forcing `revokeOtherSessions=true`
- **AND** Better Auth's response `set-cookie` header is forwarded so the caller's session cookie becomes invalid
- **AND** the endpoint returns HTTP 204 with no body, signaling the client to reauthenticate

#### Scenario: Invalid current password generates 401
- **GIVEN** an authenticated request whose `currentPassword` does not match the stored credentials
- **WHEN** Better Auth rejects the operation
- **THEN** the route responds with HTTP 401 and body `{ "error": "invalid_current_password" }`
- **AND** no password update occurs

#### Scenario: Missing session is rejected
- **GIVEN** a request without a valid session cookie or bearer token
- **WHEN** the client calls `POST /v1/auth/change-password`
- **THEN** the request fails before reaching Better Auth
- **AND** the API responds with HTTP 401 and message "Authentication required"
