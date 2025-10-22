## ADDED Requirements
### Requirement: Collect user profile fields during registration
The registration endpoint MUST require a display name and birthdate for every new account and persist them with the created user.

#### Scenario: Registration succeeds with name and birthdate
- **GIVEN** a registration payload containing `email`, `password`, `name`, and `birthdate` in ISO `YYYY-MM-DD` format
- **WHEN** the client calls `POST /v1/auth/register`
- **THEN** the user record is created with the provided `name` and `birthdate`
- **AND** the 201 response includes `user.name` and `user.birthdate` matching the request payload

#### Scenario: Registration rejects missing birthdate
- **GIVEN** a registration payload that omits `birthdate`
- **WHEN** the client calls `POST /v1/auth/register`
- **THEN** the API responds with HTTP 400 and a validation message indicating `birthdate` is required

### Requirement: /v1/auth/me returns stored profile fields
The authenticated profile endpoint MUST surface the persisted name and birthdate for the signed-in user.

#### Scenario: /me returns name and birthdate
- **GIVEN** an authenticated user who has `name` and `birthdate` stored on their profile
- **WHEN** the client calls `GET /v1/auth/me`
- **THEN** the response includes `user.name` and `user.birthdate`
- **AND** the values match what was stored at registration or through profile updates
