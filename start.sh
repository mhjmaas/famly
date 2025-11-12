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

# Print header
print_header

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
    print_warning "No .env file found, creating one..."

    if [ ! -f "$ENV_EXAMPLE" ]; then
        print_error ".env.example file not found!"
        exit 1
    fi

    # Copy the example file
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    print_success "Copied .env.example to .env"

    # Generate secrets
    print_info "Generating secure secrets..."
    MINIO_PASSWORD=$(generate_secret)
    BETTER_AUTH_SECRET=$(generate_secret)

    # Get local IP for URLs
    LOCAL_IP=$(get_local_ip)

    # Replace placeholders in .env file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS (BSD sed)
        sed -i '' "s|MINIO_ROOT_PASSWORD=change-this-to-a-secure-password-min-32-chars|MINIO_ROOT_PASSWORD=${MINIO_PASSWORD}|g" "$ENV_FILE"
        sed -i '' "s|BETTER_AUTH_SECRET=change-this-to-a-secure-random-string-min-32-chars-required|BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}|g" "$ENV_FILE"
        sed -i '' "s|BETTER_AUTH_URL=http://localhost:3001|BETTER_AUTH_URL=http://${LOCAL_IP}:3001|g" "$ENV_FILE"
        sed -i '' "s|NEXT_PUBLIC_API_URL=http://localhost:3001|NEXT_PUBLIC_API_URL=http://${LOCAL_IP}:3001|g" "$ENV_FILE"
        sed -i '' "s|CLIENT_URL=http://localhost:3000|CLIENT_URL=http://${LOCAL_IP}:3000|g" "$ENV_FILE"
    else
        # Linux (GNU sed)
        sed -i "s|MINIO_ROOT_PASSWORD=change-this-to-a-secure-password-min-32-chars|MINIO_ROOT_PASSWORD=${MINIO_PASSWORD}|g" "$ENV_FILE"
        sed -i "s|BETTER_AUTH_SECRET=change-this-to-a-secure-random-string-min-32-chars-required|BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}|g" "$ENV_FILE"
        sed -i "s|BETTER_AUTH_URL=http://localhost:3001|BETTER_AUTH_URL=http://${LOCAL_IP}:3001|g" "$ENV_FILE"
        sed -i "s|NEXT_PUBLIC_API_URL=http://localhost:3001|NEXT_PUBLIC_API_URL=http://${LOCAL_IP}:3001|g" "$ENV_FILE"
        sed -i "s|CLIENT_URL=http://localhost:3000|CLIENT_URL=http://${LOCAL_IP}:3000|g" "$ENV_FILE"
    fi

    print_success "Generated and configured secrets"
    print_info "Configuration saved to .env file"
fi

# Step 5: Check PROTOCOL setting
source "$ENV_FILE" 2>/dev/null || true
PROTOCOL=${PROTOCOL:-https}

# Detect which Caddyfile to use for HTTPS mode
if [ "$PROTOCOL" == "https" ]; then
    if [ -f "docker/caddy/Caddyfile.production" ]; then
        export CADDYFILE="Caddyfile.production"
        HTTPS_MODE="custom domain (Let's Encrypt)"
    else
        export CADDYFILE="${CADDYFILE:-Caddyfile.localhost}"
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

# Build and start services
$COMPOSE_CMD up -d --build

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
        # Mode 2: Localhost with mkcert
        echo -e "  ${BLUE}Web Application:${NC}"
        echo -e "    • HTTPS: ${GREEN}https://localhost${NC}"
        echo -e "    • Network: https://${LOCAL_IP} (requires mkcert CA on device)"
        echo ""
        echo -e "  ${BLUE}API:${NC}"
        echo -e "    • HTTPS: ${GREEN}https://localhost/api${NC}"
        echo -e "    • Network: https://${LOCAL_IP}/api (requires mkcert CA on device)"
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
