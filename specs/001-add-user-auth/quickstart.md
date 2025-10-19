# Quickstart – User Authentication Foundations

## Prerequisites
- Docker Desktop 4.x (or compatible Docker Engine + Compose v2)  
- Node.js 20.x and pnpm 10.x (managed at repo root)  
- Copy `apps/api/.env.example` to `.env` (to be delivered with implementation) and adjust secrets as needed

## First Run
1. Install dependencies: `pnpm install`  
2. Start infrastructure: `docker compose -f docker/compose.dev.yml up -d`  
3. Build the API (optional for dev): `pnpm --filter api build`  
4. Start the API in watch mode: `pnpm dev:api`  
5. Run automated tests (ensures auth flows stay validated): `pnpm test:api`

## Verifying Authentication Flows
- **Register**: `curl -i -X POST http://localhost:3000/v1/auth/register -H "Content-Type: application/json" -d '{"email":"new.user@example.com","password":"hunter2025"}'`  
- **Login**: `curl -i -X POST http://localhost:3000/v1/auth/login -H "Content-Type: application/json" -d '{"email":"new.user@example.com","password":"hunter2025"}'` (observe `Set-Cookie`)  
- **Current User**: `curl -i http://localhost:3000/v1/auth/me -H "Cookie: famly_session=<copied-value>"`  
- **Health Check**: `curl http://localhost:3000/v1/health` (sanity check existing endpoint)

## Teardown
- Stop services: `docker compose -f docker/compose.dev.yml down`  
- Remove volumes (if you want a clean Mongo state): `docker compose -f docker/compose.dev.yml down -v`
