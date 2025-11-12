## ADDED Requirements

### Requirement: Reverse Proxy Container
The deployment configuration SHALL include a Caddy reverse proxy container that handles TLS termination for both web and API services.

#### Scenario: Development environment Caddy service
- **GIVEN** Docker Compose development configuration
- **WHEN** services are started with `start-dev.sh`
- **THEN** Caddy container runs on port 443
- **AND** proxies traffic to web container on port 3000
- **AND** proxies /api traffic to API container on port 3001
- **AND** handles WebSocket upgrade for Socket.IO connections

#### Scenario: Production environment Caddy service
- **GIVEN** Docker Compose production configuration
- **WHEN** services are deployed to production
- **THEN** Caddy container runs on port 443
- **AND** obtains Let's Encrypt certificates automatically
- **AND** renews certificates before expiration
- **AND** proxies traffic to web and API containers over HTTP

#### Scenario: Caddy container dependencies
- **GIVEN** Caddy reverse proxy service
- **WHEN** Docker Compose starts services
- **THEN** Caddy container starts after web and API containers
- **AND** Caddy depends on web and API services being healthy

### Requirement: Local Development Certificates
The development environment SHALL use mkcert to generate locally-trusted TLS certificates for HTTPS development.

#### Scenario: Certificate generation on first run
- **GIVEN** developer runs `start-dev.sh` for the first time
- **WHEN** mkcert is installed on the system
- **THEN** startup script generates localhost.pem and localhost-key.pem
- **AND** certificates are stored in docker/caddy/certs directory
- **AND** Caddy container mounts certificate volume

#### Scenario: Missing mkcert installation
- **GIVEN** developer runs `start-dev.sh`
- **WHEN** mkcert is not installed
- **THEN** script displays installation instructions
- **AND** provides commands for macOS, Linux, and Windows
- **AND** exits with error code

#### Scenario: Existing certificates reuse
- **GIVEN** certificates exist in docker/caddy/certs
- **WHEN** developer runs `start-dev.sh`
- **THEN** existing certificates are reused
- **AND** no new certificates are generated

### Requirement: HTTP Fallback Mode
The deployment configuration SHALL support HTTP fallback mode for developers who run services manually outside Docker.

#### Scenario: HTTP mode enabled via environment variable
- **GIVEN** PROTOCOL environment variable is set to "http"
- **WHEN** services start
- **THEN** Caddy container does not start
- **AND** web service serves on http://localhost:3000
- **AND** API service serves on http://localhost:3001
- **AND** CORS configuration allows HTTP origins

#### Scenario: HTTPS mode as default
- **GIVEN** PROTOCOL environment variable is not set or set to "https"
- **WHEN** Docker Compose services start
- **THEN** Caddy container starts and handles HTTPS
- **AND** web and API containers serve HTTP internally
- **AND** external access is via https://localhost

### Requirement: Port Conflict Detection
Startup scripts SHALL detect port conflicts before starting services and provide clear error messages.

#### Scenario: Port 443 already in use
- **GIVEN** another service is using port 443
- **WHEN** developer runs `start-dev.sh`
- **THEN** script detects the conflict
- **AND** displays which process is using port 443
- **AND** suggests stopping the conflicting service
- **AND** exits without starting containers

#### Scenario: All ports available
- **GIVEN** ports 443, 3000, 3001, 9001, 27017 are free
- **WHEN** developer runs `start-dev.sh`
- **THEN** all services start successfully
- **AND** no port conflict warnings are shown

### Requirement: Docker Network Configuration
Services SHALL communicate over an isolated Docker bridge network with external HTTPS access via Caddy.

#### Scenario: Internal HTTP communication
- **GIVEN** all services are running in Docker network
- **WHEN** Caddy proxies request to web or API
- **THEN** communication uses HTTP over bridge network
- **AND** web container accessed via http://web:3000
- **AND** API container accessed via http://api:3001

#### Scenario: External HTTPS access
- **GIVEN** Caddy reverse proxy is running
- **WHEN** browser makes request to https://localhost
- **THEN** Caddy terminates TLS connection
- **AND** proxies request to appropriate backend over HTTP
- **AND** response is encrypted before sending to browser
