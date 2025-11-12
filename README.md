# Famly: Family Management & Organization App

Famly is a comprehensive family organization app designed to streamline task management, allowance tracking, shared calendar events, and more - all in one place. This README outlines the core features for our minimum viable product (MVP) as well as extended ideas for future development.

## 🏠 Home Deployment (Recommended)

Deploy Famly on your local network or home server using Docker Compose.

### Prerequisites

- Docker and Docker Compose installed
- At least 2GB of available RAM
- Available ports: 3000 (web), 3001 (API), 9001 (MinIO Console)

### ⚡ Quick Start (Automated)

The easiest way to get started is using our automated startup script:

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/famly.git
   cd famly
   ```

2. **Run the startup script**
   ```bash
   ./start-famly.sh
   ```

That's it! The script will:

- Check if Docker is installed and running
- Create a `.env` file with secure auto-generated secrets (if it doesn't exist)
- Configure the application with your local network IP
- Start all services
- Display access URLs

## 🚀 Deployment Modes

Famly supports three deployment modes to fit different use cases:

### Mode 1: Development (Local HTTPS with Hot Reload)

**Use case:** Active development with live code reloading

**Command:** `./start-dev.sh`

**Features:**
- ✅ Hot reload for API and Web (code changes apply instantly)
- ✅ HTTPS via mkcert (localhost:8443)
- ✅ Automatic certificate generation
- ✅ Zero configuration required

**Access:** https://localhost:8443

---

### Mode 2: Production (Local HTTPS - Default)

**Use case:** Running production build on localhost with HTTPS

**Command:** `./start.sh`

**Features:**
- ✅ Production-optimized builds
- ✅ HTTPS via mkcert (localhost:443)
- ✅ Automatic certificate generation
- ✅ Zero configuration required
- ✅ Suitable for local network access

**Access:** https://localhost

**Note:** This mode uses `Caddyfile.localhost` with mkcert certificates. Perfect for secure local/network deployment without exposing to the internet.

---

### Mode 3: Production (Custom Domain with Let's Encrypt)

**Use case:** Internet-accessible deployment with your own domain

**Setup:**

1. **Copy the example Caddyfile:**

   ```bash
   # For HTTP-01 challenge (simpler, requires port forwarding)
   cp docker/caddy/Caddyfile.http01.example docker/caddy/Caddyfile.production
   
   # OR for DNS-01 challenge (more secure, no port exposure)
   cp docker/caddy/Caddyfile.production.example docker/caddy/Caddyfile.production
   ```

2. **Edit `docker/caddy/Caddyfile.production`:**

   ```caddyfile
   {
       email your-email@example.com
   }
   
   your-domain.com {
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

3. **Update `.env`:**

   ```bash
   PROTOCOL=https
   CADDYFILE=Caddyfile.production
   CLIENT_URL=https://your-domain.com
   BETTER_AUTH_URL=https://your-domain.com/api
   NEXT_PUBLIC_API_URL=https://your-domain.com/api
   ```

4. **Configure DNS and run:**

   ```bash
   ./start.sh
   ```

   The script will automatically:
   - Only expose Caddy ports 80 and 443
   - Keep all internal services (API, Web, MinIO, MongoDB) secured behind Caddy
   - Block direct access to internal ports

**Features:**
- ✅ Automatic Let's Encrypt SSL certificates
- ✅ Auto-renewal (no maintenance needed)
- ✅ Publicly trusted certificates
- ✅ Internet-accessible

**Access:** https://your-domain.com

**🔒 Security:** See [docs/SECURITY.md](./docs/SECURITY.md) for important production security guidelines, including:
- Port exposure protection
- Firewall configuration
- Cookie security
- HTTPS best practices

**📖 Detailed Setup:** See [docs/HTTPS_SETUP.md](./docs/HTTPS_SETUP.md) for complete instructions on DNS configuration, port forwarding, and troubleshooting.

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

- **Services won't start**: Check if ports are already in use
  ```bash
  docker compose ps
  docker compose logs
  ```
- **Can't connect from other devices**: Check firewall settings and ensure ports are open
- **Authentication issues**: Verify `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` are correctly set
- **Image upload issues**: Check MinIO is running and credentials are correct in `.env`

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

There are two ways to set up your local development environment:

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

### Option 1: Quick Start with Script (Recommended)

The easiest way to start development with live reload and automatic setup:

```bash
# Install dependencies
pnpm install

# Start all services (MongoDB, MinIO, API, Web) with live reload
./start-dev.sh
```

**What this script does:**

- ✅ Checks that pnpm and Docker are installed
- ✅ Verifies Docker is running
- ✅ Checks for port conflicts (3000, 3001, 9000, 9001, 27017)
- ✅ Installs project dependencies if needed
- ✅ Starts MongoDB and MinIO in the background
- ✅ Starts API and Web containers with live reload enabled
- ✅ Shows only API and Web logs in your console
- ✅ Gracefully stops all services on `Ctrl+C`

**Features:**

- 🔥 **Live reload** - Code changes trigger automatic reloads for both API (tsx watch) and Web (Next.js Turbopack)
- 🔍 **MongoDB exposed** - Connect MongoDB Compass to `mongodb://localhost:27017/famly` for database inspection
- 📦 **Containerized** - Everything runs in Docker, no need to install MongoDB or MinIO locally
- 🎯 **Clean logs** - Only see API and Web output, infrastructure logs are hidden

**Access:**

- Web Application: http://localhost:3000
- API: http://localhost:3001
- MongoDB: mongodb://localhost:27017/famly
- MinIO Console: http://localhost:9001 (credentials: `famly-dev-access` / `famly-dev-secret-min-32-chars`)

**Useful commands:**

```bash
# View logs from specific service
docker compose -f docker/compose.dev.yml logs -f api
docker compose -f docker/compose.dev.yml logs -f web

# Stop all services
docker compose -f docker/compose.dev.yml down

# Restart a specific service
docker compose -f docker/compose.dev.yml restart api
```

### Option 2: Manual Setup (Advanced)

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

## 🚀 Getting Started

[Coming soon - development in progress]

## 📸 Screenshots

[Coming soon - screenshots of the app interface]

## 🛠️ Development

### Prerequisites

- Node.js v16+
- React Native CLI
- Xcode (for iOS development)
- Android Studio (for Android development)

### Installation

```bash
git clone https://github.com/yourusername/famly.git
cd famly
npm install
```

### Running the App

For iOS:

```
npx react-native run-ios
```

For Android:

```
npx react-native run-android
```

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
