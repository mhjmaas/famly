# Implementation Tasks

1. [x] Review existing recipe module (domain, repository, routes, validators, tests) to understand current payloads and constraints.
2. [x] Update domain model, Mongo repository, and mapper so recipes persist optional `durationMinutes` (number | undefined).
3. [x] Extend create and update validators plus Zod schemas to accept optional duration, enforcing integer minutes between 1 and 1440.
4. [x] Propagate `durationMinutes` through services and HTTP routes (create, get, list, search, update) so API responses echo the stored value when present.
5. [x] Update associated unit and e2e tests (validators, repositories, create/list/search/update flows) to cover both valid durations and validation failures.
6. [x] Run relevant API unit + e2e suites (`pnpm --filter api test:unit` and `pnpm --filter api test:e2e`) and ensure they pass.
