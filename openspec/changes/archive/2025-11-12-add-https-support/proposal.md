# Change: Add HTTPS Support as First-Class Citizen

## Why

Famly is a privacy-first family management platform. HTTPS is essential for:
- **Privacy**: Encrypted communication protects sensitive family data (chores, allowances, calendars, chat)
- **Security**: Prevents man-in-the-middle attacks on authentication tokens and session cookies
- **PWA Requirements**: Service workers and push notifications require HTTPS in production
- **Trust**: Users expect the padlock icon for applications handling personal family information

Currently, the entire stack (API, web, WebSockets) runs over HTTP, exposing all traffic to potential interception. This change establishes HTTPS as the default for all environments while maintaining developer experience.

## What Changes

**Architecture Decision**: TLS termination via reverse proxy (Caddy) with HTTP fallback for manual development

- **Production & Local Development**: Caddy handles TLS termination, routes HTTPS → backend HTTP services
  - Auto-generates certificates via mkcert for local development
  - Supports Let's Encrypt ACME for production domains
  - Single reverse proxy for both web (3000) and API (3001)
  - WebSocket (Socket.IO) upgrade support with proper headers

- **HTTP Fallback**: Manual development mode continues to work
  - Developers running `pnpm dev` directly (no Docker) use HTTP
  - Containers still serve HTTP internally (no application changes)
  - CORS configuration updated to allow both http:// and https:// origins

- **Environment Configuration**:
  - New `PROTOCOL` environment variable (https|http, default: https)
  - Better Auth URL becomes protocol-aware: `${PROTOCOL}://localhost:3001`
  - CORS origins include both HTTP and HTTPS variants
  - Socket.IO client connection URL protocol-aware

- **Development Experience**:
  - `start-dev.sh` launches Caddy container alongside existing services
  - Developers access app via `https://localhost` (Caddy → web:3000)
  - API accessible via `https://localhost/api` (Caddy → api:3001)
  - `pnpm dev` continues to work with HTTP (no Caddy)

- **PWA Enhancements**:
  - HTTPS enables full service worker support (currently manifest-only)
  - Push notifications can be implemented (currently unavailable over HTTP)
  - Secure context for Web Crypto API and other restricted features

## Impact

**Affected Specs**:
- `deployment` (NEW): Docker Compose orchestration with Caddy container
- `web-infrastructure` (NEW): Frontend configuration and environment variables
- `api-infrastructure` (NEW): Backend configuration, CORS, Socket.IO

**Affected Code**:
- `docker/compose.dev.yml`: Add Caddy service, update ports
- `docker-compose.yml`: Add Caddy service for production
- `docker/caddy/Caddyfile`: New reverse proxy configuration
- `docker/caddy/Dockerfile`: New Caddy container
- `apps/api/src/app.ts`: Update CORS origins to include HTTPS
- `apps/api/src/modules/chat/realtime/socket-server.ts`: Update CORS origins
- `apps/api/src/config/env.ts`: Add protocol-aware URL validation
- `apps/web/src/lib/api-client.ts`: Protocol-aware API base URL
- `start-dev.sh`: Add Caddy startup, update documentation
- `start.sh`: Add Caddy startup, update documentation
- `.env.example`: Add PROTOCOL variable
- `README.md`: Update getting started instructions

**Breaking Changes**: None
- HTTP continues to work for manual development
- Existing Docker setup gains HTTPS via Caddy (non-breaking addition)
- Environment variables have sensible defaults

**Migration Path**:
- Existing `.env` files work without changes (defaults to https)
- Developers can opt into HTTP with `PROTOCOL=http` if needed
- No code changes required for services (HTTP internally)
