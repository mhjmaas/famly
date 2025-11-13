# Design: HTTPS Support via TLS Termination

## Context

Famly requires HTTPS for privacy, PWA functionality (service workers, push notifications), and user trust. The monorepo includes:
- Express API (port 3001) with Socket.IO on the same port
- Next.js web app (port 3000)
- Docker Compose orchestration for local dev and production
- Startup scripts (`start.sh`, `dev.sh`) for one-command setup
- Better Auth with session cookies requiring secure flag in production

Current architecture uses plain HTTP everywhere. We need to add HTTPS without disrupting the simple "clone and run" developer experience.

## Goals / Non-Goals

**Goals**:
- ✅ HTTPS by default for Docker-based development and production
- ✅ Support HTTPS requests, CORS, WebSocket connections (Socket.IO), and PWA features
- ✅ Zero-config HTTPS for local development (auto-generated certificates)
- ✅ Production-ready with Let's Encrypt support
- ✅ HTTP fallback for developers who manually run services (`pnpm dev`)
- ✅ No changes to API or web application code (containers serve HTTP internally)
- ✅ Maintain startup script simplicity

**Non-Goals**:
- ❌ End-to-end encryption between reverse proxy and backend (not needed for localhost/Docker network)
- ❌ Application-level TLS in Node.js/Express/Next.js
- ❌ Forcing HTTPS for manual development mode
- ❌ Complex certificate management (mkcert handles local, Let's Encrypt handles production)

## Decisions

### Decision 1: TLS Termination at Reverse Proxy (Caddy)

**Choice**: Use Caddy as a reverse proxy for TLS termination

**Rationale**:
1. **Security**: Industry best practice for containerized apps. Keeps private keys isolated from application code and dependencies. Single point of certificate management.

2. **Performance**: Offloads TLS encryption/decryption from Node.js. Research shows ~16% throughput increase for Node.js behind Nginx. Caddy offers similar benefits with simpler configuration.

3. **Maintainability**: Applications don't need to handle certificate files, reloading, or HTTPS configuration. Caddy auto-renews Let's Encrypt certificates.

4. **Simplicity**: Caddy's zero-config HTTPS with automatic HTTPS and HTTP/2. Caddyfile is significantly simpler than Nginx configuration.

5. **WebSocket Support**: Caddy automatically handles WebSocket upgrades - no special configuration needed (unlike Nginx requiring explicit proxy_set_header directives).

6. **Development Experience**: Caddy integrates mkcert for local development, generating trusted certificates automatically.

**Why Caddy over Nginx**:
- **Automatic HTTPS**: Caddy automatically obtains and renews Let's Encrypt certificates
- **Simpler Configuration**: Caddy's Caddyfile is more intuitive than Nginx config
- **Built-in mkcert Support**: Caddy can integrate with mkcert for local development
- **Modern Defaults**: HTTP/2, TLS 1.3 enabled by default
- **Smaller Attack Surface**: Written in Go with memory safety vs C

**Alternatives Considered**:
- ❌ **Application-level HTTPS**: Requires managing certificates in both API and web apps, exposes private keys to all dependencies, adds ~16% performance overhead, violates separation of concerns
- ❌ **Nginx**: More complex configuration, requires manual WebSocket upgrade headers, no automatic HTTPS
- ❌ **Traefik**: Excellent for dynamic multi-host environments, but overkill for single-host development setup
- ❌ **HAProxy**: Focused on load balancing, more complex for simple reverse proxy use case

### Decision 2: HTTP Fallback for Manual Development

**Choice**: Maintain HTTP support when developers run `pnpm dev` directly (outside Docker)

**Rationale**:
- **Flexibility**: Developers debugging without Docker shouldn't need Caddy
- **Simplicity**: No forced dependency on Docker for basic development
- **Backward Compatibility**: Existing development workflows continue to work
- **Protocol Toggle**: `PROTOCOL` environment variable allows easy switching

**Implementation**:
- Default `PROTOCOL=https` in `.env` (Docker starts Caddy)
- Developers can set `PROTOCOL=http` to skip Caddy
- CORS configuration accepts both `http://` and `https://` origins
- Better Auth secure cookies automatically enabled when URL starts with `https://`

### Decision 3: Unified Reverse Proxy for Web and API

**Choice**: Single Caddy instance proxying to both web (3000) and API (3001)

**Rationale**:
- **Simplicity**: One reverse proxy, one certificate, one domain
- **CORS Simplification**: Same-origin for web and API (both on port 443)
- **Resource Efficiency**: Single container vs two reverse proxies
- **Production Parity**: Matches typical production deployment (single load balancer)

**Architecture**:
```
Browser → https://localhost (Caddy :443)
            ├─ / → web:3000 (HTTP internally)
            └─ /api → api:3001 (HTTP internally)
                  └─ /socket.io → Socket.IO on api:3001
```

**URL Structure**:
- Web app: `https://localhost/` → `http://web:3000`
- API: `https://localhost/api` → `http://api:3001`
- WebSocket: `wss://localhost/socket.io` → `ws://api:3001/socket.io`

**Alternative Considered**:
- ❌ **Separate Domains**: `https://localhost` (web), `https://api.localhost` (API) - requires multiple certificates, complicates CORS, less typical for single-app deployment

### Decision 4: mkcert for Local Development Certificates

**Choice**: Use mkcert to generate locally-trusted certificates

**Rationale**:
- **Trust**: Certificates trusted by system (no browser warnings)
- **Simplicity**: One command (`mkcert -install`) installs CA
- **Cross-Platform**: Works on macOS, Linux, Windows
- **Mobile Testing**: Can export CA to test on phones/tablets
- **Automation**: Can be run in Docker startup scripts

**Implementation**:
- `dev.sh` checks for mkcert installation
- Generates `localhost.pem` and `localhost-key.pem` if missing
- Caddy container mounts certificate volume
- Developers only need to run `mkcert -install` once per machine

**Why Not Next.js `--experimental-https`**:
- Only covers web app (3000), not API (3001)
- No unified reverse proxy for WebSocket routing
- Next.js feature still experimental (since 13.5)
- Caddy solution covers entire stack uniformly

### Decision 5: Container Network Security Model

**Choice**: HTTPS for external traffic, HTTP for internal Docker network communication

**Rationale**:
- **Security Boundary**: External internet is untrusted, internal Docker network is trusted
- **Performance**: No encryption overhead for container-to-container communication
- **Simplicity**: No certificate management within application containers
- **Industry Standard**: Standard Docker deployment pattern (reverse proxy at edge)

**Security Properties**:
- External traffic (browser → Caddy): Encrypted via TLS 1.3
- Internal traffic (Caddy → containers): Plain HTTP over bridge network
- Container-to-container: Plain HTTP (mongo, minio, api, web)

**Risk Mitigation**:
- Docker bridge network is isolated (not exposed to host by default)
- Production deployment would use private VPC/network
- For production on cloud, can add backend TLS if required by compliance

## Architecture

### Development Architecture (Docker)

```
┌─────────────────────────────────────────────────────────────┐
│                        Host Machine                          │
│                                                              │
│  Browser → https://localhost:443                            │
│                      ↓                                       │
│         ┌──────────────────────┐                            │
│         │  Caddy Container     │                            │
│         │  - TLS termination   │                            │
│         │  - Auto HTTPS        │                            │
│         │  - mkcert certs      │                            │
│         └──────────────────────┘                            │
│                ↓          ↓                                  │
│         (HTTP over Docker bridge)                           │
│                ↓          ↓                                  │
│    ┌───────────────┐   ┌──────────────┐                    │
│    │  web:3000     │   │  api:3001    │                    │
│    │  (Next.js)    │   │  (Express +  │                    │
│    │               │   │   Socket.IO) │                    │
│    └───────────────┘   └──────────────┘                    │
│                              ↓                               │
│                        ┌───────────┐                        │
│                        │  mongo    │                        │
│                        │  minio    │                        │
│                        └───────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Manual Development Architecture (HTTP)

```
┌─────────────────────────────────────────────────────────────┐
│                        Host Machine                          │
│                                                              │
│  Browser → http://localhost:3000 (web)                      │
│            http://localhost:3001 (API)                      │
│                      ↓              ↓                        │
│    ┌───────────────────┐   ┌──────────────────┐           │
│    │  Next.js Dev      │   │  Express Dev     │           │
│    │  pnpm dev:web     │   │  pnpm dev:api    │           │
│    └───────────────────┘   └──────────────────┘           │
│                                    ↓                         │
│                        ┌───────────────────┐                │
│                        │  MongoDB (Docker) │                │
│                        │  MinIO (Docker)   │                │
│                        └───────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Production Server                       │
│                                                              │
│  Internet → https://famly.app:443                           │
│                      ↓                                       │
│         ┌──────────────────────┐                            │
│         │  Caddy Container     │                            │
│         │  - TLS termination   │                            │
│         │  - Let's Encrypt     │                            │
│         │  - Auto renewal      │                            │
│         └──────────────────────┘                            │
│                ↓          ↓                                  │
│         (HTTP over Docker bridge)                           │
│                ↓          ↓                                  │
│    ┌───────────────┐   ┌──────────────┐                    │
│    │  web:3000     │   │  api:3001    │                    │
│    │  (Next.js)    │   │  (Express +  │                    │
│    │               │   │   Socket.IO) │                    │
│    └───────────────┘   └──────────────┘                    │
│                              ↓                               │
│                        ┌───────────┐                        │
│                        │  mongo    │                        │
│                        │  minio    │                        │
│                        └───────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Configuration Details

### Caddyfile Structure

```caddyfile
{
    # Development: mkcert for local certificates
    # Production: automatic Let's Encrypt via ACME

    # Production only
    # email admin@famly.app
    # acme_ca https://acme-v02.api.letsencrypt.org/directory
}

# Main domain
localhost {
    # Reverse proxy to web app
    reverse_proxy web:3000

    # API routes
    handle_path /api/* {
        reverse_proxy api:3001
    }

    # WebSocket support (Socket.IO)
    @websockets {
        header Connection *Upgrade*
        header Upgrade websocket
    }
    handle @websockets {
        reverse_proxy api:3001
    }
}
```

### Environment Variables

**New Variables**:
- `PROTOCOL`: `https` | `http` (default: `https`)
  - Used by startup scripts to determine if Caddy should start
  - Used to construct `BETTER_AUTH_URL` and `NEXT_PUBLIC_API_URL`

**Updated Variables**:
- `BETTER_AUTH_URL`: `${PROTOCOL}://localhost:3001`
- `CLIENT_URL`: `${PROTOCOL}://localhost:3000`
- `NEXT_PUBLIC_API_URL`: `${PROTOCOL}://localhost:3001`

### CORS Configuration Updates

**API CORS** (`apps/api/src/app.ts`):
```typescript
const allowedOrigins = [
  env.CLIENT_URL,                // https://localhost:3000 or 192.168.x.x
  "http://localhost:3000",       // HTTP fallback
  "https://localhost:3000",      // HTTPS
  "http://127.0.0.1:3000",       // HTTP fallback
  "https://127.0.0.1:3000",      // HTTPS
];
```

**Socket.IO CORS** (`apps/api/src/modules/chat/realtime/socket-server.ts`):
```typescript
cors: {
  origin: [
    process.env.CORS_ORIGIN || "http://localhost:3000",
    "https://localhost:3000",
  ],
  methods: ["GET", "POST"],
  credentials: true,
}
```

## Risks / Trade-offs

### Risk 1: Developer Onboarding Complexity
**Risk**: Developers need to install mkcert and trust certificates

**Mitigation**:
- `dev.sh` checks for mkcert and provides installation instructions
- One-time setup: `brew install mkcert && mkcert -install`
- Alternatively, developers can use `PROTOCOL=http` to skip Caddy entirely
- Clear documentation in README with troubleshooting section

**Trade-off**: Slight increase in initial setup vs significant security improvement

### Risk 2: Port Conflicts
**Risk**: Caddy requires port 443, which may conflict with other services

**Mitigation**:
- `dev.sh` checks for port conflicts before starting
- Error messages guide users to stop conflicting services
- Alternative: Change Caddy port to 8443 in docker-compose.dev.yml

**Trade-off**: Standard port 443 vs avoiding conflicts (standard port better for production parity)

### Risk 3: Certificate Trust Issues on Mobile
**Risk**: Testing on mobile devices requires exporting mkcert CA

**Mitigation**:
- Document mobile testing setup: `mkcert -CAROOT` shows CA location
- Export and install CA on iOS/Android test devices
- Alternative: Use network IP with HTTP mode for quick mobile testing

**Trade-off**: Extra setup for mobile testing vs proper HTTPS testing experience

### Risk 4: Debugging Complexity
**Risk**: Reverse proxy adds layer between browser and applications

**Mitigation**:
- Caddy logs requests (access logs can be enabled)
- HTTP still works for debugging (`PROTOCOL=http`)
- Direct container access available: `docker exec -it famly-api-1 sh`
- Caddy has good error messages for proxy failures

**Trade-off**: Extra layer vs production-parity environment

### Risk 5: WebSocket Connection Issues
**Risk**: WebSocket upgrade through reverse proxy may fail

**Mitigation**:
- Caddy automatically handles WebSocket upgrades (no special config needed)
- Socket.IO falls back to polling if WebSocket fails
- Tested configuration pattern (widely used in production)

**Trade-off**: None - Caddy's automatic WebSocket handling is robust

## Migration Plan

### Development Environment Migration

**Phase 1: Add Caddy Container** (Week 1)
1. Add Caddy Dockerfile and Caddyfile
2. Update docker-compose.dev.yml with Caddy service
3. Add mkcert installation check to dev.sh
4. Generate certificates on first run

**Phase 2: Update Configuration** (Week 1)
1. Add `PROTOCOL` environment variable
2. Update CORS origins to include HTTPS
3. Update API client base URL to use PROTOCOL
4. Update environment variable validation

**Phase 3: Documentation** (Week 1)
1. Update README with HTTPS setup instructions
2. Add troubleshooting section for certificate issues
3. Document HTTP fallback mode
4. Add mobile testing guide

**Phase 4: Production Deployment** (Week 2)
1. Add Caddy service to docker-compose.yml
2. Configure Let's Encrypt email
3. Test deployment on staging server
4. Update DNS and deploy to production

### Rollback Plan

If issues arise:
1. Set `PROTOCOL=http` in .env files
2. Remove Caddy container from docker-compose
3. Revert CORS configuration changes
4. All applications continue working with HTTP

### Testing Strategy

**Local Development**:
- ✅ Verify HTTPS access to web app
- ✅ Verify HTTPS access to API
- ✅ Test WebSocket connection (Socket.IO)
- ✅ Test CORS preflight requests
- ✅ Verify HTTP fallback mode works
- ✅ Test mobile device access with exported CA

**Production**:
- ✅ Verify Let's Encrypt certificate acquisition
- ✅ Test auto-renewal (wait 60 days or force renewal)
- ✅ Load testing to verify performance
- ✅ Security scan (SSL Labs)

## Open Questions

1. **Domain Names for Production**: What domain(s) will production use?
   - Answer needed for Let's Encrypt configuration
   - Multiple domains (famly.app, www.famly.app, api.famly.app)?

2. **Certificate Storage**: Where should certificates be stored in production?
   - Docker volume for persistence across container restarts
   - Host-mounted directory for backups?

3. **Monitoring**: How to monitor certificate expiration?
   - Caddy handles renewal automatically
   - Add monitoring for renewal failures?

4. **Mobile App Support**: Future native mobile apps?
   - Will need to handle HTTPS API calls
   - Certificate pinning considerations?

5. **Backend TLS**: Do we need encryption between Caddy and backend containers?
   - Current design: No (trust internal Docker network)
   - Future: Add if required by compliance (HIPAA, SOC 2, etc.)
