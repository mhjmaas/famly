# Famly API

Express TypeScript API service for Famly providing user authentication and account management.

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB 7.0+
- Docker & Docker Compose (for local development)

### Setup

1. Copy environment template:
```bash
cp .env.example .env
```

2. Update `.env` with your configuration:
```
MONGODB_URI=mongodb://localhost:27017/famly
BETTER_AUTH_SECRET=your_auth_secret_min_32_chars
BETTER_AUTH_URL=http://localhost:3000
NODE_ENV=development
PORT=3000
```

3. Start MongoDB and API with Docker Compose:
```bash
docker-compose -f docker/compose.dev.yml up
```

4. Install dependencies:
```bash
pnpm install
```

## Development

### Scripts

- `npm run build` - Compile TypeScript
- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm test` - Run Jest test suite

### User profile fields

- Core fields stored on the Better Auth user document include `name`, `birthdate`, and `language` (supported values: `en-US`, `nl-NL`).
- Auth endpoints (`/v1/auth/register`, `/v1/auth/login`, `/v1/auth/me`) surface `user.language`; PATCH `/v1/auth/me` can update it for logged-in users.
