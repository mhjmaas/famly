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
    echo -e "${BLUE}   Famly - Development Mode${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Print header
print_header

# Parse command line flags
BUILD_FLAG=""
for arg in "$@"; do
    case $arg in
        --reset)
            if [ -f ".env.dev" ]; then
                print_info "Removing existing .env.dev file..."
                rm ".env.dev"
                print_success ".env.dev deleted - will regenerate with defaults"
            else
                print_info "No .env.dev file found to reset"
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

# Step 1: Check if pnpm is installed
print_info "Checking pnpm installation..."
if ! command_exists pnpm; then
    print_error "pnpm is not installed!"
    echo ""
    echo "Please install pnpm first:"
    echo "  npm install -g pnpm"
    echo ""
    echo "Or enable corepack (Node.js 16.13+):"
    echo "  corepack enable"
    echo "  corepack prepare pnpm@latest --activate"
    echo ""
    echo "For more info: https://pnpm.io/installation"
    echo ""
    exit 1
fi
print_success "pnpm is installed ($(pnpm --version))"

# Step 2: Check if Docker is installed
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

# Step 3: Check if Docker Compose is available
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

# Step 4: Check if Docker daemon is running
print_info "Checking if Docker daemon is running..."
if ! docker info >/dev/null 2>&1; then
    print_error "Docker daemon is not running!"
    echo ""
    echo "Please start Docker and try again."
    echo ""
    exit 1
fi
print_success "Docker daemon is running"

# Step 5: Load .env.dev if exists to determine protocol and export variables for docker-compose
PROTOCOL="https"
if [ -f ".env.dev" ]; then
    # Export all variables from .env.dev so docker-compose can use them
    set -a  # Automatically export all variables
    source .env.dev
    set +a  # Stop automatically exporting
    
    # Ensure PROTOCOL is set (fallback to https if not in file)
    PROTOCOL=${PROTOCOL:-https}
fi

# Step 6: Check for mkcert if HTTPS is enabled
if [ "$PROTOCOL" == "https" ]; then
    print_info "HTTPS mode enabled - checking mkcert installation..."

    if ! command_exists mkcert; then
        print_error "mkcert is not installed!"
        echo ""
        echo "mkcert is required for local HTTPS development."
        echo ""
        echo "Install instructions:"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "  brew install mkcert"
            echo "  mkcert -install"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo "  # On Debian/Ubuntu:"
            echo "  sudo apt install libnss3-tools"
            echo "  wget https://github.com/FiloSottile/mkcert/releases/latest/download/mkcert-v*-linux-amd64"
            echo "  chmod +x mkcert-v*-linux-amd64"
            echo "  sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert"
            echo "  mkcert -install"
        else
            echo "  See: https://github.com/FiloSottile/mkcert#installation"
        fi
        echo ""
        echo "Or disable HTTPS by setting PROTOCOL=http in .env.dev"
        echo ""
        exit 1
    fi
    print_success "mkcert is installed"

    # Check if mkcert CA is installed
    if ! mkcert -CAROOT >/dev/null 2>&1; then
        print_warning "mkcert CA is not installed in your system trust store"
        echo ""
        echo -e "${BLUE}Why is this needed?${NC}"
        echo "  To use HTTPS locally without browser warnings, we need to install"
        echo "  a local Certificate Authority (CA) that your system will trust."
        echo ""
        echo -e "${BLUE}What will happen:${NC}"
        echo "  • mkcert will install a local CA certificate"
        echo "  • ${YELLOW}You may see a system permission prompt (password required)${NC}"
        echo "  • This is safe - it only affects certificates on this machine"
        echo "  • Browsers will trust locally-generated HTTPS certificates"
        echo ""
        echo "You can also run this manually later:"
        echo "  ${GREEN}mkcert -install${NC}"
        echo ""
        read -p "Install mkcert CA now? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo ""
            print_info "Installing mkcert CA (system permission prompt may appear)..."
            mkcert -install
            print_success "mkcert CA installed - certificates will be trusted!"
            echo ""
            print_info "Note: You may need to restart your browser for changes to take effect"
        else
            print_warning "Skipping CA installation"
            echo ""
            echo -e "${YELLOW}⚠ Without the CA installed:${NC}"
            echo "  • Your browser will show certificate warnings"
            echo "  • You'll need to manually accept the security exception"
            echo "  • Some PWA features may not work properly"
            echo ""
            echo "To install later, run: ${GREEN}mkcert -install${NC}"
        fi
    else
        print_success "mkcert CA is installed"
    fi

    # Generate certificates if they don't exist
    CERT_DIR="docker/caddy/certs"
    CERT_FILE="$CERT_DIR/localhost.pem"
    KEY_FILE="$CERT_DIR/localhost-key.pem"

    if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
        print_info "Generating local HTTPS certificates..."
        mkdir -p "$CERT_DIR"
        mkcert -cert-file "$CERT_FILE" -key-file "$KEY_FILE" localhost 127.0.0.1 ::1
        print_success "Certificates generated at $CERT_DIR/"
    else
        print_success "Certificates already exist"
    fi
fi

# Step 7: Check for port conflicts
print_info "Checking for port conflicts..."
PORTS_TO_CHECK=(3000 3001 9000 9001 27017)
if [ "$PROTOCOL" == "https" ]; then
    PORTS_TO_CHECK+=(8443)  # Caddy uses 8443 instead of 443 to avoid conflicts
fi
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

# Step 8: Install dependencies
print_info "Installing project dependencies..."
if [ ! -d "node_modules" ] || [ ! -d "apps/api/node_modules" ] || [ ! -d "apps/web/node_modules" ]; then
    print_warning "Some dependencies are missing, running pnpm install..."
    pnpm install --frozen-lockfile
    print_success "Dependencies installed"
else
    print_success "Dependencies already installed"
    print_info "Run 'pnpm install' manually if you need to update dependencies"
fi

# Step 9: Check for .env.dev file
ENV_FILE=".env.dev"
ENV_EXAMPLE=".env.example"

if [ -f "$ENV_FILE" ]; then
    print_success "Found existing .env.dev file"
else
    print_warning "No .env.dev file found"

    if [ -f "$ENV_EXAMPLE" ]; then
        print_info "Creating .env.dev from .env.example..."
        cp "$ENV_EXAMPLE" "$ENV_FILE"

        # Update to use development defaults with HTTP for fallback mode
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS (BSD sed)
            sed -i '' "s|PROTOCOL=.*|PROTOCOL=https|g" "$ENV_FILE"
            sed -i '' "s|BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=dev_better_auth_secret_min_32_chars_required_here|g" "$ENV_FILE"
            sed -i '' "s|BETTER_AUTH_URL=.*|BETTER_AUTH_URL=https://localhost:8443/api|g" "$ENV_FILE"
            sed -i '' "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://localhost:8443/api|g" "$ENV_FILE"
            sed -i '' "s|NEXT_PUBLIC_WS_URL=.*|NEXT_PUBLIC_WS_URL=https://localhost:8443|g" "$ENV_FILE"
            sed -i '' "s|CLIENT_URL=.*|CLIENT_URL=https://localhost:8443|g" "$ENV_FILE"
            sed -i '' "s|MINIO_ROOT_USER=.*|MINIO_ROOT_USER=famly-admin|g" "$ENV_FILE"
            sed -i '' "s|MINIO_ROOT_PASSWORD=.*|MINIO_ROOT_PASSWORD=famly-dev-secret-min-32-chars|g" "$ENV_FILE"
        else
            # Linux (GNU sed)
            sed -i "s|PROTOCOL=.*|PROTOCOL=https|g" "$ENV_FILE"
            sed -i "s|BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=dev_better_auth_secret_min_32_chars_required_here|g" "$ENV_FILE"
            sed -i "s|BETTER_AUTH_URL=.*|BETTER_AUTH_URL=https://localhost:8443/api|g" "$ENV_FILE"
            sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://localhost:8443/api|g" "$ENV_FILE"
            sed -i "s|NEXT_PUBLIC_WS_URL=.*|NEXT_PUBLIC_WS_URL=https://localhost:8443|g" "$ENV_FILE"
            sed -i "s|CLIENT_URL=.*|CLIENT_URL=https://localhost:8443|g" "$ENV_FILE"
            sed -i "s|MINIO_ROOT_USER=.*|MINIO_ROOT_USER=famly-admin|g" "$ENV_FILE"
            sed -i "s|MINIO_ROOT_PASSWORD=.*|MINIO_ROOT_PASSWORD=famly-dev-secret-min-32-chars|g" "$ENV_FILE"
        fi

        print_success "Created .env.dev with development defaults"
    else
        print_warning ".env.example not found, skipping .env.dev creation"
    fi
fi

# Step 10: Check and configure timezone
# Source .env.dev to get current timezone
source ".env.dev" 2>/dev/null || true

# Only configure timezone if not already set
if [ -z "$TIMEZONE" ] || [ "$TIMEZONE" == "change-this-timezone" ]; then
    print_info "Configuring timezone..."

    # Get the default timezone from .env.example
    DEFAULT_TZ="Europe/Amsterdam"
    if [ -f "$ENV_EXAMPLE" ]; then
        DEFAULT_TZ=$(grep -E "^TIMEZONE=" "$ENV_EXAMPLE" | cut -d'=' -f2 | tr -d '"')
        DEFAULT_TZ=${DEFAULT_TZ:-Europe/Amsterdam}
    fi

    echo ""
    echo -e "${BLUE}Timezone Configuration${NC}"
    echo "Enter a TZ identifier from the IANA time zone database:"
    echo "See: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones"
    echo ""

    read -p "Timezone [${DEFAULT_TZ}]: " USER_TZ
    echo ""

    # Use user input or default
    TIMEZONE=${USER_TZ:-$DEFAULT_TZ}

    # Update timezone in .env.dev
    if [ -f ".env.dev" ]; then
        if grep -q "^TIMEZONE=" ".env.dev"; then
            # Update existing timezone line
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s|^TIMEZONE=.*|TIMEZONE=\"${TIMEZONE}\"|g" ".env.dev"
            else
                sed -i "s|^TIMEZONE=.*|TIMEZONE=\"${TIMEZONE}\"|g" ".env.dev"
            fi
        else
            # Add timezone if it doesn't exist
            echo "TIMEZONE=\"${TIMEZONE}\"" >> ".env.dev"
        fi
        print_success "Timezone set to: $TIMEZONE"
    else
        print_info "Timezone will be set to: $TIMEZONE"
    fi
    echo ""
else
    print_success "Timezone already configured: $TIMEZONE"
fi

# Step 11: Check and generate VAPID keys for push notifications
print_info "Checking push notification configuration..."

# Source .env.dev to get current VAPID keys
if [ -f ".env.dev" ]; then
    set -a
    source .env.dev
    set +a
fi

# Check if VAPID keys are set and valid (not placeholder values)
VAPID_PUBLIC_VALID=false
VAPID_PRIVATE_VALID=false

if [ ! -z "$NEXT_PUBLIC_VAPID_PUBLIC_KEY" ] && [ "$NEXT_PUBLIC_VAPID_PUBLIC_KEY" != "your_public_key_here" ]; then
    VAPID_PUBLIC_VALID=true
fi

if [ ! -z "$VAPID_PRIVATE_KEY" ] && [ "$VAPID_PRIVATE_KEY" != "your_private_key_here" ]; then
    VAPID_PRIVATE_VALID=true
fi

if [ "$VAPID_PUBLIC_VALID" = false ] || [ "$VAPID_PRIVATE_VALID" = false ]; then
    print_warning "Push notification VAPID keys are not configured"
    echo ""
    echo -e "${BLUE}Why are VAPID keys needed?${NC}"
    echo "  VAPID (Voluntary Application Server Identification) keys enable push notifications"
    echo "  in your application. Without them, notifications won't work in development."
    echo ""
    echo "They are:"
    echo "  • Only used for development (not production secrets)"
    echo "  • Automatically generated and stored in .env.dev"
    echo "  • Safe to regenerate at any time"
    echo ""
    read -p "Generate VAPID keys now? (y/N): " VAPID_REPLY
    echo ""

    if [[ $VAPID_REPLY =~ ^[Yy]$ ]]; then
        print_info "Generating VAPID keys..."
        echo ""

        # Run the command and capture output
        VAPID_OUTPUT=$(npx --yes web-push generate-vapid-keys 2>&1)

        # Parse the output - keys are on the line after the labels
        PUBLIC_KEY=$(echo "$VAPID_OUTPUT" | grep -A 1 "Public Key:" | tail -1 | xargs)
        PRIVATE_KEY=$(echo "$VAPID_OUTPUT" | grep -A 1 "Private Key:" | tail -1 | xargs)

        if [ ! -z "$PUBLIC_KEY" ] && [ ! -z "$PRIVATE_KEY" ]; then
            # Update .env.dev with the generated keys
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS (BSD sed)
                sed -i '' "s|NEXT_PUBLIC_VAPID_PUBLIC_KEY=.*|NEXT_PUBLIC_VAPID_PUBLIC_KEY=$PUBLIC_KEY|g" ".env.dev"
                sed -i '' "s|VAPID_PRIVATE_KEY=.*|VAPID_PRIVATE_KEY=$PRIVATE_KEY|g" ".env.dev"
                sed -i '' "s|VAPID_EMAIL=.*|VAPID_EMAIL=dev@famly.app|g" ".env.dev"
            else
                # Linux (GNU sed)
                sed -i "s|NEXT_PUBLIC_VAPID_PUBLIC_KEY=.*|NEXT_PUBLIC_VAPID_PUBLIC_KEY=$PUBLIC_KEY|g" ".env.dev"
                sed -i "s|VAPID_PRIVATE_KEY=.*|VAPID_PRIVATE_KEY=$PRIVATE_KEY|g" ".env.dev"
                sed -i "s|VAPID_EMAIL=.*|VAPID_EMAIL=dev@famly.app|g" ".env.dev"
            fi

            print_success "VAPID keys generated and saved to .env.dev"
            print_info "Push notifications are now enabled"
        else
            print_error "Failed to generate VAPID keys"
            echo ""
            echo "To generate keys manually, run:"
            echo "  ${GREEN}npx web-push generate-vapid-keys${NC}"
            echo ""
        fi
    else
        print_warning "Skipping VAPID key generation"
        echo ""
        echo "To generate keys later, run:"
        echo "  ${GREEN}npx web-push generate-vapid-keys${NC}"
        echo ""
    fi
    echo ""
else
    print_success "VAPID keys are configured"
fi

# Step 11.5: Check and configure Tavily API key for web search
print_info "Checking web search configuration..."

# Source .env.dev to get current Tavily key
if [ -f ".env.dev" ]; then
    set -a
    source .env.dev
    set +a
fi

# Check if Tavily key is set and valid (not placeholder value)
TAVILY_KEY_VALID=false

if [ ! -z "$TAVILY_KEY" ] && [ "$TAVILY_KEY" != "your_tavily_key_here" ]; then
    TAVILY_KEY_VALID=true
fi

if [ "$TAVILY_KEY_VALID" = false ]; then
    print_warning "Tavily API key is not configured"
    echo ""
    echo -e "${BLUE}What is Tavily used for?${NC}"
    echo "  Tavily enables AI-powered web search functionality in the application."
    echo "  This allows the AI assistant to search the web for real-time information."
    echo ""
    echo "Without a Tavily API key:"
    echo "  • The AI assistant will work normally for other features"
    echo -e "  • ${YELLOW}Web search capabilities will be disabled${NC}"
    echo "  • No cost or account required if you don't need web search"
    echo ""
    echo "To get a Tavily API key:"
    echo -e "  • Sign up at ${GREEN}https://tavily.com${NC}"
    echo "  • Free tier available for testing"
    echo ""
    read -p "Enter Tavily API key (or press Enter to skip): " TAVILY_REPLY
    echo ""

    if [ ! -z "$TAVILY_REPLY" ]; then
        # Trim whitespace
        TAVILY_REPLY=$(echo "$TAVILY_REPLY" | xargs)

        # Update .env.dev with the provided key
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS (BSD sed)
            sed -i '' "s|TAVILY_KEY=.*|TAVILY_KEY=$TAVILY_REPLY|g" ".env.dev"
        else
            # Linux (GNU sed)
            sed -i "s|TAVILY_KEY=.*|TAVILY_KEY=$TAVILY_REPLY|g" ".env.dev"
        fi

        print_success "Tavily API key configured"
        print_info "Web search is now enabled"
    else
        print_warning "Skipping Tavily API key configuration"
        echo ""
        echo -e "${YELLOW}ℹ  Web search will not be available${NC}"
        echo "  You can add your Tavily API key later by:"
        echo -e "  1. Getting a key from ${GREEN}https://tavily.com${NC}"
        echo "  2. Adding it to .env.dev: TAVILY_KEY=your_key_here"
        echo ""
    fi
    echo ""
else
    print_success "Tavily API key is configured"
fi

# Step 12: Show service info before starting
echo ""
if [ "$PROTOCOL" == "https" ]; then
    echo -e "${GREEN}🚀 Starting development services with HTTPS (via Caddy):${NC}"
else
    echo -e "${GREEN}Starting development services (HTTP mode):${NC}"
fi
echo ""

if [ "$PROTOCOL" == "https" ]; then
    echo -e "  ${BLUE}Caddy Reverse Proxy:${NC}"
    echo -e "    • HTTPS: https://localhost:8443"
    echo -e "    • TLS: ${GREEN}mkcert certificates${NC}"
    echo ""
    echo -e "  ${BLUE}Web Application (via Caddy):${NC}"
    echo -e "    • URL: ${GREEN}https://localhost:8443${NC}"
    echo -e "    • Direct: http://localhost:3000 (bypasses Caddy)"
    echo -e "    • Live reload: ${GREEN}Enabled${NC}"
    echo ""
    echo -e "  ${BLUE}API (via Caddy):${NC}"
    echo -e "    • URL: ${GREEN}https://localhost:8443/api${NC}"
    echo -e "    • Direct: http://localhost:3001 (bypasses Caddy)"
    echo -e "    • Live reload: ${GREEN}Enabled${NC}"
else
    echo -e "  ${BLUE}Web Application (Next.js with Turbopack):${NC}"
    echo -e "    • URL: http://localhost:3000"
    echo -e "    • Live reload: ${GREEN}Enabled${NC}"
    echo ""
    echo -e "  ${BLUE}API (Express + tsx watch):${NC}"
    echo -e "    • URL: http://localhost:3001"
    echo -e "    • Live reload: ${GREEN}Enabled${NC}"
fi
echo ""
echo -e "  ${BLUE}MongoDB:${NC}"
echo -e "    • Host: localhost:27017"
echo -e "    • Database: famly"
echo -e "    • ${YELLOW}Exposed for inspection (MongoDB Compass, etc.)${NC}"
echo ""
echo -e "  ${BLUE}MinIO (Storage):${NC}"
echo -e "    • API: http://localhost:9000"
echo -e "    • Console: http://localhost:9001"
echo -e "    • Credentials: famly-dev-access / famly-dev-secret-min-32-chars"
echo ""
print_info "Code changes will trigger automatic reloads in both API and Web containers"
echo ""
echo -e "${YELLOW}Tips:${NC}"
echo "  • Press Ctrl+C to stop all services"
echo "  • MongoDB Compass URI: mongodb://localhost:27017/famly"
if [ "$PROTOCOL" == "https" ]; then
    echo "  • Certificate trusted: mkcert -CAROOT shows CA location"
    echo "  • Switch to HTTP: Set PROTOCOL=http in .env.dev"
fi
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Project name for Docker Compose
PROJECT_NAME="famly-dev"

# Cleanup function to stop all services
cleanup() {
    echo ""
    if [ "$PROTOCOL" == "https" ]; then
        print_info "Stopping all services (MongoDB, MinIO, API, Web, Caddy)..."
    else
        print_info "Stopping all services (MongoDB, MinIO, API, Web)..."
    fi
    $COMPOSE_CMD -p $PROJECT_NAME --env-file .env.dev -f docker/compose.dev.yml --profile https stop
    print_success "All services stopped (data preserved)"
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM to gracefully stop containers
trap cleanup INT TERM

# Determine which services to start based on protocol
if [ "$PROTOCOL" == "https" ]; then
    COMPOSE_PROFILE="--profile https"
    SERVICES_TO_START="api web caddy"
else
    COMPOSE_PROFILE=""
    SERVICES_TO_START="api web"
fi

# Build images if --build flag is set
if [ ! -z "$BUILD_FLAG" ]; then
    print_info "Building images with --no-cache..."
    $COMPOSE_CMD -p $PROJECT_NAME --env-file .env.dev -f docker/compose.dev.yml build $BUILD_FLAG
    echo ""
fi

# Start all services in detached mode first (to avoid MongoDB/MinIO logs)
print_info "Starting infrastructure services (MongoDB, MinIO)..."
$COMPOSE_CMD -p $PROJECT_NAME --env-file .env.dev -f docker/compose.dev.yml up -d mongo minio --build

# Wait for health checks to pass
print_info "Waiting for infrastructure to be healthy..."
$COMPOSE_CMD -p $PROJECT_NAME --env-file .env.dev -f docker/compose.dev.yml up -d --wait mongo minio

# Now start API, Web, and optionally Caddy in attached mode (showing their logs)
if [ "$PROTOCOL" == "https" ]; then
    print_info "Starting API, Web, and Caddy services (logs visible below)..."
else
    print_info "Starting API and Web services (logs visible below)..."
fi
echo ""
$COMPOSE_CMD -p $PROJECT_NAME --env-file .env.dev -f docker/compose.dev.yml $COMPOSE_PROFILE up --build $SERVICES_TO_START

# If we reach here, the up command exited normally (not via Ctrl+C)
# Still run cleanup to be safe
cleanup
