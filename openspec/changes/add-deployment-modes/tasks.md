# Implementation Tasks

## 1. Backend - Deployment Config Infrastructure
- [ ] 1.1 Create `DeploymentConfig` domain model in `src/modules/deployment-config/domain/deployment-config.ts`
- [ ] 1.2 Create `DeploymentConfigRepository` with CRUD operations in `src/modules/deployment-config/repositories/deployment-config.repository.ts`
- [ ] 1.3 Create `DeploymentConfigService` with business logic in `src/modules/deployment-config/services/deployment-config.service.ts`
- [ ] 1.4 Add deployment config seeding logic to `src/infra/mongo/client.ts` or new seed file
- [ ] 1.5 Add `DEPLOYMENT_MODE` to `src/config/env.ts` with validation (enum: 'saas' | 'standalone', default: 'saas')

## 2. Backend - Status Endpoint
- [ ] 2.1 Create status route at `src/routes/status.ts` with `GET /v1/status` endpoint (unauthenticated)
- [ ] 2.2 Register status router in `src/app.ts` alongside health endpoint
- [ ] 2.3 Write E2E test for status endpoint in `tests/e2e/status.e2e.test.ts`

## 3. Backend - Registration Blocking Logic
- [ ] 3.1 Modify `src/modules/auth/routes/register.route.ts` to check deployment config before registration
- [ ] 3.2 Return 403 with message "Registration is closed. Contact your family administrator to be added." when blocked
- [ ] 3.3 Write E2E test for registration blocking in standalone mode in `tests/e2e/auth/register.e2e.test.ts`
- [ ] 3.4 Write E2E test confirming registration works in standalone before onboarding complete
- [ ] 3.5 Write E2E test confirming registration always works in SaaS mode

## 4. Backend - Onboarding Completion Logic
- [ ] 4.1 Modify `src/modules/family/services/family.service.ts` to mark onboarding complete after first family creation in standalone mode
- [ ] 4.2 Write E2E test for onboarding completion in `tests/e2e/family/create-family.e2e.test.ts`
- [ ] 4.3 Write E2E test confirming family creation doesn't affect onboarding in SaaS mode

## 5. Frontend - Status Integration
- [ ] 5.1 Create API client function for `/v1/status` in `apps/web/src/lib/api/status.ts`
- [ ] 5.2 Add status check to landing page (`apps/web/app/page.tsx`) to redirect in standalone mode
- [ ] 5.3 Add status check to registration flow (`apps/web/app/get-started/`) to skip deployment selection in standalone mode
- [ ] 5.4 Update middleware or page logic to handle onboarding routing

## 6. Configuration & Documentation
- [ ] 6.1 Add `DEPLOYMENT_MODE=saas` to `.env.example` with documentation
- [ ] 6.2 Update `docker-compose.yml` to include `DEPLOYMENT_MODE` environment variable
- [ ] 6.3 Update README or docs with deployment mode explanation

## 7. Validation
- [ ] 7.1 Run all E2E tests: `pnpm test --runInBand`
- [ ] 7.2 Run lint: `pnpm run lint`
- [ ] 7.3 Manual testing: Start in standalone mode, complete onboarding, verify registration blocked
- [ ] 7.4 Manual testing: Start in SaaS mode, verify landing page and open registration work
