# Security Guide

This document outlines security considerations and best practices for deploying Famly.

## Production Deployment Security

### 🔒 Critical: Use Production Mode

**NEVER deploy with `DEPLOYMENT_MODE=development` in production!** It exposes internal services directly to the internet.

#### ✅ Secure Production Deployment

```bash
# Set DEPLOYMENT_MODE=production in your .env file
echo "DEPLOYMENT_MODE=production" >> .env

# Then use the start script (recommended)
./start.sh

# Or manually:
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile https up -d
```

#### ❌ Insecure Development Setup (DO NOT USE IN PRODUCTION)

```bash
# This exposes ports 3000 and 3001 directly - DEVELOPMENT ONLY!
# DEPLOYMENT_MODE=development (default)
./start.sh
```

### Port Exposure Comparison

| Service | Development | Production (Secure) |
|---------|-------------|---------------------|
| Caddy (HTTPS) | `:443` → 443 | `:443` → 443 ✅ |
| Caddy (HTTP) | `:80` → 80 | `:80` → 80 ✅ (redirects to HTTPS) |
| Web (Next.js) | `:3000` → 3000 ⚠️ | **Not exposed** ✅ |
| API (Express) | `:3001` → 3001 ⚠️ | **Not exposed** ✅ |
| MinIO Console | `:9001` → 9001 ⚠️ | **Not exposed** ✅ |

### Why This Matters

If you expose ports 3000/3001 in production:

1. **🚨 HTTPS Bypass**: Attackers can access `http://YOUR_IP:3001` directly, bypassing HTTPS
2. **🚨 Security Headers Bypass**: Caddy's security headers (HSTS, CSP, etc.) are not applied
3. **🚨 CORS Bypass**: API CORS policies can be bypassed
4. **🚨 Cookie Security**: Secure cookies may not work correctly
5. **🚨 Authentication Bypass**: Direct access may bypass authentication middleware

## HTTPS & Certificate Configuration

### Production with Public Domain

1. **Configure your domain's DNS** to point to your server's public IP
2. **Forward ports 80 and 443** on your router to your server
3. **Copy and configure Caddyfile**:
   ```bash
   cp docker/caddy/Caddyfile.http01.example docker/caddy/Caddyfile.production
   # Edit Caddyfile.production and replace my.famly.eu with your domain
   ```
4. **Update .env**:
   ```env
   PROTOCOL=https
   DEPLOYMENT_MODE=production
   CADDYFILE=Caddyfile.production
   CLIENT_URL=https://your-domain.com
   BETTER_AUTH_URL=https://your-domain.com/api
   NEXT_PUBLIC_API_URL=https://your-domain.com/api
   ```
5. **Deploy securely**:
   ```bash
   ./start.sh
   # Or manually:
   # docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile https up -d
   ```

Caddy will automatically:
- Request a Let's Encrypt certificate (via HTTP-01 challenge)
- Redirect all HTTP traffic to HTTPS
- Renew certificates before expiry

### Local Development (HTTPS)

1. **Install mkcert**:
   ```bash
   # macOS
   brew install mkcert

   # Linux
   apt install mkcert # or your package manager
   ```

2. **Generate certificates**:
   ```bash
   cd docker/caddy/certs
   mkcert -install
   mkcert localhost
   ```

3. **Update .env**:
   ```env
   PROTOCOL=https
   CLIENT_URL=https://localhost:8443
   BETTER_AUTH_URL=https://localhost:8443/api
   NEXT_PUBLIC_API_URL=https://localhost:8443/api
   ```

4. **Start with HTTPS**:
   ```bash
   ./start-dev.sh
   # Access at https://localhost:8443
   ```

## Firewall Configuration

### Recommended Firewall Rules (Production)

Configure your firewall to **ONLY** allow:

```bash
# Allow HTTPS
ufw allow 443/tcp comment "Caddy HTTPS"

# Allow HTTP (only for Let's Encrypt HTTP-01 challenge, automatically redirects to HTTPS)
ufw allow 80/tcp comment "Caddy HTTP to HTTPS redirect"

# DENY direct access to Docker services
ufw deny 3000/tcp comment "Block direct web access"
ufw deny 3001/tcp comment "Block direct API access"
ufw deny 9000/tcp comment "Block direct MinIO access"
ufw deny 9001/tcp comment "Block MinIO console"
ufw deny 27017/tcp comment "Block direct MongoDB access"

# Enable firewall
ufw enable
```

### Docker and Firewall Considerations

⚠️ **Important**: Docker bypasses UFW by default!

Even if you block ports with UFW, Docker creates its own iptables rules. To secure this:

**Option 1: Use docker-compose.prod.yml** (Recommended)
- Removes port mappings entirely
- Services only accessible within Docker network

**Option 2: Bind to localhost only** (Development)
```yaml
ports:
  - "127.0.0.1:3001:3001"  # Only accessible from localhost
```

**Option 3: Configure Docker to respect UFW**
```bash
# Add to /etc/docker/daemon.json
{
  "iptables": false
}

# Restart Docker
systemctl restart docker

# Manually configure iptables
iptables -I DOCKER-USER -p tcp --dport 3000 -j DROP
iptables -I DOCKER-USER -p tcp --dport 3001 -j DROP
```

## Security Headers (Caddy)

The production Caddyfile includes these security headers:

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Force HTTPS for 1 year |
| `X-Frame-Options` | `SAMEORIGIN` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` | Enable browser XSS protection |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer information |

## Secrets Management

### Required Secrets

Generate secure random strings for:

```bash
# Generate BETTER_AUTH_SECRET (min 32 characters)
openssl rand -base64 32

# Generate MINIO_ROOT_PASSWORD (min 32 characters)
openssl rand -base64 32
```

### Never Commit Secrets

Ensure `.env` is in `.gitignore`:
```
.env
.env.local
.env.production
```

Use `.env.example` as a template (without actual secrets).

## Network Security

### Docker Network Isolation

All services run on an internal Docker network (`famly-network`):
- Services can communicate internally (e.g., `web` → `api:3001`)
- External access only through Caddy (ports 80, 443)
- MongoDB and MinIO are NOT accessible from outside

### CORS Configuration

API CORS is configured in `apps/api/src/app.ts`:
```typescript
// Only allow requests from configured CLIENT_URL
origin: process.env.CLIENT_URL
credentials: true  // Allow cookies
```

**Security Note**: CORS only works if clients go through Caddy. Direct access to `:3001` bypasses CORS!

## Cookie Security

### Secure Cookie Configuration

Better-auth cookies use these security attributes:

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `Secure` | `true` (HTTPS) | Only send over HTTPS |
| `HttpOnly` | `true` | Prevent JavaScript access |
| `SameSite` | `Lax` | CSRF protection |
| `__Secure-` prefix | Auto (HTTPS) | Browser security feature |

### HTTPS Requirement

Secure cookies (`__Secure-` prefix) **ONLY work with HTTPS**. If you see authentication issues:
1. Verify you're accessing via `https://` (not `http://`)
2. Check that `useSecureCookies` matches your setup
3. Ensure Caddy is properly forwarding `X-Forwarded-Proto: https`

## Monitoring & Logging

### Health Checks

All services have health checks:
```bash
# Check service health
docker compose ps

# View logs
docker compose logs -f api
docker compose logs -f web
docker compose logs -f caddy
```

### Caddy Access Logs

Monitor access to detect suspicious activity:
```bash
docker compose logs -f caddy | grep -E "(404|500|unauthorized)"
```

## Security Checklist

Before deploying to production:

- [ ] Set `DEPLOYMENT_MODE=production` in `.env`
- [ ] Configure firewall to block ports 3000, 3001, 9000, 9001
- [ ] Set strong `BETTER_AUTH_SECRET` (32+ characters)
- [ ] Set strong `MINIO_ROOT_PASSWORD` (32+ characters)
- [ ] Configure real domain in `Caddyfile.production`
- [ ] Set `CADDYFILE=Caddyfile.production` in `.env`
- [ ] Set `email` in Caddyfile for Let's Encrypt notifications
- [ ] Verify HTTPS redirect works (`http://` → `https://`)
- [ ] Test that `:3000` and `:3001` are NOT accessible from internet
  ```bash
  # From external network (should timeout/refuse)
  curl http://YOUR_PUBLIC_IP:3001
  curl http://YOUR_PUBLIC_IP:3000

  # Through Caddy (should work)
  curl https://your-domain.com
  ```
- [ ] Enable automatic security updates on host OS
- [ ] Set up backup for MongoDB data volume
- [ ] Monitor logs for suspicious activity
- [ ] Run `./start.sh` and verify it shows "PRODUCTION (secure - no direct port access)"

## Reporting Security Issues

If you discover a security vulnerability, please email: [security@famly.app](mailto:security@famly.app)

**Do NOT** open a public GitHub issue for security vulnerabilities.
