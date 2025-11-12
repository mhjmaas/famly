## ADDED Requirements

### Requirement: Protocol-Aware CORS Configuration
The API CORS middleware SHALL accept both HTTP and HTTPS origins to support development flexibility.

#### Scenario: HTTPS origin allowed
- **GIVEN** browser makes CORS preflight request from https://localhost:3000
- **WHEN** API receives the OPTIONS request
- **THEN** Access-Control-Allow-Origin header includes https://localhost:3000
- **AND** Access-Control-Allow-Credentials is set to true
- **AND** request proceeds successfully

#### Scenario: HTTP origin allowed for fallback mode
- **GIVEN** browser makes CORS preflight request from http://localhost:3000
- **WHEN** API receives the OPTIONS request
- **THEN** Access-Control-Allow-Origin header includes http://localhost:3000
- **AND** Access-Control-Allow-Credentials is set to true
- **AND** request proceeds successfully

#### Scenario: Network IP with HTTPS allowed
- **GIVEN** developer accesses app from mobile device at https://192.168.1.100:3000
- **WHEN** mobile browser makes CORS request to API
- **THEN** Access-Control-Allow-Origin header includes the network IP URL
- **AND** request proceeds successfully

#### Scenario: Unknown origin rejected
- **GIVEN** browser makes request from https://evil.com
- **WHEN** API receives the CORS preflight
- **THEN** Access-Control-Allow-Origin is not set
- **AND** browser blocks the request

### Requirement: Socket.IO HTTPS Support
Socket.IO server configuration SHALL support WebSocket connections over HTTPS via reverse proxy.

#### Scenario: WebSocket upgrade through HTTPS
- **GIVEN** client connects via wss://localhost/socket.io
- **WHEN** connection reaches API through Caddy reverse proxy
- **THEN** Socket.IO accepts the WebSocket upgrade
- **AND** connection establishes successfully
- **AND** real-time messages flow bidirectionally

#### Scenario: Socket.IO CORS with HTTPS origins
- **GIVEN** Socket.IO server is configured
- **WHEN** client from https://localhost:3000 attempts connection
- **THEN** CORS check passes for HTTPS origin
- **AND** WebSocket connection is established

#### Scenario: Polling transport fallback
- **GIVEN** WebSocket connection fails through reverse proxy
- **WHEN** Socket.IO client attempts connection
- **THEN** client falls back to long-polling transport
- **AND** connection establishes over HTTPS polling

### Requirement: Better Auth Secure Cookies
Better Auth SHALL automatically enable secure cookie flags when BETTER_AUTH_URL uses HTTPS protocol.

#### Scenario: Secure cookies enabled for HTTPS
- **GIVEN** BETTER_AUTH_URL is https://localhost:3001
- **WHEN** user authenticates successfully
- **THEN** session cookie has Secure flag set
- **AND** cookie is only sent over HTTPS connections

#### Scenario: Secure cookies disabled for HTTP
- **GIVEN** BETTER_AUTH_URL is http://localhost:3001
- **WHEN** user authenticates successfully
- **THEN** session cookie does not have Secure flag
- **AND** cookie is sent over HTTP (development only)

### Requirement: Environment Variable Protocol Detection
API configuration SHALL derive protocol (HTTP/HTTPS) from environment variables without requiring explicit protocol flags.

#### Scenario: HTTPS detected from BETTER_AUTH_URL
- **GIVEN** BETTER_AUTH_URL environment variable is https://localhost:3001
- **WHEN** API server starts
- **THEN** isHttps configuration flag is true
- **AND** secure cookies are enabled
- **AND** CORS includes HTTPS origins

#### Scenario: HTTP detected from BETTER_AUTH_URL
- **GIVEN** BETTER_AUTH_URL environment variable is http://localhost:3001
- **WHEN** API server starts
- **THEN** isHttps configuration flag is false
- **AND** secure cookies are disabled
- **AND** CORS includes HTTP origins
