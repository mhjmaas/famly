## ADDED Requirements

### Requirement: Persist user language preference
The auth service MUST store each authenticated user's language preference on the Better Auth user record and expose it in auth/profile responses.

#### Scenario: Registration captures language
- **GIVEN** a `POST /v1/auth/register` request that includes a `language` value of `nl-NL`
- **WHEN** the request is validated
- **THEN** the user document is created with `language: "nl-NL"`
- **AND** the 201 response body `user.language` equals `"nl-NL"`

#### Scenario: Registration defaults language when omitted
- **GIVEN** a `POST /v1/auth/register` request without a `language` field
- **WHEN** the request is processed
- **THEN** the user document stores `language` using the active locale (from request URL or Accept-Language) or `en-US` if none is provided
- **AND** the response `user.language` reflects the stored value

#### Scenario: Login returns stored language
- **GIVEN** an existing user whose `language` is `"nl-NL"`
- **WHEN** they successfully call `POST /v1/auth/login`
- **THEN** the 200 response includes `user.language: "nl-NL"` and the session/JWT payloads carry the same value

#### Scenario: /me exposes language
- **GIVEN** an authenticated user with `language: "en-US"` stored
- **WHEN** the client calls `GET /v1/auth/me`
- **THEN** the response includes `user.language: "en-US"`

#### Scenario: Patch updates language
- **GIVEN** an authenticated user who sends `PATCH /v1/auth/me` with `language: "nl-NL"`
- **WHEN** the request validates successfully
- **THEN** the user document is updated to `language: "nl-NL"`
- **AND** the response returns the updated `user.language`
