## 1. Caddy Reverse Proxy Setup

- [ ] 1.1 Create docker/caddy/Caddyfile with reverse proxy configuration
  - Proxy / to web:3000
  - Proxy /api to api:3001
  - WebSocket upgrade handling for Socket.IO
  - Development and production configuration

- [ ] 1.2 Create docker/caddy/Dockerfile
  - Base on official Caddy image
  - Copy Caddyfile into container
  - Expose port 443

- [ ] 1.3 Add Caddy service to docker/compose.dev.yml
  - Port mapping 443:443
  - Mount Caddyfile
  - Mount certificate volume (./docker/caddy/certs)
  - Depends on web and API services
  - Add to famly-dev-network

- [ ] 1.4 Add Caddy service to docker-compose.yml (production)
  - Port mapping 443:443
  - Mount Caddyfile
  - Volume for Let's Encrypt certificates
  - Depends on web and API services
  - Add to famly-network

## 2. Certificate Management

- [ ] 2.1 Update start-dev.sh to check for mkcert installation
  - Detect OS (macOS, Linux, Windows)
  - Check if mkcert is in PATH
  - Display installation instructions if missing
  - Provide commands: brew install mkcert (macOS), apt-get/yum (Linux)

- [ ] 2.2 Add certificate generation to start-dev.sh
  - Check if docker/caddy/certs/localhost.pem exists
  - If missing, run: mkcert -cert-file docker/caddy/certs/localhost.pem -key-file docker/caddy/certs/localhost-key.pem localhost 127.0.0.1 ::1
  - Create docker/caddy/certs directory if needed
  - Display success message with certificate location

- [ ] 2.3 Update .gitignore to exclude certificates
  - Add docker/caddy/certs/*.pem
  - Keep directory structure with .gitkeep

## 3. Environment Configuration

- [ ] 3.1 Add PROTOCOL environment variable
  - Add to .env.example with value "https"
  - Document values: https | http
  - Add description: "Protocol for external access (https via Caddy, http for manual dev)"

- [ ] 3.2 Update API environment configuration (apps/api/src/config/env.ts)
  - Keep existing BETTER_AUTH_URL validation (URL format)
  - Keep existing CLIENT_URL validation
  - No changes needed (protocol detected from URLs)

- [ ] 3.3 Update web environment configuration
  - Update NEXT_PUBLIC_API_URL default if needed
  - Ensure protocol is part of URL (https://localhost:3001)

- [ ] 3.4 Update .env.example files
  - Set BETTER_AUTH_URL=https://localhost:3001
  - Set CLIENT_URL=https://localhost:3000
  - Set NEXT_PUBLIC_API_URL=https://localhost:3001
  - Add comments explaining HTTP fallback

## 4. CORS Configuration Updates

- [ ] 4.1 Update API CORS middleware (apps/api/src/app.ts)
  - Add both http:// and https:// variants to allowedOrigins
  - Include localhost and 127.0.0.1 for both protocols
  - Keep existing CLIENT_URL origin
  - Test: Both HTTP and HTTPS origins accepted

- [ ] 4.2 Update Socket.IO CORS (apps/api/src/modules/chat/realtime/socket-server.ts)
  - Update origin array to include https://localhost:3000
  - Keep existing CORS_ORIGIN environment variable support
  - Add HTTP fallback origin
  - Test: WebSocket connection works with both protocols

## 5. API Client Updates

- [ ] 5.1 Update web API client (apps/web/src/lib/api-client.ts)
  - Verify NEXT_PUBLIC_API_URL is used correctly
  - Ensure protocol from environment variable is respected
  - No code changes expected (already uses env var)
  - Test: API calls work with both http:// and https:// base URLs

## 6. Startup Script Enhancements

- [ ] 6.1 Update start-dev.sh with port 443 check
  - Add lsof -i :443 check to detect conflicts
  - Display which process is using port 443 if occupied
  - Suggest stopping conflicting service
  - Exit with error if port unavailable

- [ ] 6.2 Update start-dev.sh with Caddy startup
  - Check PROTOCOL environment variable
  - If PROTOCOL=https, start Caddy container
  - If PROTOCOL=http, skip Caddy and continue with HTTP
  - Display access URLs based on protocol

- [ ] 6.3 Update start.sh with Caddy configuration
  - Similar PROTOCOL check and Caddy startup
  - Production uses Let's Encrypt (no mkcert)
  - Update success message with https:// URLs

- [ ] 6.4 Add startup script output clarity
  - Display: "🚀 Starting services with HTTPS (via Caddy)"
  - Show certificate location if mkcert used
  - Show access URLs: https://localhost (web), https://localhost/api (API)
  - Provide fallback instructions if issues occur

## 7. Documentation

- [ ] 7.1 Update README.md with HTTPS setup
  - Add "HTTPS Setup" section under "Development"
  - Document mkcert installation steps
  - Explain one-time setup: mkcert -install
  - Show both HTTPS (default) and HTTP fallback modes

- [ ] 7.2 Add troubleshooting section to README
  - Certificate not trusted: run mkcert -install
  - Port 443 conflict: stop other services or change port
  - WebSocket connection issues: check browser console
  - HTTP fallback: set PROTOCOL=http in .env.dev

- [ ] 7.3 Document mobile testing setup
  - Get mkcert CA location: mkcert -CAROOT
  - Export CA certificate
  - Install on iOS (Settings > General > VPN & Device Management)
  - Install on Android (Settings > Security > Install certificates)
  - Use network IP: https://192.168.x.x

- [ ] 7.4 Update production deployment documentation
  - Document domain name configuration in Caddyfile
  - Explain Let's Encrypt automatic certificate acquisition
  - Document certificate renewal (automatic)
  - Add monitoring recommendations

## 8. Testing

- [ ] 8.1 Test HTTPS development mode
  - Start services with start-dev.sh
  - Access https://localhost
  - Verify web app loads without certificate warnings
  - Test API calls to https://localhost/api
  - Verify Socket.IO connection works (check browser console)

- [ ] 8.2 Test HTTP fallback mode
  - Set PROTOCOL=http in .env.dev
  - Start services with start-dev.sh
  - Verify Caddy does not start
  - Access http://localhost:3000 and http://localhost:3001
  - Test API calls and WebSocket connections

- [ ] 8.3 Test CORS with both protocols
  - Make API call from https://localhost:3000
  - Verify CORS headers allow origin
  - Make API call from http://localhost:3000 (fallback mode)
  - Verify CORS headers allow HTTP origin
  - Check that invalid origins are rejected

- [ ] 8.4 Test Better Auth secure cookies
  - Start with HTTPS mode
  - Authenticate user
  - Verify session cookie has Secure flag (browser DevTools)
  - Switch to HTTP fallback mode
  - Verify session cookie does NOT have Secure flag

- [ ] 8.5 Test mobile device access
  - Export mkcert CA and install on mobile device
  - Get local network IP (ipconfig/ifconfig)
  - Update CLIENT_URL to https://192.168.x.x:3000
  - Access from mobile browser
  - Verify no certificate warnings

- [ ] 8.6 Test port conflict handling
  - Start another service on port 443
  - Run start-dev.sh
  - Verify script detects conflict and exits with clear message

- [ ] 8.7 Test certificate generation
  - Delete docker/caddy/certs/*.pem files
  - Run start-dev.sh
  - Verify mkcert generates new certificates
  - Verify certificates are trusted by browser

## 9. Production Readiness

- [ ] 9.1 Configure Let's Encrypt email in Caddyfile
  - Update Caddyfile with email directive
  - Set appropriate ACME CA (production vs staging)

- [ ] 9.2 Test production Docker Compose
  - Build production images: docker compose build
  - Start production stack: docker compose up
  - Verify Caddy starts and proxies correctly
  - Test internal HTTP communication between containers

- [ ] 9.3 Security audit
  - Run SSL Labs test (once deployed)
  - Verify TLS 1.2+ only
  - Check for strong cipher suites
  - Verify HSTS header (optional, can be added to Caddy)

- [ ] 9.4 Performance baseline
  - Measure API response times with HTTPS
  - Compare to previous HTTP baseline (should be similar)
  - Verify WebSocket connection latency
  - Check resource usage (Caddy should be minimal)

## 10. Optional Enhancements

- [ ] 10.1 Add HSTS header to Caddy configuration
  - Prevents downgrade attacks
  - Only enable after HTTPS is stable

- [ ] 10.2 Add Content-Security-Policy header
  - Restrict resource loading to HTTPS only
  - Test thoroughly before enabling

- [ ] 10.3 Implement service worker for PWA
  - Now possible with HTTPS
  - Offline support
  - Background sync

- [ ] 10.4 Add push notification support
  - Requires HTTPS and service worker
  - Integrate with Firebase Cloud Messaging or similar
  - Update web-notifications spec

## Validation Checklist

Before marking this change as complete:
- [ ] All tasks above marked as complete
- [ ] No regression in HTTP fallback mode
- [ ] Certificate warnings resolved on all browsers (Chrome, Firefox, Safari)
- [ ] WebSocket connections stable over HTTPS
- [ ] Mobile testing documented and working
- [ ] Production deployment tested on staging
- [ ] Documentation updated and reviewed
- [ ] openspec validate --strict passes
