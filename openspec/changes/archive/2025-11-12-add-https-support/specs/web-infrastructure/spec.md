## ADDED Requirements

### Requirement: Protocol-Aware API Client
The web application API client SHALL construct base URLs using protocol-aware environment variables.

#### Scenario: HTTPS API URL in production
- **GIVEN** NEXT_PUBLIC_API_URL is https://localhost:3001
- **WHEN** web application makes API request
- **THEN** request is sent to https://localhost:3001/api/endpoint
- **AND** credentials are included in request

#### Scenario: HTTP API URL for fallback mode
- **GIVEN** NEXT_PUBLIC_API_URL is http://localhost:3001
- **WHEN** web application makes API request
- **THEN** request is sent to http://localhost:3001/api/endpoint
- **AND** credentials are included in request

#### Scenario: Server-side API request with cookies
- **GIVEN** Next.js server-side rendering or API route
- **WHEN** server makes API request with user session
- **THEN** Cookie header is forwarded from incoming request
- **AND** API authenticates user via session cookie

### Requirement: PWA HTTPS Context
The web application SHALL be served over HTTPS to enable full Progressive Web App features including service workers.

#### Scenario: Service worker registration over HTTPS
- **GIVEN** web application is accessed via https://localhost
- **WHEN** page loads
- **THEN** browser allows service worker registration
- **AND** PWA features (offline, push notifications) are available

#### Scenario: Service worker blocked over HTTP
- **GIVEN** web application is accessed via http://localhost:3000 (fallback mode)
- **WHEN** page attempts to register service worker
- **THEN** browser blocks service worker registration
- **AND** console shows HTTPS requirement warning

#### Scenario: Push notification permission over HTTPS
- **GIVEN** web application is served over HTTPS
- **WHEN** user grants notification permission
- **THEN** browser allows push notification subscription
- **AND** web push API is available

### Requirement: Secure Context APIs
The web application SHALL have access to secure context Web APIs when served over HTTPS.

#### Scenario: Web Crypto API available over HTTPS
- **GIVEN** web application is accessed via https://localhost
- **WHEN** application uses window.crypto.subtle
- **THEN** Web Crypto API is available
- **AND** cryptographic operations succeed

#### Scenario: Geolocation API available over HTTPS
- **GIVEN** web application is accessed via https://localhost
- **WHEN** application requests user location
- **THEN** browser allows geolocation prompt
- **AND** location data can be accessed

#### Scenario: Secure APIs unavailable over HTTP
- **GIVEN** web application is accessed via http://localhost:3000
- **WHEN** application attempts to use secure context API
- **THEN** browser restricts or blocks the API
- **AND** console shows secure context requirement warning

### Requirement: Mixed Content Prevention
The web application SHALL not load insecure resources when served over HTTPS.

#### Scenario: All assets loaded over HTTPS
- **GIVEN** web application is served via https://localhost
- **WHEN** page loads with images, scripts, and stylesheets
- **THEN** all resources are loaded via HTTPS or relative URLs
- **AND** no mixed content warnings appear in console

#### Scenario: API requests use same protocol
- **GIVEN** web application is served via https://localhost
- **WHEN** application makes fetch requests to API
- **THEN** requests use https:// protocol
- **AND** no mixed content errors occur
