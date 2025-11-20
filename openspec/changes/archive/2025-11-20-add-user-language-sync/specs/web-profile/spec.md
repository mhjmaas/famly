## ADDED Requirements

### Requirement: Language selector syncs with backend preference
The web application MUST treat the backend-stored `user.language` as the source of truth for authenticated users and keep it in sync when the user changes locale.

#### Scenario: Changing language updates user profile
- **GIVEN** an authenticated user viewing any page with the language selector
- **WHEN** the user switches from `"en-US"` to `"nl-NL"`
- **THEN** the app calls the profile update endpoint with `language: "nl-NL"`
- **AND** refreshes the local user state so subsequent renders use `"nl-NL"` without a full reload

#### Scenario: Login/registration seeds stored language
- **GIVEN** an authenticated login or registration flow occurring under the route locale `/nl-NL`
- **WHEN** the auth request is completed
- **THEN** the client includes the active locale in the auth request
- **AND** the stored `user.language` matches the route locale used for the session

#### Scenario: Stored language drives locale for authenticated routes
- **GIVEN** an authenticated user with `user.language: "nl-NL"` and a request to `/` from a browser whose Accept-Language prefers English
- **WHEN** the app selects the locale for rendering/redirects
- **THEN** it uses the stored `user.language` (`"nl-NL"`) and routes the user to the Dutch locale variant of the page
