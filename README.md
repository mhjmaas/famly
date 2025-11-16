# Famly: Family Management & Organization App

Famly is a comprehensive family organization app designed to streamline task management, allowance tracking, shared calendar events, and more - all in one place. This README outlines the core features for our minimum viable product (MVP) as well as extended ideas for future development.

## 🏠 Home Deployment (Recommended)

Deploy Famly on your local network or home server using Docker Compose.

### Prerequisites

- Docker and Docker Compose installed
- At least 2GB of available RAM
- Available ports: 3000 (web), 3001 (API), 9001 (MinIO Console)

### ⚡ Quick Start (Choose Your Mode)

The easiest way to get started is using our automated setup scripts. Choose based on your needs:

**For Development:** Use `./dev.sh`
- Live code reloading for instant feedback
- Perfect for active development
- Access at https://localhost:8443

**For Production:** Use `./start.sh`
- Production-optimized builds
- Guided wizard with three options:
  - Local HTTPS (mkcert) for LAN-only deployments
  - HTTP-01 (Let's Encrypt) for public domains
  - DNS-01 (advanced, follow docs)

### Setup Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/famly.git
   cd famly
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Run your preferred script**

   ```bash
   # For development
   ./dev.sh

   # OR for production
   ./start.sh
   ```

The scripts will guide you through:
- Checking prerequisites (Docker, pnpm)
- Creating/updating configuration files
- Optionally generating VAPID keys for push notifications
- Starting all services

That's it! The script will configure everything automatically.

## 🚀 Deployment Modes

Famly supports multiple deployment scenarios. The setup scripts (`./dev.sh` and `./start.sh`) guide you through choosing the right configuration for your needs.

### Development Mode (`./dev.sh`)

**Use case:** Active development with live code reloading

**What the script does:**
- ✅ Checks prerequisites (Docker, pnpm)
- ✅ Creates `.env.dev` with sensible defaults
- ✅ Optionally generates VAPID keys for push notifications
- ✅ Starts MongoDB, MinIO, API, and Web containers
- ✅ Enables hot reload (code changes apply instantly)
- ✅ Shows only relevant logs

**Features:**
- 🔥 **Live reload** - Code changes trigger automatic reloads
- 🔍 **MongoDB exposed** - Connect MongoDB Compass to `mongodb://localhost:27017/famly`
- 📦 **Containerized** - Everything runs in Docker
- ✅ **HTTPS** - Automatic mkcert certificates (localhost:8443)

**Access:**
- Web: https://localhost:8443
- API: https://localhost:8443/api
- MongoDB: mongodb://localhost:27017/famly
- MinIO: https://localhost:8443/minio (credentials: famly-admin/famly-dev-secret-min-32-chars)

---

### Production Mode (`./start.sh`)

**Use case:** Running Famly on your home server or deploying to the internet

The `./start.sh` script presents options during setup:

#### Option 1: Local HTTPS (Recommended for Home Use)

**Perfect for:** Home servers, local network access, single family deployments

- Uses mkcert for locally-trusted certificates tied to your LAN hostname
- Access via `https://YOUR_LOCAL_HOST` (IPv4 like `192.168.1.50` or DNS such as `famly.local`)
- Wizard prompts for the host/IP so every service, URL, and certificate matches your network
- Database and files stored locally
- No internet exposure required
- Zero monthly costs

**What the script does:**
- Creates `.env` with your configuration
- Prompts for LAN host + contact email, then generates mkcert certificates for both that host and `localhost`
- Optionally sets up VAPID keys for push notifications
- Starts all services in production mode

> 💡 Remember to install the mkcert CA on each laptop/phone that will open `https://YOUR_LOCAL_HOST`, otherwise browsers will warn about the certificate.

#### Option 2: Internet Access with Custom Domain

**Perfect for:** Multi-family deployments, shared access over internet, custom domain

- Uses Let's Encrypt for publicly-trusted certificates
- Choose between HTTP-01 (simpler) or DNS-01 (more secure) challenge
- When the wizard prompts, pick option 2 for HTTP-01 (option 3 for DNS-01 still references the manual guide)
- Auto-renewal every 60 days
- Requires custom domain and DNS configuration
- Suitable for multi-user deployments

**What the script does:**
- Guides you through domain and email setup
- Creates appropriate Caddyfile configuration
- Generates VAPID keys if needed
- Sets up Let's Encrypt certificates
- Only exposes Caddy ports (80, 443)
- Keeps internal services secured behind reverse proxy

For detailed setup instructions, see [docs/HTTPS_SETUP.md](./docs/HTTPS_SETUP.md).

---

### Stopping Services

```bash
# From dev mode (when script is running, press Ctrl+C)
# Or manually:
docker compose -f docker/compose.dev.yml down

# From production mode
docker compose down

# Remove all data (databases, files)
docker compose down -v
```

---

### Manual Setup (Advanced)

If you prefer to configure everything manually:

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/famly.git
   cd famly
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file and update the following important values:

   - `BETTER_AUTH_SECRET`: Generate a secure random string (minimum 32 characters)
     ```bash
     # Generate using openssl:
     openssl rand -base64 32
     ```
   - `MINIO_ROOT_PASSWORD`: Set a secure password (minimum 32 characters)
   - `BETTER_AUTH_URL`: Update with your server's IP or domain
     - Local network: `http://YOUR_LOCAL_IP:3001`
     - External access: `https://your-domain.com/api`
   - `NEXT_PUBLIC_API_URL`: Update with your server's IP or domain
     - Local network: `http://YOUR_LOCAL_IP:3001`
     - External access: `https://your-domain.com/api`

3. **Start the application**

   ```bash
   docker compose up -d
   ```

4. **Access the application**

   - Web App: http://localhost:3000 (or http://YOUR_IP:3000)
   - API: http://localhost:3001 (or http://YOUR_IP:3001)
   - MinIO Console (Admin): http://localhost:9001 (or http://YOUR_IP:9001)

   Note: MongoDB (port 27017) and MinIO API (port 9000) are only accessible within the Docker network for security.

### Common Operations

**View logs**

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f web
docker compose logs -f api
```

**Stop the application**

```bash
docker compose down
```

**Stop and remove all data**

```bash
docker compose down -v
```

**Restart services**

```bash
docker compose restart
```

### Updating the Application

To update to the latest version:

```bash
git pull
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Network Access

**Local Network Access:**

- Find your server's local IP address:

  ```bash
  # Linux/Mac
  hostname -I | awk '{print $1}'

  # Mac (alternative)
  ipconfig getifaddr en0
  ```

- Access from other devices on your network: `http://YOUR_LOCAL_IP:3000`

**External Access (Advanced):**

- Set up port forwarding on your router (ports 3000 and 3001)
- Consider using a reverse proxy (nginx, Caddy) with SSL/TLS
- Use a dynamic DNS service if you don't have a static IP
- Update `BETTER_AUTH_URL` and `NEXT_PUBLIC_API_URL` in `.env` with your public domain

### Troubleshooting

#### Services won't start

```bash
# Check which services are running
docker compose ps

# View service logs
docker compose logs -f api
docker compose logs -f web

# Check if ports are already in use
lsof -i :3000  # Web port
lsof -i :3001  # API port
lsof -i :27017 # MongoDB port
```

#### Scripts won't run

Make sure scripts are executable:

```bash
chmod +x ./dev.sh ./start.sh
```

#### Environment variable issues

If services fail due to missing environment variables:

1. Check that `./dev.sh` or `./start.sh` completed successfully
2. Verify `.env.dev` or `.env` was created:
   ```bash
   ls -la .env.dev  # For development
   ls -la .env      # For production
   ```
3. Ensure environment variables are properly formatted (no spaces around `=`)

#### Push notification issues

If push notifications aren't working:

1. Check VAPID keys are generated and set in your environment file
2. Verify `VAPID_EMAIL` is set correctly
3. Ensure the app is accessed via HTTPS (required for push notifications)
4. Check browser console for permission errors

#### Can't connect from other devices

- Check firewall settings on your server
- Ensure ports 3000 and 3001 are open
- For local HTTPS: Install mkcert certificates on client devices (see [docs/HTTPS_SETUP.md](./docs/HTTPS_SETUP.md))
- For Let's Encrypt: Ensure DNS is properly configured

#### Authentication/Database issues

- Verify `BETTER_AUTH_SECRET` is set and at least 32 characters
- Check MongoDB is running: `docker compose logs -f mongo`
- Verify `DEPLOYMENT_MODE` is set correctly (`standalone` or `saas`)

## 🔒 HTTPS & SSL Certificates

All deployment modes use HTTPS by default for enhanced security. HTTPS is required for PWA features like service workers and push notifications.

### Certificate Setup

- **Modes 1 & 2**: Automatic via mkcert (locally-trusted certificates)
  - Install once: `brew install mkcert && mkcert -install` (macOS)
  - Certificates auto-generate on first run
  
- **Mode 3**: Automatic via Let's Encrypt (publicly-trusted certificates)
  - Requires domain configuration in `Caddyfile.production`
  - Auto-renewal every 60 days

### 📖 Advanced HTTPS Configuration

See **[docs/HTTPS_SETUP.md](./docs/HTTPS_SETUP.md)** for:

- Mobile device certificate installation
- Custom internal domains
- DNS-01 challenge setup (no port exposure)
- VPN access configuration
- Troubleshooting certificate issues

## 💻 Local Development

### Prerequisites

- **pnpm** - Fast, disk space efficient package manager

  ```bash
  # Install via npm
  npm install -g pnpm

  # Or enable via corepack (Node.js 16.13+)
  corepack enable
  ```

- **Docker & Docker Compose** - Container runtime for services

  - [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
  - Or install [Docker Engine](https://docs.docker.com/engine/install/) + [Docker Compose](https://docs.docker.com/compose/install/) separately

- **mkcert** (optional, for HTTPS) - Local certificate authority for trusted certificates
  - See HTTPS Setup section above for installation instructions

### Quick Start with Script (Recommended)

The easiest way to start development with live reload:

```bash
# Install dependencies
pnpm install

# Start development environment with live reload
./dev.sh
```

The script will:
- Check prerequisites and setup
- Create `.env.dev` file
- Offer to generate VAPID keys for push notifications
- Start all services with hot reload enabled
- Show live logs

**Features:**

- 🔥 **Live reload** - Code changes apply instantly (API via tsx watch, Web via Next.js Turbopack)
- 🔍 **MongoDB exposed** - Connect MongoDB Compass to `mongodb://localhost:27017/famly`
- 📦 **Containerized** - No need to install MongoDB or MinIO locally
- 🎯 **Clean logs** - Only see relevant service output

**Access:**

- Web Application: https://localhost:8443
- API: https://localhost:8443/api
- MongoDB: mongodb://localhost:27017/famly
- MinIO Console: https://localhost:8443/minio (credentials: famly-dev-access/famly-dev-secret-min-32-chars)

**Useful commands:**

```bash
# View logs from specific service
docker compose -f docker/compose.dev.yml logs -f api
docker compose -f docker/compose.dev.yml logs -f web

# Stop all services (or press Ctrl+C in the dev.sh terminal)
docker compose -f docker/compose.dev.yml down

# Restart a specific service
docker compose -f docker/compose.dev.yml restart api

# Check MongoDB data
docker exec famly-mongo mongosh -u root -p root --eval "db.getSiblingDB('famly').getCollectionNames()"
```

### Manual Setup (Advanced)

For more control, you can start each service manually:

#### 1. Start MongoDB

```bash
docker run --name mongodb-famly -d -p 27017:27017 mongo:7
```

#### 2. Start MinIO

```bash
docker run --name minio-famly -d -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=famly-dev-access" \
  -e "MINIO_ROOT_PASSWORD=famly-dev-secret-min-32-chars" \
  minio/minio server /data --console-address ":9001"
```

#### 3. Install Dependencies

```bash
pnpm install
```

#### 4. Start API

```bash
pnpm run dev:api
```

#### 5. Start Web (in another terminal)

```bash
pnpm run dev:web
```

**Note:** With this approach, you're running the API and Web apps directly on your host machine, while only MongoDB and MinIO run in containers.

## 🧩 Core Features (MVP)

### 👥 Family Management

- Create and manage family profiles (parents, kids, grandparents)
- Role-based permissions (parental control)

### ✅ Task & Chore Management

- Assign tasks or chores to family members
- Schedule repeating tasks with custom frequencies
- Track progress and completion status
- Notifications and reminders for upcoming tasks
- Approve completed chores through parent verification
- Reward points or allowances tied to task completion

### 💰 Allowance & Rewards

- Connect tasks to allowance (virtual or real currency)
- Gamified leaderboard showing family member rankings
- Progress bars and badges ("Helper of the Week")
- Parent payment option for reward payouts

### 📅 Shared Calendar

- Family-wide shared calendar with event synchronization
- Events, birthdays, appointments, and reminders
- Integration with Google/Apple calendars
- "Who's driving today?" rotation tracker

### 🏡 House Management

- Shared shopping list/grocery list with item tracking
- Household inventory management (pantry, supplies)
- Maintenance reminders (filters, garbage days, etc.)
- Centralized home documents storage (manuals, receipts, warranties)

### 📍 Location & Safety

- Real-time location sharing (opt-in feature)
- "Check-in" feature ("I'm at school", "Arrived home")
- Safe zones with customizable notifications
- Emergency contacts list

## 💡 Extended / Future Ideas

### 📸 Family Moments / Memories

- Upload images and short videos to private family feed
- Tag family members in memories
- Memory timeline view by year/month
- "Today in family history" reminders

### 📔 Shared Diary or Journal

- Family diary for capturing daily moments
- Shared journaling prompts ("What made you smile today?")
- Optional AI-generated weekly summaries

### 💬 Family Chat

- In-app messaging for family communication
- Group chats and private conversations
- Push notifications for new messages
- Media sharing (photos, videos)

### 🎮 Gamification Layer

- Level up avatars based on chores completed
- Streaks and family achievements
- Unlockable cosmetic rewards or themes
- "Family challenges" (e.g., Walk 10,000 steps each!)

### 🧠 AI & Smart Assistant Features

- Smart scheduling with auto-suggested chore times
- AI summary of weekly events
- Family mood tracker based on diary entries
- AI-driven chore suggestions

### 🛒 Integrations

- Voice assistant integration (Alexa/Google Home)
- IoT integrations (smart fridge, etc.)
- Apple Family Sharing / Screen Time sync
- Messaging app reminders (WhatsApp, Telegram)

## 📊 Configuration & Environment Variables

The setup scripts (`./dev.sh` and `./start.sh`) automatically manage all configuration:

### Automatic Configuration

- **`.env`** - Production environment (created by `./start.sh`)
- **`.env.dev`** - Development environment (created by `./dev.sh`)
- **`.env.example`** - Template with all available options
- **`docker-compose.yml`** - Production services
- **`docker/compose.dev.yml`** - Development services with live reload
- **`Caddyfile.localhost`** - Local HTTPS reverse proxy (auto-generated)
- **`Caddyfile.production`** - Production reverse proxy (created during setup)

### Important Environment Variables

Key variables managed automatically:

- **`VAPID_EMAIL`** - Email for push notification certificates (dev.sh: `dev@famly.app`, start.sh: your Let's Encrypt email)
- **`BETTER_AUTH_SECRET`** - Authentication secret (auto-generated if needed)
- **`MINIO_ROOT_PASSWORD`** - MinIO storage credentials
- **`DEPLOYMENT_MODE`** - `standalone` (single family, default) or `saas` (multi-tenant)

The scripts handle all of this automatically. You only need to provide input when asked (like your domain for production).

### Push Notifications (VAPID Keys)

Both `./dev.sh` and `./start.sh` offer to generate VAPID keys for push notifications:

```bash
# When prompted during setup
Generate VAPID keys for push notifications? (Y/n): Y
```

The keys will be:
- Saved to your environment file
- Used to configure the VAPID_EMAIL setting
- Required for web push notifications to work

### Manual Configuration (Advanced)

If you need to manually edit configuration files:

1. Copy `.env.example` to `.env` or `.env.dev`
2. Update the values as needed
3. Ensure environment variables match between your `.env` file and `docker-compose.yml`

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
