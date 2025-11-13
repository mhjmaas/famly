# HTTPS Setup Guide for Production Deployment

This guide covers advanced HTTPS configuration for Famly, specifically for **Mode 3: Production with Custom Domain**.

> **Note:** For basic local deployment (Modes 1 & 2), no configuration is needed! Just run `./dev.sh` or `./start.sh` and HTTPS works automatically with mkcert.

## 📁 Caddyfile Structure

Famly uses separate Caddyfiles for different deployment modes:

| File | Used By | Purpose |
|------|---------|---------|
| `Caddyfile.localhost` | `./dev.sh` & `./start.sh` (default) | Local HTTPS with mkcert certificates |
| `Caddyfile.production` | `./start.sh` (when exists) | Custom domain with Let's Encrypt |
| `Caddyfile.http01.example` | Template | HTTP-01 challenge reference |
| `Caddyfile.production.example` | Template | DNS-01 challenge reference |

**How it works:**
- `./start.sh` checks if `Caddyfile.production` exists
- If **yes**: Uses Let's Encrypt with your custom domain
- If **no**: Uses localhost mode with mkcert (zero config)

This allows running development and production on the same machine without conflicts.

## Prerequisites

- A registered domain (e.g., `famly.eu`, `example.com`)
- DNS access to create A records
- For HTTP-01: Ports 80 and 443 accessible from the internet
- For DNS-01: API access to your DNS provider

## Two Approaches

### Approach 1: HTTP-01 Challenge (Simpler - Domain Points to Your Server)

**Best for:** Domain already forwarded to your home IP, ports 80/443 accessible

**Benefits:**

- ✅ Simpler setup (no API tokens needed)
- ✅ Works with any DNS registrar
- ✅ Publicly-trusted certificate
- ✅ Automatic renewal

**Requirements:**

- Domain points to your public IP
- Router forwards ports 80 and 443 to your server
- Caddy can answer HTTP challenges

**How it works:**

1. Caddy requests certificate for `my.famly.eu`
2. Let's Encrypt challenges: "Show me a file at http://my.famly.eu/.well-known/..."
3. Caddy serves the challenge file
4. Let's Encrypt verifies via HTTP
5. Certificate issued and installed automatically

### Approach 2: DNS-01 Challenge (More Secure - No Port Exposure)

**Best for:** Internal networks, VPN-only access, enhanced security

**Benefits:**

- ✅ No port forwarding required (ports 80/443 stay closed)
- ✅ Works for internal domains (e.g., `my.famly.local`)
- ✅ Higher security (server not exposed to internet)
- ✅ Supports wildcard certificates

**Requirements:**

- DNS provider with API support (Cloudflare, Route53, etc.)
- API token/credentials

**How it works:**

1. Caddy requests certificate for `my.famly.local`
2. Let's Encrypt challenges: "Prove you own `my.famly.local`"
3. Caddy creates DNS TXT record via your DNS provider API
4. Let's Encrypt verifies TXT record in public DNS
5. Certificate issued and installed automatically

## Step-by-Step Setup

Choose the approach that fits your setup:

---

## Setup Option 1: HTTP-01 Challenge (Internet-Accessible Domain)

Use this if your domain points to your home IP and you can forward ports 80 and 443.

### 1. Configure DNS at Your Registrar

Lets say you own famly.eu.
At your DNS provider (e.g., godaddy, namecheap, cloudflare):

1. **Add DNS A record** for your application:

   - Type: `A`
   - Name: `my` (creates `my.famly.eu`)
   - IPv4 address: Your **public IP address** (your home's external IP)
   - TTL: 300 (5 minutes) or Auto

2. **Verify DNS propagation**:
   ```bash
   # Wait 1-5 minutes, then test
   dig my.famly.eu
   # Should return your public IP
   ```

### 2. Configure Router Port Forwarding

Forward ports from your router to your server:

```
External Port 80  → Internal IP 192.168.x.x Port 80  (HTTP challenge)
External Port 443 → Internal IP 192.168.x.x Port 443 (HTTPS traffic)
```

**Finding your server's internal IP:**

```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'
```

### 3. Update Caddyfile for HTTP-01

Edit `docker/caddy/Caddyfile.production` with your domain and email:

```caddyfile
{
    # Your email for Let's Encrypt notifications
    email admin@famly.eu
}

# Your public domain using HTTP-01 challenge (automatic)
my.famly.eu {
    # Caddy automatically handles HTTP-01 challenge
    # No additional configuration needed!

    # Reverse proxy to web app
    reverse_proxy web:3000 {
        header_up Host {host}
        header_up X-Real-IP {remote}
        header_up X-Forwarded-For {remote}
        header_up X-Forwarded-Proto {scheme}
    }

    # API routes
    handle_path /api/* {
        reverse_proxy api:3001 {
            header_up Host {host}
            header_up X-Real-IP {remote}
            header_up X-Forwarded-For {remote}
            header_up X-Forwarded-Proto {scheme}
        }
    }
}
```

### 4. Update .env for HTTP-01

Update your `.env` file:

```bash
PROTOCOL=https

# Your public domain
CLIENT_URL=https://my.famly.eu
BETTER_AUTH_URL=https://my.famly.eu/api
NEXT_PUBLIC_API_URL=https://my.famly.eu/api

# Other settings...
BETTER_AUTH_SECRET=your_secret_here
MINIO_ROOT_USER=famly-admin
MINIO_ROOT_PASSWORD=your_secure_password
```

### 5. Start the Application

```bash
./start.sh
```

**What happens:**

1. Caddy starts on ports 80 and 443
2. Requests certificate from Let's Encrypt for `my.famly.eu`
3. Let's Encrypt makes HTTP request to verify ownership
4. Caddy responds with challenge file
5. Certificate is issued and installed
6. Your app is now accessible at `https://my.famly.eu`

**First run may take 10-30 seconds** while Let's Encrypt verifies.

### 6. Access Your Application

From anywhere with internet:

- Web: `https://my.famly.eu`
- API: `https://my.famly.eu/api`

**No certificate warnings!** The certificate is publicly trusted by all browsers.

---

## Setup Option 2: DNS-01 Challenge (Internal Networks / Enhanced Security)

Use this if you want to avoid exposing ports 80/443 to the internet, or for internal-only domains.

### 1. Configure DNS Provider (Example: Cloudflare)

**Option A: Cloudflare (Recommended - Free)**

1. **Transfer or add your domain to Cloudflare** (if not already there):

   - Go to https://dash.cloudflare.com
   - Click "Add a site"
   - Follow instructions to update nameservers at your registrar

2. **Create API Token**:

   - Go to https://dash.cloudflare.com/profile/api-tokens
   - Click "Create Token"
   - Use "Edit zone DNS" template
   - Permissions: Zone > DNS > Edit
   - Zone Resources: Include > Specific zone > `famly.eu`
   - Click "Continue to summary" → "Create Token"
   - **Copy the token** (you won't see it again!)

3. **Add DNS A record** for your internal host:
   - Go to DNS settings for `famly.eu`
   - Add A record:
     - Type: `A`
     - Name: `my` (creates `my.famly.eu`)
     - IPv4 address: Your Machines **local IP** (e.g., `192.168.1.100`)
     - Proxy status: **DNS only** (gray cloud, not proxied)
     - TTL: Auto
   - Click "Save"

**Option B: Other DNS Providers**

Caddy supports 80+ DNS providers. See: https://caddyserver.com/download

Popular options:

- **AWS Route53**: Use IAM credentials
- **Google Cloud DNS**: Use service account key
- **DigitalOcean**: Use API token
- **Gandi**: Use API key

### 2. Configure Environment Variables (DNS-01 Only)

Add your DNS provider API token to `.env`:

```bash
# For Cloudflare
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here

# Or for other providers:
# AWS_ACCESS_KEY_ID=your_aws_key
# AWS_SECRET_ACCESS_KEY=your_aws_secret
# GANDI_API_TOKEN=your_gandi_token
# DO_AUTH_TOKEN=your_digitalocean_token
```

### 3. Update Caddyfile for DNS-01

Edit `docker/caddy/Caddyfile.production` with your DNS provider configuration:

> **Note:** You can use `Caddyfile.production.example` as a reference for DNS-01 setup.

```caddyfile
{
    email your-email@famly.eu
    acme_dns cloudflare {env.CLOUDFLARE_API_TOKEN}
}

my.famly.eu {
    tls {
        dns cloudflare {env.CLOUDFLARE_API_TOKEN}
    }

    reverse_proxy web:3000 {
        header_up Host {host}
        header_up X-Real-IP {remote}
        header_up X-Forwarded-For {remote}
        header_up X-Forwarded-Proto {scheme}
    }

    handle_path /api/* {
        reverse_proxy api:3001 {
            header_up Host {host}
            header_up X-Real-IP {remote}
            header_up X-Forwarded-For {remote}
            header_up X-Forwarded-Proto {scheme}
        }
    }
}
```

### 4. Update .env for DNS-01

Update your `.env` file:

```bash
PROTOCOL=https

# Your internal domain
CLIENT_URL=https://my.famly.eu
BETTER_AUTH_URL=https://my.famly.eu/api
NEXT_PUBLIC_API_URL=https://my.famly.eu/api

# Cloudflare API token (or your DNS provider)
CLOUDFLARE_API_TOKEN=your_token_here

# Other settings...
BETTER_AUTH_SECRET=your_secret_here
MINIO_ROOT_USER=famly-admin
MINIO_ROOT_PASSWORD=your_secure_password
```

### 5. Update docker-compose.yml

Ensure Caddy has the DNS provider token:

```yaml
caddy:
  environment:
    CLOUDFLARE_API_TOKEN: ${CLOUDFLARE_API_TOKEN}
```

(This is already configured in the repository)

### 6. Start the Application

```bash
./start.sh
```

**What happens:**

1. Caddy starts and reads the Caddyfile
2. Requests certificate from Let's Encrypt for `my.famly.eu`
3. Uses Cloudflare API to create DNS TXT record
4. Let's Encrypt verifies the TXT record
5. Certificate is issued and installed
6. Your app is now accessible at `https://my.famly.eu`

**First run may take 30-60 seconds** while Let's Encrypt verifies DNS.

### 7. Access Your Application

From any device on your network:

- Web: `https://my.famly.eu`
- API: `https://my.famly.eu/api`

**No certificate warnings!** The certificate is publicly trusted by all browsers.

## For Others Forking This Repository

Anyone can use this setup with their own domain. Choose HTTP-01 (simpler) or DNS-01 (more secure).

### Fork Setup Instructions

**Prerequisites:**

1. **Own a domain**: Register a domain (e.g., `example.com`)
2. **Choose approach**:
   - **HTTP-01**: Domain points to your public IP, ports 80/443 forwarded
   - **DNS-01**: DNS provider with API support (for internal networks)

**For HTTP-01 (Simpler):**

1. **Configure DNS** at your registrar:

   ```
   A record: famly.example.com → YOUR_PUBLIC_IP
   ```

2. **Forward ports** 80 and 443 on your router to your server

3. **Update configuration files**:

   **`.env`:**

   ```bash
   CLIENT_URL=https://famly.example.com
   BETTER_AUTH_URL=https://famly.example.com/api
   NEXT_PUBLIC_API_URL=https://famly.example.com/api
   ```

   **`docker/caddy/Caddyfile.production`:**

   ```caddyfile
   {
       email admin@example.com
   }

   famly.example.com {
       reverse_proxy web:3000 {
           header_up Host {host}
           header_up X-Real-IP {remote}
           header_up X-Forwarded-For {remote}
           header_up X-Forwarded-Proto {scheme}
       }

       handle_path /api/* {
           reverse_proxy api:3001 {
               header_up Host {host}
               header_up X-Real-IP {remote}
               header_up X-Forwarded-For {remote}
               header_up X-Forwarded-Proto {scheme}
           }
       }
   }
   ```

4. **Run**: `./start.sh`

**For DNS-01 (More Secure):**

1. **Choose DNS provider**: Use one supported by Caddy (Cloudflare is easiest)

2. **Configure DNS**:

   ```
   A record: yourhost.example.com → 192.168.x.x (your server's local IP)
   ```

3. **Get API credentials** from your DNS provider

4. **Update configuration files**:

   **`.env`:**

   ```bash
   CLIENT_URL=https://yourhost.example.com
   BETTER_AUTH_URL=https://yourhost.example.com/api
   NEXT_PUBLIC_API_URL=https://yourhost.example.com/api
   CLOUDFLARE_API_TOKEN=your_token_here
   ```

   **`docker/caddy/Caddyfile.production`:**

   ```caddyfile
   {
       email admin@example.com
       acme_dns cloudflare {env.CLOUDFLARE_API_TOKEN}
   }

   yourhost.example.com {
       tls {
           dns cloudflare {env.CLOUDFLARE_API_TOKEN}
       }
       # ... rest of config
   }
   ```

5. **Run**: `./start.sh`

### Template for Other DNS Providers

**Cloudflare:**

```caddyfile
acme_dns cloudflare {env.CLOUDFLARE_API_TOKEN}
```

**AWS Route53:**

```caddyfile
acme_dns route53 {
    access_key_id {env.AWS_ACCESS_KEY_ID}
    secret_access_key {env.AWS_SECRET_ACCESS_KEY}
}
```

**DigitalOcean:**

```caddyfile
acme_dns digitalocean {env.DO_AUTH_TOKEN}
```

**Gandi:**

```caddyfile
acme_dns gandi {env.GANDI_API_TOKEN}
```

See full list: https://github.com/caddy-dns

## Troubleshooting

### Certificate request fails

**Check DNS propagation:**

```bash
dig my.famly.eu
# Should return your local IP
```

**Check API token:**

```bash
# Test Cloudflare API
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json"
```

**Check Caddy logs:**

```bash
docker logs famly-caddy
```

### DNS record not resolving

- Ensure DNS record is not "proxied" (gray cloud in Cloudflare, not orange)
- Wait 1-2 minutes for DNS propagation
- Use TTL of 300 seconds (5 minutes) or less

### Rate limits

Let's Encrypt has rate limits:

- 50 certificates per domain per week
- Use staging CA for testing:
  ```caddyfile
  {
      acme_ca https://acme-staging-v02.api.letsencrypt.org/directory
  }
  ```

### Certificate renewal

Caddy automatically renews certificates 30 days before expiration. No action needed!

**Check renewal status:**

```bash
docker exec famly-caddy caddy list-certificates
```

## Security Notes

**Is this secure?**

✅ **Yes!** Even though your DNS record is public:

- Your server is **not exposed** to the internet (no port forwarding)
- Only devices on your network can access the IP
- Certificate is publicly trusted (no MITM attacks)
- Traffic is encrypted end-to-end

**Public DNS record doesn't expose your server:**

- DNS record: `my.famly.eu → 192.168.1.100`
- IP `192.168.1.100` is **private** (RFC 1918)
- Not routable from internet
- Only works on your local network (or VPN)

## VPN Access

Want to access from outside your network?

1. **Set up VPN** (WireGuard, Tailscale, OpenVPN, etc.)
2. **Connect to VPN** from remote device
3. **Access normally**: `https://my.famly.eu`

No additional configuration needed - the certificate works everywhere!

## Comparison: HTTP-01 vs DNS-01

| Feature           | HTTP-01 (Simpler)             | DNS-01 (More Secure)   |
| ----------------- | ----------------------------- | ---------------------- |
| Port exposure     | Ports 80 + 443 required       | None required          |
| DNS Requirements  | Any registrar                 | API-enabled provider   |
| Wildcard certs    | ❌ Not supported              | ✅ Supported           |
| Internal networks | ❌ Doesn't work               | ✅ Works               |
| Setup complexity  | Simple (just port forwarding) | Moderate (API token)   |
| Security          | Standard (ports open)         | Higher (no exposure)   |
| Automation        | ✅ Full                       | ✅ Full                |
| Best for          | Public-facing servers         | Internal networks, VPN |

## References

- [Caddy DNS Challenge](https://caddyserver.com/docs/automatic-https#dns-challenge)
- [Let's Encrypt DNS-01](https://letsencrypt.org/docs/challenge-types/#dns-01-challenge)
- [Supported DNS Providers](https://github.com/caddy-dns)
- [Cloudflare API Tokens](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
