# Quickstart – User Authentication Foundations

## Prerequisites
- Docker Desktop 4.x (or compatible Docker Engine)  
- Node.js 20.x and pnpm 10.x (managed at repo root)  
- Copy `apps/api/.env.example` to `apps/api/.env` and adjust secrets as needed

## Environment Variables
Required in `apps/api/.env`:
- `MONGODB_URI` - MongoDB connection string (standalone or replica set)
- `BETTER_AUTH_SECRET` - Min 32 chars for JWT signing
- `BETTER_AUTH_URL` - API base URL (e.g., http://localhost:3000)

## First Run
1. Install dependencies: `pnpm install`  
2. Start MongoDB: `docker run --name mongodb-famly -d -p 27017:27017 mongo`  
3. Start the API in watch mode: `pnpm dev:api`  
4. Run E2E tests: `pnpm --filter api test:e2e`

## Verifying Authentication Flows

### Web Flow (Cookie-based)
- **Register**: `curl -i -X POST http://localhost:3000/v1/auth/register -H "Content-Type: application/json" -d '{"email":"web@example.com","password":"SecurePass123!"}'`  
- **Login**: `curl -i -X POST http://localhost:3000/v1/auth/login -H "Content-Type: application/json" -d '{"email":"web@example.com","password":"SecurePass123!"}'` (observe `Set-Cookie: better-auth.session_token`)  
- **Current User**: `curl -i http://localhost:3000/v1/auth/me -H "Cookie: better-auth.session_token=<copied-value>"`

### Mobile Flow (Bearer Token)
- **Register**: `curl -i -X POST http://localhost:3000/v1/auth/register -H "Content-Type: application/json" -d '{"email":"mobile@example.com","password":"SecurePass123!"}'` (observe `set-auth-token` header)  
- **Login**: `curl -i -X POST http://localhost:3000/v1/auth/login -H "Content-Type: application/json" -d '{"email":"mobile@example.com","password":"SecurePass123!"}'` (get token from response)  
- **Current User**: `curl -i http://localhost:3000/v1/auth/me -H "Authorization: Bearer <token>"`

### Health Check
- `curl http://localhost:3000/v1/health`

## Teardown
- Stop MongoDB: `docker stop mongodb-famly && docker rm mongodb-famly`
