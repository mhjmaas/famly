#!/usr/bin/env bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo ""
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}   Famly - Home Deployment${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to generate a secure random string
generate_secret() {
    if command_exists openssl; then
        openssl rand -base64 32 | tr -d '\n'
    else
        # Fallback to /dev/urandom if openssl is not available
        LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 43
    fi
}

# Function to get local IP address
get_local_ip() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost"
    else
        echo "localhost"
    fi
}

# Helper to update key/value pairs inside the generated .env file
update_env_value() {
    local search="$1"
    local replace="$2"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|$search|$replace|g" "$ENV_FILE"
    else
        sed -i "s|$search|$replace|g" "$ENV_FILE"
    fi
}

ensure_secret_value() {
    local key="$1"
    local placeholder="$2"

    if [ ! -f "$ENV_FILE" ]; then
        return
    fi

    local current_line
    current_line=$(grep -E "^${key}=" "$ENV_FILE" || true)

    local current_value
    current_value="${current_line#*=}"

    if [ -z "$current_line" ]; then
        local new_secret
        new_secret=$(generate_secret)
        echo "${key}=${new_secret}" >> "$ENV_FILE"
        print_success "Generated secure value for ${key}"
        return
    fi

    if [ -z "$current_value" ] || [ "$current_value" == "$placeholder" ]; then
        local new_secret
        new_secret=$(generate_secret)
        update_env_value "^${key}=.*" "${key}=${new_secret}"
        print_success "Generated secure value for ${key}"
    fi
}

setup_local_https() {
    echo ""
    print_info "Local HTTPS Setup (mkcert + LAN access)"
    echo ""
    echo "This mode keeps Famly on your home network while still using HTTPS."
    echo ""
    echo "⚠️  Important: Use a DNS name (e.g., famly.local), not a raw IP address."
    echo "   Browsers have strict security for IP addresses that can cause issues."
    echo "   You can add 'famly.local' to /etc/hosts pointing to your IP."
    echo ""
    echo "All devices must trust your mkcert CA to avoid HTTPS warnings."
    echo ""

    if ! command_exists mkcert; then
        print_error "mkcert is required for local HTTPS."
        echo ""
        echo "Install mkcert first and rerun this script."
        echo "  macOS:  brew install mkcert && mkcert -install"
        echo "  Linux:  install mkcert + run mkcert -install"
        echo ""
        rm "$ENV_FILE"
        exit 1
    fi

    if ! mkcert -CAROOT >/dev/null 2>&1; then
        print_warning "mkcert CA is not installed yet."
        echo "This installation is needed so browsers trust your certificates."
        echo ""
        read -p "Install the mkcert CA now? (y/N): " INSTALL_CA
        if [[ $INSTALL_CA =~ ^[Yy]$ ]]; then
            mkcert -install
            print_success "mkcert CA installed"
        else
            print_warning "Continuing without installing CA. Browsers may show warnings."
        fi
        echo ""
    fi

    local default_host
    default_host=$(get_local_ip)
    read -p "Enter the IP or local DNS name to access Famly [${default_host}]: " LOCAL_HOST
    LOCAL_HOST=$(echo "$LOCAL_HOST" | xargs)
    if [ -z "$LOCAL_HOST" ]; then
        LOCAL_HOST="$default_host"
    fi

    if [[ "$LOCAL_HOST" == *:* ]]; then
        print_error "IPv6 addresses are not supported by this automation. Use IPv4 or a DNS name."
        rm "$ENV_FILE"
        exit 1
    fi

    read -p "Can every device on your network resolve ${LOCAL_HOST}? (y/n): " HAS_RESOLUTION
    if [[ ! $HAS_RESOLUTION =~ ^[Yy]$ ]]; then
        print_warning "Please reserve the IP or configure local DNS/hosts entries first."
        rm "$ENV_FILE"
        exit 1
    fi

    read -p "Enter a contact email for push notifications (VAPID): " LOCAL_EMAIL
    if [ -z "$LOCAL_EMAIL" ]; then
        print_error "Email cannot be empty!"
        rm "$ENV_FILE"
        exit 1
    fi
    echo ""

    print_info "Generating secure secrets and VAPID keys..."
    local MINIO_PASSWORD
    local BETTER_AUTH_SECRET
    MINIO_PASSWORD=$(generate_secret)
    BETTER_AUTH_SECRET=$(generate_secret)

    local VAPID_OUTPUT
    VAPID_OUTPUT=$(npx --yes web-push generate-vapid-keys 2>&1)
    local VAPID_PUBLIC
    local VAPID_PRIVATE
    VAPID_PUBLIC=$(echo "$VAPID_OUTPUT" | grep -A 1 "Public Key:" | tail -1 | xargs)
    VAPID_PRIVATE=$(echo "$VAPID_OUTPUT" | grep -A 1 "Private Key:" | tail -1 | xargs)

    if [ -z "$VAPID_PUBLIC" ] || [ -z "$VAPID_PRIVATE" ]; then
        print_error "Failed to generate VAPID keys!"
        rm "$ENV_FILE"
        exit 1
    fi

    local BASE_URL="https://${LOCAL_HOST}"
    update_env_value "PROTOCOL=.*" "PROTOCOL=https"
    update_env_value "CADDYFILE=.*" "CADDYFILE=Caddyfile.localhost.custom"
    update_env_value "CLIENT_URL=.*" "CLIENT_URL=${BASE_URL}"
    update_env_value "BETTER_AUTH_URL=.*" "BETTER_AUTH_URL=${BASE_URL}"
    update_env_value "NEXT_PUBLIC_API_URL=.*" "NEXT_PUBLIC_API_URL=${BASE_URL}/api"
    update_env_value "NEXT_PUBLIC_WS_URL=.*" "NEXT_PUBLIC_WS_URL=${BASE_URL}"
    update_env_value "MINIO_ROOT_PASSWORD=.*" "MINIO_ROOT_PASSWORD=${MINIO_PASSWORD}"
    update_env_value "BETTER_AUTH_SECRET=.*" "BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}"
    update_env_value "NEXT_PUBLIC_VAPID_PUBLIC_KEY=.*" "NEXT_PUBLIC_VAPID_PUBLIC_KEY=${VAPID_PUBLIC}"
    update_env_value "VAPID_PRIVATE_KEY=.*" "VAPID_PRIVATE_KEY=${VAPID_PRIVATE}"
    update_env_value "VAPID_EMAIL=.*" "VAPID_EMAIL=${LOCAL_EMAIL}"

    local CERT_DIR="docker/caddy/certs"
    local CERT_SAFE_NAME
    CERT_SAFE_NAME=$(echo "$LOCAL_HOST" | tr -c 'A-Za-z0-9._-' '_')
    local CERT_FILE="$CERT_DIR/${CERT_SAFE_NAME}.pem"
    local KEY_FILE="$CERT_DIR/${CERT_SAFE_NAME}-key.pem"
    mkdir -p "$CERT_DIR"

    if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
        print_info "Generating mkcert certificate for ${LOCAL_HOST}..."
        mkcert -cert-file "$CERT_FILE" -key-file "$KEY_FILE" "$LOCAL_HOST" localhost 127.0.0.1 ::1
        print_success "Certificates stored in $CERT_DIR/"
    else
        print_success "Reusing existing certificate for ${LOCAL_HOST}"
    fi

    local CADDY_TEMPLATE="docker/caddy/Caddyfile.localhost"
    local CADDY_CUSTOM_FILE="docker/caddy/Caddyfile.localhost.custom"
    cp "$CADDY_TEMPLATE" "$CADDY_CUSTOM_FILE"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^localhost {|localhost, ${LOCAL_HOST} {|" "$CADDY_CUSTOM_FILE"
        sed -i '' "s|tls /certs/localhost.pem /certs/localhost-key.pem|tls /certs/${CERT_SAFE_NAME}.pem /certs/${CERT_SAFE_NAME}-key.pem|" "$CADDY_CUSTOM_FILE"
    else
        sed -i "s|^localhost {|localhost, ${LOCAL_HOST} {|" "$CADDY_CUSTOM_FILE"
        sed -i "s|tls /certs/localhost.pem /certs/localhost-key.pem|tls /certs/${CERT_SAFE_NAME}.pem /certs/${CERT_SAFE_NAME}-key.pem|" "$CADDY_CUSTOM_FILE"
    fi

    LOCAL_HOST="$LOCAL_HOST" CADDY_CUSTOM_FILE="$CADDY_CUSTOM_FILE" python3 <<'PY'
import os
from pathlib import Path

site_header = f"localhost, {os.environ['LOCAL_HOST']} {{"
file_path = Path(os.environ['CADDY_CUSTOM_FILE'])
text = file_path.read_text()
if site_header in text and "bind 0.0.0.0" not in text:
    text = text.replace(site_header, site_header + "\n\tbind 0.0.0.0", 1)
    file_path.write_text(text)
PY

    print_success "Created $CADDY_CUSTOM_FILE"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  • Install the mkcert CA on every device that will access Famly"
    echo "    mkcert -CAROOT shows where the CA file lives"
    echo "  • Optional: Add ${LOCAL_HOST} to your router's DNS/hosts for friendly access"
    echo ""

    SELECTED_LOCAL_HOST="$LOCAL_HOST"
}

setup_http01_challenge() {
    echo ""
    print_info "HTTP-01 Challenge Setup"
    echo ""
    echo "You will need:"
    echo "  1. A registered domain (e.g., famly.example.com)"
    echo "  2. DNS A record pointing to your public IP"
    echo "  3. Router ports 80 and 443 forwarded to this server"
    echo ""
    read -p "Do you have these set up? (y/n): " HAS_SETUP
    echo ""

    if [[ ! $HAS_SETUP =~ ^[Yy]$ ]]; then
        print_warning "Please configure DNS and port forwarding first."
        echo ""
        echo "See: docs/HTTPS_SETUP.md - Setup Option 1: HTTP-01 Challenge"
        echo ""
        rm "$ENV_FILE"
        exit 1
    fi

    # Ask for domain
    read -p "Enter your domain (e.g., famly.example.com): " DOMAIN
    if [ -z "$DOMAIN" ]; then
        print_error "Domain cannot be empty!"
        rm "$ENV_FILE"
        exit 1
    fi
    echo ""

    # Ask for email for Let's Encrypt
    read -p "Enter your email for Let's Encrypt notifications: " LE_EMAIL
    if [ -z "$LE_EMAIL" ]; then
        print_error "Email cannot be empty!"
        rm "$ENV_FILE"
        exit 1
    fi
    echo ""

    # Generate secrets
    print_info "Generating secure secrets and VAPID keys..."
    MINIO_PASSWORD=$(generate_secret)
    BETTER_AUTH_SECRET=$(generate_secret)

    # Generate VAPID keys
    VAPID_OUTPUT=$(npx --yes web-push generate-vapid-keys 2>&1)
    VAPID_PUBLIC=$(echo "$VAPID_OUTPUT" | grep -A 1 "Public Key:" | tail -1 | xargs)
    VAPID_PRIVATE=$(echo "$VAPID_OUTPUT" | grep -A 1 "Private Key:" | tail -1 | xargs)

    if [ -z "$VAPID_PUBLIC" ] || [ -z "$VAPID_PRIVATE" ]; then
        print_error "Failed to generate VAPID keys!"
        rm "$ENV_FILE"
        exit 1
    fi

    # Update .env file with production settings
    local BASE_URL="https://${DOMAIN}"
    update_env_value "PROTOCOL=.*" "PROTOCOL=https"
    update_env_value "CADDYFILE=.*" "CADDYFILE=Caddyfile.production"
    update_env_value "MINIO_ROOT_PASSWORD=.*" "MINIO_ROOT_PASSWORD=${MINIO_PASSWORD}"
    update_env_value "BETTER_AUTH_SECRET=.*" "BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}"
    update_env_value "CLIENT_URL=.*" "CLIENT_URL=${BASE_URL}"
    update_env_value "BETTER_AUTH_URL=.*" "BETTER_AUTH_URL=${BASE_URL}"
    update_env_value "NEXT_PUBLIC_API_URL=.*" "NEXT_PUBLIC_API_URL=${BASE_URL}/api"
    update_env_value "NEXT_PUBLIC_WS_URL=.*" "NEXT_PUBLIC_WS_URL=${BASE_URL}"
    update_env_value "NEXT_PUBLIC_VAPID_PUBLIC_KEY=.*" "NEXT_PUBLIC_VAPID_PUBLIC_KEY=${VAPID_PUBLIC}"
    update_env_value "VAPID_PRIVATE_KEY=.*" "VAPID_PRIVATE_KEY=${VAPID_PRIVATE}"
    update_env_value "VAPID_EMAIL=.*" "VAPID_EMAIL=${LE_EMAIL}"

    print_success "Generated secrets and VAPID keys"
    print_info "Configuration saved to .env file"
    echo ""

    # Create Caddyfile.production for HTTP-01
    print_info "Creating Caddyfile.production for HTTP-01 challenge..."
    CADDY_TEMPLATE="docker/caddy/Caddyfile.production.http01"
    CADDY_FILE="docker/caddy/Caddyfile.production"

    if [ ! -f "$CADDY_TEMPLATE" ]; then
        print_error "Caddyfile template not found: $CADDY_TEMPLATE"
        rm "$ENV_FILE"
        exit 1
    fi

    # Copy template and replace placeholders
    cp "$CADDY_TEMPLATE" "$CADDY_FILE"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS (BSD sed)
        sed -i '' "s|EMAIL_PLACEHOLDER|${LE_EMAIL}|g" "$CADDY_FILE"
        sed -i '' "s|DOMAIN_PLACEHOLDER|${DOMAIN}|g" "$CADDY_FILE"
    else
        # Linux (GNU sed)
        sed -i "s|EMAIL_PLACEHOLDER|${LE_EMAIL}|g" "$CADDY_FILE"
        sed -i "s|DOMAIN_PLACEHOLDER|${DOMAIN}|g" "$CADDY_FILE"
    fi

    print_success "Created $CADDY_FILE"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Verify DNS A record points to your public IP:"
    echo "     ${GREEN}dig ${DOMAIN}${NC}"
    echo ""
    echo "  2. Verify ports 80 and 443 are forwarded in your router"
    echo ""
    echo "  3. When ready, run:"
    echo "     ${GREEN}./start.sh${NC}"
    echo ""
}

# Print header
print_header

# Parse command line flags
BUILD_FLAG=""
for arg in "$@"; do
    case $arg in
        --reset)
            if [ -f ".env" ]; then
                print_info "Removing existing .env file..."
                rm ".env"
                print_success ".env deleted - will regenerate with fresh secrets"
            else
                print_info "No .env file found to reset"
            fi

            if [ -f "docker/caddy/Caddyfile.production" ]; then
                print_info "Removing existing Caddyfile.production..."
                rm "docker/caddy/Caddyfile.production"
                print_success "Caddyfile.production deleted - will regenerate with new domain"
            else
                print_info "No Caddyfile.production found to reset"
            fi

            if [ -f "docker/caddy/Caddyfile.localhost.custom" ]; then
                print_info "Removing existing Caddyfile.localhost.custom..."
                rm "docker/caddy/Caddyfile.localhost.custom"
                print_success "Caddyfile.localhost.custom deleted - local HTTPS will be reconfigured"
            fi
            echo ""
            ;;
        --build)
            BUILD_FLAG="--no-cache"
            print_info "Clean rebuild enabled (--no-cache)"
            echo ""
            ;;
    esac
done

# Step 1: Check if Docker is installed
print_info "Checking Docker installation..."
if ! command_exists docker; then
    print_error "Docker is not installed!"
    echo ""
    echo "Please install Docker first:"
    echo "  - macOS: https://docs.docker.com/desktop/install/mac-install/"
    echo "  - Linux: https://docs.docker.com/engine/install/"
    echo "  - Windows: https://docs.docker.com/desktop/install/windows-install/"
    echo ""
    exit 1
fi
print_success "Docker is installed"

# Step 2: Check if Docker Compose is available
print_info "Checking Docker Compose installation..."
if ! docker compose version >/dev/null 2>&1; then
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed!"
        echo ""
        echo "Please install Docker Compose:"
        echo "  https://docs.docker.com/compose/install/"
        echo ""
        exit 1
    else
        # Use docker-compose (older style)
        COMPOSE_CMD="docker-compose"
        print_warning "Using legacy docker-compose command"
    fi
else
    # Use docker compose (newer style)
    COMPOSE_CMD="docker compose"
    print_success "Docker Compose is installed"
fi

# Step 3: Check if Docker daemon is running
print_info "Checking if Docker daemon is running..."
if ! docker info >/dev/null 2>&1; then
    print_error "Docker daemon is not running!"
    echo ""
    echo "Please start Docker and try again."
    echo ""
    exit 1
fi
print_success "Docker daemon is running"

# Step 3.5: Check for port conflicts (only Caddy ports in production mode)
print_info "Checking for port conflicts..."
PORTS_TO_CHECK=(80 443)
CONFLICTS=()

for PORT in "${PORTS_TO_CHECK[@]}"; do
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        CONFLICTING_CONTAINER=$(docker ps --format '{{.Names}}' --filter "publish=$PORT" 2>/dev/null | head -n 1)
        if [ ! -z "$CONFLICTING_CONTAINER" ]; then
            CONFLICTS+=("Port $PORT is in use by container: $CONFLICTING_CONTAINER")
        else
            CONFLICTING_PROCESS=$(lsof -Pi :$PORT -sTCP:LISTEN -t 2>/dev/null | head -n 1)
            if [ ! -z "$CONFLICTING_PROCESS" ]; then
                PROCESS_NAME=$(ps -p $CONFLICTING_PROCESS -o comm= 2>/dev/null || echo "unknown")
                CONFLICTS+=("Port $PORT is in use by process: $PROCESS_NAME (PID: $CONFLICTING_PROCESS)")
            fi
        fi
    fi
done

if [ ${#CONFLICTS[@]} -gt 0 ]; then
    print_error "Port conflicts detected!"
    echo ""
    for CONFLICT in "${CONFLICTS[@]}"; do
        echo "  • $CONFLICT"
    done
    echo ""
    echo "Please stop the conflicting services and try again."
    echo ""
    echo "To stop Docker containers:"
    echo "  docker stop <container-name>"
    echo ""
    exit 1
fi
print_success "No port conflicts detected"

# Step 4: Check for .env file
ENV_FILE=".env"
ENV_EXAMPLE=".env.example"

if [ -f "$ENV_FILE" ]; then
    print_success "Found existing .env file"
else
    print_warning "No .env file found, starting setup wizard..."
    echo ""

    if [ ! -f "$ENV_EXAMPLE" ]; then
        print_error ".env.example file not found!"
        exit 1
    fi

    # Copy the example file
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    print_success "Copied .env.example to .env"
    echo ""

    # Ask about deployment type
    print_info "Choose your deployment option:"
    echo ""
    echo "  1) Local HTTPS (mkcert)"
    echo "     - Best for: Home/LAN access without exposing the server"
    echo "     - Provide an IP or local DNS entry (e.g., 192.168.1.20 or famly.local)"
    echo ""
    echo "  2) HTTP-01 Challenge (public domain via Let's Encrypt)"
    echo "     - Best for: Internet-facing deployments with port forwarding"
    echo "     - Requires ports 80/443 open to the internet"
    echo ""
    echo "  3) DNS-01 Challenge (advanced via DNS provider API)"
    echo "     - Best for: VPN/internal domains without port exposure"
    echo "     - Requires API tokens (Cloudflare, Route53, etc.)"
    echo ""
    read -p "Enter your choice (1-3): " DEPLOYMENT_TYPE
    echo ""

    case "$DEPLOYMENT_TYPE" in
        1)
            setup_local_https
            ;;
        2)
            setup_http01_challenge
            ;;
        3)
            print_warning "DNS-01 setup is not yet automated in this script."
            echo ""
            echo "Please refer to docs/HTTPS_SETUP.md for manual DNS-01 configuration."
            echo "Or contact support for help."
            echo ""
            rm "$ENV_FILE"
            exit 1
            ;;
        *)
            print_error "Invalid choice. Please run again and select 1, 2, or 3."
            rm "$ENV_FILE"
            exit 1
            ;;
    esac

fi

ensure_secret_value "BETTER_AUTH_SECRET" "change-this-to-a-secure-random-string-min-32-chars-required"
ensure_secret_value "MINIO_ROOT_PASSWORD" "change-this-to-a-secure-password-min-32-chars"

# Step 5: Check PROTOCOL setting
source "$ENV_FILE" 2>/dev/null || true
PROTOCOL=${PROTOCOL:-https}

# Detect which Caddyfile to use for HTTPS mode
if [ "$PROTOCOL" == "https" ]; then
    DESIRED_CADDYFILE=${CADDYFILE:-Caddyfile.localhost}

    if [ -f "docker/caddy/$DESIRED_CADDYFILE" ]; then
        export CADDYFILE="$DESIRED_CADDYFILE"
        if [ "$CADDYFILE" == "Caddyfile.production" ]; then
            HTTPS_MODE="custom domain (Let's Encrypt)"
        elif [ "$CADDYFILE" == "Caddyfile.localhost" ]; then
            HTTPS_MODE="localhost (mkcert)"
        else
            HTTPS_MODE="custom HTTPS config ($CADDYFILE)"
        fi
    elif [ -f "docker/caddy/Caddyfile.production" ]; then
        export CADDYFILE="Caddyfile.production"
        HTTPS_MODE="custom domain (Let's Encrypt)"
    else
        export CADDYFILE="Caddyfile.localhost"
        HTTPS_MODE="localhost (mkcert)"
    fi

fi

echo ""
print_info "Starting Famly services in production mode (secure - only Caddy ports exposed)..."
if [ "$PROTOCOL" == "https" ]; then
    print_success "HTTPS enabled via Caddy reverse proxy"
    if [ "$CADDYFILE" == "Caddyfile.production" ]; then
        print_success "Using custom domain configuration: docker/caddy/Caddyfile.production"
    else
        print_success "Using localhost configuration with mkcert certificates"
        print_warning "For custom domains, see: https://github.com/yourusername/famly#production-https"
    fi
else
    print_success "HTTP mode (Caddy will serve on port 80)"
fi
echo ""

# Build images if --build flag is set
if [ ! -z "$BUILD_FLAG" ]; then
    print_info "Building images with --no-cache..."
    $COMPOSE_CMD --env-file .env build $BUILD_FLAG
    echo ""
fi

# Build and start services
$COMPOSE_CMD --env-file .env up -d --build

# Wait a moment for services to initialize
sleep 2

# Step 6: Show status and URLs
echo ""
print_success "Famly is starting up!"
echo ""

# Get the configured ports and IP from .env if they exist
source "$ENV_FILE"
WEB_PORT=${WEB_PORT:-3000}
API_PORT=${API_PORT:-3001}
MINIO_CONSOLE_PORT=${MINIO_CONSOLE_PORT:-9001}
LOCAL_IP=$(get_local_ip)
CLIENT_HOST=$(echo "$CLIENT_URL" | sed -E 's#https?://([^/]+)/?.*#\1#')
CLIENT_HOST=${CLIENT_HOST:-localhost}

echo -e "${GREEN}Access your Famly instance at:${NC}"
echo ""

if [ "$PROTOCOL" == "https" ]; then
    if [ "$CADDYFILE" == "Caddyfile.production" ]; then
        # Mode 3: Custom domain
        DOMAIN=$(grep -E "^[a-zA-Z0-9.-]+\s*{" docker/caddy/Caddyfile.production | head -1 | awk '{print $1}')
        echo -e "  ${BLUE}Web Application:${NC}"
        echo -e "    • HTTPS: ${GREEN}https://${DOMAIN}${NC}"
        echo ""
        echo -e "  ${BLUE}API:${NC}"
        echo -e "    • HTTPS: ${GREEN}https://${DOMAIN}/api${NC}"
    else
        # Mode 2: Local HTTPS with mkcert
        echo -e "  ${BLUE}Web Application:${NC}"
        if [ "$CLIENT_HOST" != "localhost" ] && [ "$CLIENT_HOST" != "localhost:8443" ]; then
            echo -e "    • HTTPS: ${GREEN}https://${CLIENT_HOST}${NC}"
            echo -e "    • Localhost fallback: https://localhost"
            echo ""
            echo -e "  ${BLUE}API:${NC}"
            echo -e "    • HTTPS: ${GREEN}https://${CLIENT_HOST}/api${NC}"
            echo -e "    • Localhost fallback: https://localhost/api"
            echo ""
            echo -e "  ${BLUE}Reminder:${NC} Install the mkcert CA on every device that uses ${CLIENT_HOST}"
        else
            echo -e "    • HTTPS: ${GREEN}https://localhost${NC}"
            echo -e "    • Network: https://${LOCAL_IP} (requires mkcert CA on device)"
            echo ""
            echo -e "  ${BLUE}API:${NC}"
            echo -e "    • HTTPS: ${GREEN}https://localhost/api${NC}"
            echo -e "    • Network: https://${LOCAL_IP}/api (requires mkcert CA on device)"
        fi
    fi
else
    echo -e "  ${BLUE}Web Application:${NC}"
    echo -e "    • HTTP: ${GREEN}http://localhost${NC}"
    echo -e "    • Network: http://${LOCAL_IP}"
    echo ""
    echo -e "  ${BLUE}API:${NC}"
    echo -e "    • HTTP: ${GREEN}http://localhost/api${NC}"
    echo -e "    • Network: http://${LOCAL_IP}/api"
fi
echo ""
echo -e "  ${BLUE}Internal Services:${NC}"
echo -e "    • ${GREEN}Not exposed${NC} (accessible only via Caddy reverse proxy)"
echo -e "    • API, Web, MinIO, and MongoDB are secured behind Caddy"
echo ""

print_info "It may take a minute for all services to become fully available."
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  • View logs:        ${COMPOSE_CMD} logs -f"
echo "  • Stop services:    ${COMPOSE_CMD} down"
echo "  • Restart services: ${COMPOSE_CMD} restart"
echo ""
