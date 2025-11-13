# Implementation Tasks

## 1. Backend - Deployment Config Infrastructure
- [x] 1.1 Create `DeploymentConfig` domain model in `src/modules/deployment-config/domain/deployment-config.ts`
- [x] 1.2 Create `DeploymentConfigRepository` with CRUD operations in `src/modules/deployment-config/repositories/deployment-config.repository.ts`
- [x] 1.3 Create `DeploymentConfigService` with business logic in `src/modules/deployment-config/services/deployment-config.service.ts`
- [x] 1.4 Add deployment config seeding logic to `src/infra/mongo/client.ts` or new seed file
- [x] 1.5 Add `DEPLOYMENT_MODE` to `src/config/env.ts` with validation (enum: 'saas' | 'standalone', default: 'saas')

## 2. Backend - Status Endpoint
- [x] 2.1 Create status route at `src/routes/status.ts` with `GET /v1/status` endpoint (unauthenticated)
- [x] 2.2 Register status router in `src/app.ts` alongside health endpoint
- [x] 2.3 Write E2E test for status endpoint in `tests/e2e/status.e2e.test.ts`

## 3. Backend - Registration Blocking Logic
- [x] 3.1 Modify `src/modules/auth/routes/register.route.ts` to check deployment config before registration
- [x] 3.2 Return 403 with message "Registration is closed. Contact your family administrator to be added." when blocked
- [x] 3.3 Write E2E test for registration blocking in standalone mode in `tests/e2e/auth/register.e2e.test.ts`
- [x] 3.4 Write E2E test confirming registration works in standalone before onboarding complete
- [x] 3.5 Write E2E test confirming registration always works in SaaS mode

## 4. Backend - Onboarding Completion Logic
- [x] 4.1 Modify `src/modules/family/services/family.service.ts` to mark onboarding complete after first family creation in standalone mode
- [x] 4.2 Write E2E test for onboarding completion in `tests/e2e/family/create-family.e2e.test.ts`
- [x] 4.3 Write E2E test confirming family creation doesn't affect onboarding in SaaS mode

## 5. Frontend - Status Integration
- [x] 5.1 Create API client function for `/v1/status` in `apps/web/src/lib/status-client.ts`
- [x] 5.2 Add status check to landing page (`apps/web/src/app/[lang]/page.tsx`) to redirect in standalone mode
- [x] 5.3 Add status check to registration flow (`apps/web/src/app/[lang]/get-started/`) to skip deployment selection in standalone mode
- [x] 5.4 Update page logic to handle onboarding routing (completed via landing page and get-started redirects)

## 6. Configuration & Documentation
- [x] 6.1 Add `DEPLOYMENT_MODE=saas` to `.env.example` with documentation
- [x] 6.2 Update `docker-compose.yml` and test environment to include `DEPLOYMENT_MODE` environment variable
- [x] 6.3 Update README or docs with deployment mode explanation

## 7. Validation
- [x] 7.1 Run backend E2E tests: All 10 tests passing (status, registration blocking, onboarding completion)
- [x] 7.2 Run lint: Both API and Web linters passing (formatting auto-fixed)
- [x] 7.3 Manual testing: Start in standalone mode, complete onboarding, verify registration blocked
- [x] 7.4 Manual testing: Start in SaaS mode, verify landing page and open registration work
