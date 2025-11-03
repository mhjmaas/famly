<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Famly Project

## Project Overview

This is a monorepo project using pnpm workspaces.

## Development guidelines
Our core guiding principles are found in the `constitution.md` file.

## Active Technologies
- TypeScript 5.6 on Node.js 20 + Express 4, better-auth (bearer + JWT plugins), MongoDB Node driver, Zod, Winston (003-add-family-member)
- MongoDB (`famly` database via `infra/mongo/client`) (003-add-family-member)

## Recent Changes
- 003-add-family-member
- 002-add-family-management: Added TypeScript 5.6 (Node.js 20 runtime) + Express, better-auth (bearer + JWT plugins), MongoDB driver, Zod, Winston
- 001-add-user-auth: Added TypeScript 5.6 (Node.js 20 runtime)

## Project Structure

<!-- TREE START -->
```
.
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── apps
│   ├── api
│   │   ├── Dockerfile.test
│   │   ├── README.md
│   │   ├── biome.json
│   │   ├── docker
│   │   │   └── Dockerfile
│   │   ├── jest.config.e2e.js
│   │   ├── jest.config.js
│   │   ├── jest.config.unit.js
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── app.ts
│   │   │   ├── config
│   │   │   │   ├── env.ts
│   │   │   │   └── settings.ts
│   │   │   ├── infra
│   │   │   │   └── mongo
│   │   │   │       └── client.ts
│   │   │   ├── lib
│   │   │   │   ├── http-error.ts
│   │   │   │   └── logger.ts
│   │   │   ├── middleware
│   │   │   │   └── error-handler.ts
│   │   │   ├── modules
│   │   │   │   ├── activity-events
│   │   │   │   │   ├── domain
│   │   │   │   │   │   └── activity-event.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── lib
│   │   │   │   │   │   └── activity-event.mapper.ts
│   │   │   │   │   ├── repositories
│   │   │   │   │   │   └── activity-event.repository.ts
│   │   │   │   │   ├── routes
│   │   │   │   │   │   ├── activity-events.router.ts
│   │   │   │   │   │   └── list-events.route.ts
│   │   │   │   │   ├── services
│   │   │   │   │   │   └── activity-event.service.ts
│   │   │   │   │   └── validators
│   │   │   │   │       └── list-events.validator.ts
│   │   │   │   ├── auth
│   │   │   │   │   ├── better-auth.ts
│   │   │   │   │   ├── lib
│   │   │   │   │   │   ├── require-creator-ownership.ts
│   │   │   │   │   │   └── require-family-role.ts
│   │   │   │   │   ├── middleware
│   │   │   │   │   │   ├── authenticate.ts
│   │   │   │   │   │   ├── authorize-creator-ownership.ts
│   │   │   │   │   │   ├── authorize-family-role.ts
│   │   │   │   │   │   ├── index.ts
│   │   │   │   │   │   └── jwt-verify.ts
│   │   │   │   │   ├── repositories
│   │   │   │   │   ├── routes
│   │   │   │   │   │   ├── auth.router.ts
│   │   │   │   │   │   ├── login.route.ts
│   │   │   │   │   │   ├── me.route.ts
│   │   │   │   │   │   └── register.route.ts
│   │   │   │   │   └── validators
│   │   │   │   │       ├── login.validator.ts
│   │   │   │   │       └── register.validator.ts
│   │   │   │   ├── chat
│   │   │   │   │   ├── API.md
│   │   │   │   │   ├── domain
│   │   │   │   │   │   ├── chat.ts
│   │   │   │   │   │   ├── membership.ts
│   │   │   │   │   │   └── message.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── lib
│   │   │   │   │   │   ├── chat.mapper.ts
│   │   │   │   │   │   ├── membership.mapper.ts
│   │   │   │   │   │   └── message.mapper.ts
│   │   │   │   │   ├── middleware
│   │   │   │   │   │   ├── index.ts
│   │   │   │   │   │   ├── require-admin.ts
│   │   │   │   │   │   └── verify-membership.ts
│   │   │   │   │   ├── realtime
│   │   │   │   │   │   ├── README.md
│   │   │   │   │   │   ├── events
│   │   │   │   │   │   │   └── chat-events.ts
│   │   │   │   │   │   ├── handlers
│   │   │   │   │   │   │   ├── message.handler.ts
│   │   │   │   │   │   │   ├── presence.handler.ts
│   │   │   │   │   │   │   ├── receipt.handler.ts
│   │   │   │   │   │   │   ├── room.handler.ts
│   │   │   │   │   │   │   └── typing.handler.ts
│   │   │   │   │   │   ├── middleware
│   │   │   │   │   │   │   └── auth.middleware.ts
│   │   │   │   │   │   ├── presence
│   │   │   │   │   │   │   └── presence-tracker.ts
│   │   │   │   │   │   ├── register-handlers.ts
│   │   │   │   │   │   ├── socket-server.ts
│   │   │   │   │   │   ├── types.ts
│   │   │   │   │   │   └── utils
│   │   │   │   │   │       ├── error-handler.ts
│   │   │   │   │   │       ├── get-contacts.ts
│   │   │   │   │   │       └── rate-limiter.ts
│   │   │   │   │   ├── repositories
│   │   │   │   │   │   ├── chat.repository.ts
│   │   │   │   │   │   ├── membership.repository.ts
│   │   │   │   │   │   └── message.repository.ts
│   │   │   │   │   ├── routes
│   │   │   │   │   │   ├── add-members.route.ts
│   │   │   │   │   │   ├── chat.router.ts
│   │   │   │   │   │   ├── create-chat.route.ts
│   │   │   │   │   │   ├── create-message.route.ts
│   │   │   │   │   │   ├── get-chat.route.ts
│   │   │   │   │   │   ├── list-chats.route.ts
│   │   │   │   │   │   ├── list-messages.route.ts
│   │   │   │   │   │   ├── remove-member.route.ts
│   │   │   │   │   │   ├── search-messages.route.ts
│   │   │   │   │   │   └── update-read-cursor.route.ts
│   │   │   │   │   ├── services
│   │   │   │   │   │   ├── chat.service.ts
│   │   │   │   │   │   ├── membership.service.ts
│   │   │   │   │   │   └── message.service.ts
│   │   │   │   │   └── validators
│   │   │   │   │       ├── add-members.validator.ts
│   │   │   │   │       ├── create-chat.validator.ts
│   │   │   │   │       ├── create-message.validator.ts
│   │   │   │   │       ├── list-chats.validator.ts
│   │   │   │   │       ├── list-messages.validator.ts
│   │   │   │   │       ├── search-messages.validator.ts
│   │   │   │   │       └── update-read-cursor.validator.ts
│   │   │   │   ├── diary
│   │   │   │   │   ├── domain
│   │   │   │   │   │   └── diary-entry.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── lib
│   │   │   │   │   │   └── diary-entry.mapper.ts
│   │   │   │   │   ├── repositories
│   │   │   │   │   │   └── diary.repository.ts
│   │   │   │   │   ├── routes
│   │   │   │   │   │   ├── create-entry.route.ts
│   │   │   │   │   │   ├── delete-entry.route.ts
│   │   │   │   │   │   ├── diary.router.ts
│   │   │   │   │   │   ├── family
│   │   │   │   │   │   │   ├── create-entry.route.ts
│   │   │   │   │   │   │   ├── delete-entry.route.ts
│   │   │   │   │   │   │   ├── get-entry.route.ts
│   │   │   │   │   │   │   ├── list-entries.route.ts
│   │   │   │   │   │   │   └── update-entry.route.ts
│   │   │   │   │   │   ├── family-diary.router.ts
│   │   │   │   │   │   ├── get-entry.route.ts
│   │   │   │   │   │   ├── list-entries.route.ts
│   │   │   │   │   │   └── update-entry.route.ts
│   │   │   │   │   └── validators
│   │   │   │   │       ├── create-entry.validator.ts
│   │   │   │   │       └── update-entry.validator.ts
│   │   │   │   ├── family
│   │   │   │   │   ├── domain
│   │   │   │   │   │   └── family.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── lib
│   │   │   │   │   │   └── family.mapper.ts
│   │   │   │   │   ├── repositories
│   │   │   │   │   │   ├── family-membership.repository.ts
│   │   │   │   │   │   └── family.repository.ts
│   │   │   │   │   ├── routes
│   │   │   │   │   │   ├── add-member.route.ts
│   │   │   │   │   │   ├── create-family.route.ts
│   │   │   │   │   │   ├── families.route.ts
│   │   │   │   │   │   ├── get-member-karma.route.ts
│   │   │   │   │   │   ├── index.ts
│   │   │   │   │   │   ├── list-families.route.ts
│   │   │   │   │   │   └── remove-member.route.ts
│   │   │   │   │   ├── services
│   │   │   │   │   │   └── family.service.ts
│   │   │   │   │   └── validators
│   │   │   │   │       ├── add-family-member.validator.ts
│   │   │   │   │       └── create-family.validator.ts
│   │   │   │   ├── karma
│   │   │   │   │   ├── README.md
│   │   │   │   │   ├── domain
│   │   │   │   │   │   └── karma.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── lib
│   │   │   │   │   │   └── karma.mapper.ts
│   │   │   │   │   ├── repositories
│   │   │   │   │   │   └── karma.repository.ts
│   │   │   │   │   ├── routes
│   │   │   │   │   │   ├── get-balance.route.ts
│   │   │   │   │   │   ├── get-history.route.ts
│   │   │   │   │   │   ├── grant-karma.route.ts
│   │   │   │   │   │   └── karma.router.ts
│   │   │   │   │   ├── services
│   │   │   │   │   │   └── karma.service.ts
│   │   │   │   │   └── validators
│   │   │   │   │       └── grant-karma.validator.ts
│   │   │   │   ├── recipes
│   │   │   │   │   ├── domain
│   │   │   │   │   │   └── recipe.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── init.ts
│   │   │   │   │   ├── lib
│   │   │   │   │   │   └── recipe.mapper.ts
│   │   │   │   │   ├── middleware
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   ├── repositories
│   │   │   │   │   │   └── recipe.repository.ts
│   │   │   │   │   ├── routes
│   │   │   │   │   │   ├── create-recipe.route.ts
│   │   │   │   │   │   ├── delete-recipe.route.ts
│   │   │   │   │   │   ├── get-recipe.route.ts
│   │   │   │   │   │   ├── list-recipes.route.ts
│   │   │   │   │   │   ├── recipes.router.ts
│   │   │   │   │   │   ├── search-recipes.route.ts
│   │   │   │   │   │   └── update-recipe.route.ts
│   │   │   │   │   ├── services
│   │   │   │   │   │   └── recipe.service.ts
│   │   │   │   │   └── validators
│   │   │   │   │       ├── create-recipe.validator.ts
│   │   │   │   │       ├── list-recipes.validator.ts
│   │   │   │   │       ├── search-recipes.validator.ts
│   │   │   │   │       └── update-recipe.validator.ts
│   │   │   │   ├── rewards
│   │   │   │   │   ├── README.md
│   │   │   │   │   ├── domain
│   │   │   │   │   │   └── reward.ts
│   │   │   │   │   ├── hooks
│   │   │   │   │   │   └── claim-completion.hook.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── init.ts
│   │   │   │   │   ├── lib
│   │   │   │   │   │   └── reward.mapper.ts
│   │   │   │   │   ├── repositories
│   │   │   │   │   │   ├── claim.repository.ts
│   │   │   │   │   │   ├── metadata.repository.ts
│   │   │   │   │   │   └── reward.repository.ts
│   │   │   │   │   ├── routes
│   │   │   │   │   │   ├── cancel-claim.route.ts
│   │   │   │   │   │   ├── claim-reward.route.ts
│   │   │   │   │   │   ├── create-reward.route.ts
│   │   │   │   │   │   ├── delete-reward.route.ts
│   │   │   │   │   │   ├── get-claim.route.ts
│   │   │   │   │   │   ├── get-reward.route.ts
│   │   │   │   │   │   ├── list-claims.route.ts
│   │   │   │   │   │   ├── list-rewards.route.ts
│   │   │   │   │   │   ├── rewards.router.ts
│   │   │   │   │   │   ├── toggle-favourite.route.ts
│   │   │   │   │   │   └── update-reward.route.ts
│   │   │   │   │   ├── services
│   │   │   │   │   │   ├── claim.service.ts
│   │   │   │   │   │   └── reward.service.ts
│   │   │   │   │   └── validators
│   │   │   │   │       ├── claim-reward.validator.ts
│   │   │   │   │       ├── create-reward.validator.ts
│   │   │   │   │       └── update-reward.validator.ts
│   │   │   │   ├── shopping-lists
│   │   │   │   │   ├── domain
│   │   │   │   │   │   └── shopping-list.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── lib
│   │   │   │   │   │   └── shopping-list.mapper.ts
│   │   │   │   │   ├── repositories
│   │   │   │   │   │   └── shopping-list.repository.ts
│   │   │   │   │   ├── routes
│   │   │   │   │   │   ├── add-item.route.ts
│   │   │   │   │   │   ├── create-list.route.ts
│   │   │   │   │   │   ├── delete-item.route.ts
│   │   │   │   │   │   ├── delete-list.route.ts
│   │   │   │   │   │   ├── get-list.route.ts
│   │   │   │   │   │   ├── list-lists.route.ts
│   │   │   │   │   │   ├── shopping-lists.router.ts
│   │   │   │   │   │   ├── update-item.route.ts
│   │   │   │   │   │   └── update-list.route.ts
│   │   │   │   │   ├── services
│   │   │   │   │   │   └── shopping-list.service.ts
│   │   │   │   │   └── validators
│   │   │   │   │       ├── add-item.validator.ts
│   │   │   │   │       ├── create-list.validator.ts
│   │   │   │   │       ├── update-item.validator.ts
│   │   │   │   │       └── update-list.validator.ts
│   │   │   │   └── tasks
│   │   │   │       ├── domain
│   │   │   │       │   ├── task-schedule.ts
│   │   │   │       │   └── task.ts
│   │   │   │       ├── hooks
│   │   │   │       │   ├── activity-event.hook.ts
│   │   │   │       │   └── task-completion.hook.ts
│   │   │   │       ├── index.ts
│   │   │   │       ├── lib
│   │   │   │       │   ├── schedule-matcher.ts
│   │   │   │       │   ├── task-schedule.mapper.ts
│   │   │   │       │   ├── task-scheduler.ts
│   │   │   │       │   └── task.mapper.ts
│   │   │   │       ├── repositories
│   │   │   │       │   ├── schedule.repository.ts
│   │   │   │       │   └── task.repository.ts
│   │   │   │       ├── routes
│   │   │   │       │   ├── create-schedule.route.ts
│   │   │   │       │   ├── create-task.route.ts
│   │   │   │       │   ├── delete-schedule.route.ts
│   │   │   │       │   ├── delete-task.route.ts
│   │   │   │       │   ├── get-schedule.route.ts
│   │   │   │       │   ├── get-task.route.ts
│   │   │   │       │   ├── list-schedules.route.ts
│   │   │   │       │   ├── list-tasks.route.ts
│   │   │   │       │   ├── tasks.router.ts
│   │   │   │       │   ├── update-schedule.route.ts
│   │   │   │       │   └── update-task.route.ts
│   │   │   │       ├── services
│   │   │   │       │   ├── schedule.service.ts
│   │   │   │       │   ├── task-generator.service.ts
│   │   │   │       │   ├── task.service.instance.ts
│   │   │   │       │   └── task.service.ts
│   │   │   │       └── validators
│   │   │   │           ├── create-schedule.validator.ts
│   │   │   │           ├── create-task.validator.ts
│   │   │   │           ├── update-schedule.validator.ts
│   │   │   │           └── update-task.validator.ts
│   │   │   ├── routes
│   │   │   │   └── health.ts
│   │   │   └── server.ts
│   │   ├── tests
│   │   │   ├── e2e
│   │   │   │   ├── activity-events
│   │   │   │   │   ├── list-events.e2e.test.ts
│   │   │   │   │   └── task-integration.e2e.test.ts
│   │   │   │   ├── auth
│   │   │   │   │   ├── login.e2e.test.ts
│   │   │   │   │   ├── me.e2e.test.ts
│   │   │   │   │   └── register.e2e.test.ts
│   │   │   │   ├── chat
│   │   │   │   │   ├── add-members.e2e.test.ts
│   │   │   │   │   ├── authorization.e2e.test.ts
│   │   │   │   │   ├── create-dm.e2e.test.ts
│   │   │   │   │   ├── create-group.e2e.test.ts
│   │   │   │   │   ├── create-message.e2e.test.ts
│   │   │   │   │   ├── get-chat.e2e.test.ts
│   │   │   │   │   ├── list-chats.e2e.test.ts
│   │   │   │   │   ├── list-messages.e2e.test.ts
│   │   │   │   │   ├── realtime
│   │   │   │   │   │   ├── auth.e2e.test.ts
│   │   │   │   │   │   ├── chat-update.e2e.test.ts
│   │   │   │   │   │   ├── errors.e2e.test.ts
│   │   │   │   │   │   ├── message-send.e2e.test.ts
│   │   │   │   │   │   ├── presence.e2e.test.ts
│   │   │   │   │   │   ├── read-receipt.e2e.test.ts
│   │   │   │   │   │   ├── reconnection.e2e.test.ts
│   │   │   │   │   │   ├── room-join.e2e.test.ts
│   │   │   │   │   │   ├── room-leave.e2e.test.ts
│   │   │   │   │   │   └── typing.e2e.test.ts
│   │   │   │   │   ├── remove-member.e2e.test.ts
│   │   │   │   │   ├── search-messages.e2e.test.ts
│   │   │   │   │   └── update-read-cursor.e2e.test.ts
│   │   │   │   ├── diary
│   │   │   │   │   ├── authorization.e2e.test.ts
│   │   │   │   │   ├── create-entry.e2e.test.ts
│   │   │   │   │   ├── delete-entry.e2e.test.ts
│   │   │   │   │   ├── family
│   │   │   │   │   │   ├── authorization.e2e.test.ts
│   │   │   │   │   │   ├── create-entry.e2e.test.ts
│   │   │   │   │   │   ├── delete-entry.e2e.test.ts
│   │   │   │   │   │   ├── get-entry.e2e.test.ts
│   │   │   │   │   │   ├── list-entries.e2e.test.ts
│   │   │   │   │   │   └── update-entry.e2e.test.ts
│   │   │   │   │   ├── get-entry.e2e.test.ts
│   │   │   │   │   ├── list-entries.e2e.test.ts
│   │   │   │   │   └── update-entry.e2e.test.ts
│   │   │   │   ├── family
│   │   │   │   │   ├── add-child-member.e2e.test.ts
│   │   │   │   │   ├── add-member-authorization.e2e.test.ts
│   │   │   │   │   ├── add-parent-member.e2e.test.ts
│   │   │   │   │   ├── create-family.e2e.test.ts
│   │   │   │   │   ├── list-families.e2e.test.ts
│   │   │   │   │   ├── remove-member.e2e.test.ts
│   │   │   │   │   ├── remove-non-parent.e2e.test.ts
│   │   │   │   │   └── remove-parent-guard.e2e.test.ts
│   │   │   │   ├── health.e2e.test.ts
│   │   │   │   ├── helpers
│   │   │   │   │   ├── auth-setup.ts
│   │   │   │   │   ├── authorization-matrix.ts
│   │   │   │   │   ├── database.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── request-assertions.ts
│   │   │   │   │   ├── socket-client.ts
│   │   │   │   │   ├── test-app.ts
│   │   │   │   │   ├── test-data-factory.ts
│   │   │   │   │   ├── test-scenarios.ts
│   │   │   │   │   └── token-manager.ts
│   │   │   │   ├── karma
│   │   │   │   │   ├── authorization.e2e.test.ts
│   │   │   │   │   ├── get-balance.e2e.test.ts
│   │   │   │   │   ├── get-history.e2e.test.ts
│   │   │   │   │   ├── grant-karma.e2e.test.ts
│   │   │   │   │   └── task-integration.e2e.test.ts
│   │   │   │   ├── recipes
│   │   │   │   │   ├── authorization.e2e.test.ts
│   │   │   │   │   ├── create-recipe.e2e.test.ts
│   │   │   │   │   ├── delete-recipe.e2e.test.ts
│   │   │   │   │   ├── get-recipe.e2e.test.ts
│   │   │   │   │   ├── list-recipes.e2e.test.ts
│   │   │   │   │   ├── search-recipes.e2e.test.ts
│   │   │   │   │   └── update-recipe.e2e.test.ts
│   │   │   │   ├── rewards
│   │   │   │   │   ├── authorization.e2e.test.ts
│   │   │   │   │   ├── claim-cancellation.e2e.test.ts
│   │   │   │   │   ├── claim-workflow.e2e.test.ts
│   │   │   │   │   ├── edge-cases.e2e.test.ts
│   │   │   │   │   ├── favourite.e2e.test.ts
│   │   │   │   │   ├── insufficient-karma.e2e.test.ts
│   │   │   │   │   └── reward-crud.e2e.test.ts
│   │   │   │   ├── setup
│   │   │   │   │   └── testcontainers-setup.ts
│   │   │   │   ├── shopping-lists
│   │   │   │   │   ├── add-item.e2e.test.ts
│   │   │   │   │   ├── authorization.e2e.test.ts
│   │   │   │   │   ├── create-list.e2e.test.ts
│   │   │   │   │   ├── delete-item.e2e.test.ts
│   │   │   │   │   ├── delete-list.e2e.test.ts
│   │   │   │   │   ├── get-list.e2e.test.ts
│   │   │   │   │   ├── list-lists.e2e.test.ts
│   │   │   │   │   ├── update-item.e2e.test.ts
│   │   │   │   │   └── update-list.e2e.test.ts
│   │   │   │   └── tasks
│   │   │   │       ├── create-schedule.e2e.test.ts
│   │   │   │       ├── create-task.e2e.test.ts
│   │   │   │       ├── delete-schedule.e2e.test.ts
│   │   │   │       ├── delete-task.e2e.test.ts
│   │   │   │       ├── get-schedule.e2e.test.ts
│   │   │   │       ├── get-task.e2e.test.ts
│   │   │   │       ├── list-schedules.e2e.test.ts
│   │   │   │       ├── list-tasks.e2e.test.ts
│   │   │   │       ├── update-schedule.e2e.test.ts
│   │   │   │       └── update-task.e2e.test.ts
│   │   │   ├── setup
│   │   │   │   ├── global-setup.ts
│   │   │   │   ├── global-teardown.ts
│   │   │   │   └── jest-setup.ts
│   │   │   ├── tsconfig.json
│   │   │   └── unit
│   │   │       ├── activity-events
│   │   │       │   ├── activity-event.mapper.test.ts
│   │   │       │   └── activity-event.service.test.ts
│   │   │       ├── auth
│   │   │       │   ├── require-creator-ownership.test.ts
│   │   │       │   └── require-family-role.test.ts
│   │   │       ├── chat
│   │   │       │   ├── auth.middleware.test.ts
│   │   │       │   ├── chat.mapper.test.ts
│   │   │       │   ├── chat.service.test.ts
│   │   │       │   ├── create-chat.validator.test.ts
│   │   │       │   ├── create-message.validator.test.ts
│   │   │       │   ├── error-handler.test.ts
│   │   │       │   ├── list-chats.validator.test.ts
│   │   │       │   ├── membership.mapper.test.ts
│   │   │       │   ├── message.handler.test.ts
│   │   │       │   ├── message.mapper.test.ts
│   │   │       │   ├── presence-tracker.test.ts
│   │   │       │   ├── presence.handler.test.ts
│   │   │       │   ├── rate-limiter.test.ts
│   │   │       │   ├── receipt.handler.test.ts
│   │   │       │   ├── register-handlers.test.ts
│   │   │       │   ├── room.handler.test.ts
│   │   │       │   ├── socket-client.test.ts
│   │   │       │   ├── socket-server.test.ts
│   │   │       │   └── typing.handler.test.ts
│   │   │       ├── diary
│   │   │       │   ├── create-entry.validator.test.ts
│   │   │       │   ├── diary-entry.mapper.test.ts
│   │   │       │   └── update-entry.validator.test.ts
│   │   │       ├── family
│   │   │       │   ├── README.md
│   │   │       │   ├── add-family-member.validator.test.ts
│   │   │       │   └── create-family.validator.test.ts
│   │   │       ├── karma
│   │   │       │   ├── grant-karma.validator.test.ts
│   │   │       │   ├── karma.mapper.test.ts
│   │   │       │   ├── karma.repository.test.ts
│   │   │       │   └── karma.service.test.ts
│   │   │       ├── lib
│   │   │       │   └── http-error.test.ts
│   │   │       ├── recipes
│   │   │       │   ├── recipe.mapper.test.ts
│   │   │       │   ├── recipe.repository.test.ts
│   │   │       │   ├── recipe.service.test.ts
│   │   │       │   └── validators.test.ts
│   │   │       ├── rewards
│   │   │       │   ├── claim.repository.test.ts
│   │   │       │   ├── metadata.repository.test.ts
│   │   │       │   └── reward.repository.test.ts
│   │   │       ├── shopping-lists
│   │   │       │   ├── add-item.validator.test.ts
│   │   │       │   ├── create-list.validator.test.ts
│   │   │       │   ├── shopping-list.mapper.test.ts
│   │   │       │   ├── update-item.validator.test.ts
│   │   │       │   └── update-list.validator.test.ts
│   │   │       └── tasks
│   │   │           ├── create-schedule.validator.test.ts
│   │   │           ├── create-task.validator.test.ts
│   │   │           ├── schedule-matcher.test.ts
│   │   │           ├── task-completion.hook.test.ts
│   │   │           ├── task-schedule.mapper.test.ts
│   │   │           ├── task.mapper.test.ts
│   │   │           ├── update-schedule.validator.test.ts
│   │   │           └── update-task.validator.test.ts
│   │   ├── tsconfig.json
│   │   └── tsconfig.spec.json
│   └── web
│       ├── Dockerfile.test
│       ├── README.md
│       ├── biome.json
│       ├── components.json
│       ├── next-env.d.ts
│       ├── next.config.ts
│       ├── package.json
│       ├── playwright.config.ts
│       ├── postcss.config.mjs
│       ├── public
│       │   ├── file.svg
│       │   ├── globe.svg
│       │   ├── next.svg
│       │   ├── vercel.svg
│       │   └── window.svg
│       ├── src
│       │   ├── app
│       │   │   ├── [lang]
│       │   │   │   ├── app
│       │   │   │   │   ├── ai-settings
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── calendar
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── chat
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── diary
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── family
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── locations
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── memories
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── rewards
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── settings
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── shopping-lists
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   └── tasks
│       │   │   │   │       └── page.tsx
│       │   │   │   ├── get-started
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── layout.tsx
│       │   │   │   ├── page.tsx
│       │   │   │   └── signin
│       │   │   │       └── page.tsx
│       │   │   ├── favicon.ico
│       │   │   ├── globals.css
│       │   │   └── layout.tsx
│       │   ├── components
│       │   │   ├── auth
│       │   │   │   ├── get-started-flow.tsx
│       │   │   │   ├── registration-form.tsx
│       │   │   │   └── signin-form.tsx
│       │   │   ├── landing
│       │   │   │   ├── features.tsx
│       │   │   │   ├── footer.tsx
│       │   │   │   ├── hero.tsx
│       │   │   │   ├── navigation.tsx
│       │   │   │   ├── pricing.tsx
│       │   │   │   └── privacy.tsx
│       │   │   ├── language-selector.tsx
│       │   │   ├── layouts
│       │   │   │   └── dashboard-layout.tsx
│       │   │   ├── theme-provider.tsx
│       │   │   ├── theme-toggle.tsx
│       │   │   └── ui
│       │   │       ├── alert.tsx
│       │   │       ├── badge.tsx
│       │   │       ├── button.tsx
│       │   │       ├── card.tsx
│       │   │       ├── collapsible.tsx
│       │   │       ├── input.tsx
│       │   │       ├── label.tsx
│       │   │       ├── progress.tsx
│       │   │       ├── scroll-area.tsx
│       │   │       └── sheet.tsx
│       │   ├── dictionaries
│       │   │   ├── en-US.json
│       │   │   ├── index.ts
│       │   │   └── nl-NL.json
│       │   ├── i18n
│       │   │   ├── config.ts
│       │   │   └── types.ts
│       │   ├── lib
│       │   │   ├── api-client.ts
│       │   │   └── utils.ts
│       │   ├── proxy.ts
│       │   ├── static-data
│       │   │   └── features.ts
│       │   └── types
│       ├── tests
│       │   ├── e2e
│       │   │   ├── accessibility
│       │   │   │   └── a11y.spec.ts
│       │   │   ├── app
│       │   │   │   └── dashboard-navigation.spec.ts
│       │   │   ├── auth
│       │   │   │   ├── protected-routes.spec.ts
│       │   │   │   ├── registration.spec.ts
│       │   │   │   └── signin.spec.ts
│       │   │   ├── global-setup.ts
│       │   │   ├── global-teardown.ts
│       │   │   ├── landing
│       │   │   │   ├── features.spec.ts
│       │   │   │   ├── footer.spec.ts
│       │   │   │   ├── full-page.spec.ts
│       │   │   │   ├── hero.spec.ts
│       │   │   │   ├── language-switching.spec.ts
│       │   │   │   ├── navigation.spec.ts
│       │   │   │   ├── pricing.spec.ts
│       │   │   │   └── privacy.spec.ts
│       │   │   ├── pages
│       │   │   │   ├── auth.page.ts
│       │   │   │   ├── dashboard.page.ts
│       │   │   │   └── landing.page.ts
│       │   │   ├── performance
│       │   │   │   └── performance.spec.ts
│       │   │   ├── responsive
│       │   │   │   ├── mobile.spec.ts
│       │   │   │   └── tablet.spec.ts
│       │   │   └── setup
│       │   │       ├── docker-setup.ts
│       │   │       └── test-helpers.ts
│       │   └── example.spec.ts
│       └── tsconfig.json
├── bruno
│   └── Famly
│       ├── activity-events
│       │   └── List Activity Events.bru
│       ├── auth
│       │   ├── folder.bru
│       │   ├── login.bru
│       │   ├── me.bru
│       │   ├── refresh.bru
│       │   └── signup.bru
│       ├── bruno.json
│       ├── chat
│       │   ├── add-members.bru
│       │   ├── create-dm.bru
│       │   ├── create-group.bru
│       │   ├── create-message.bru
│       │   ├── get-chat.bru
│       │   ├── list-chats.bru
│       │   ├── list-messages.bru
│       │   ├── remove-member.bru
│       │   ├── search-messages.bru
│       │   └── update-read-cursor.bru
│       ├── diary
│       │   ├── create entry.bru
│       │   ├── delete entry.bru
│       │   ├── folder.bru
│       │   ├── get entry.bru
│       │   ├── list entries.bru
│       │   └── update entry.bru
│       ├── environments
│       │   └── local.bru
│       ├── family
│       │   ├── add member.bru
│       │   ├── create.bru
│       │   ├── delete member.bru
│       │   ├── folder.bru
│       │   └── get all.bru
│       ├── family diary
│       │   ├── create-entry.bru
│       │   ├── delete-entry.bru
│       │   ├── folder.bru
│       │   ├── get-entry.bru
│       │   ├── list-entries.bru
│       │   └── update-entry.bru
│       ├── karma
│       │   ├── folder.bru
│       │   ├── get-balance.bru
│       │   ├── get-history.bru
│       │   └── grant-karma.bru
│       ├── recipes
│       │   ├── create-recipe.bru
│       │   ├── delete-recipe.bru
│       │   ├── folder.bru
│       │   ├── get-recipe.bru
│       │   ├── list-recipes.bru
│       │   ├── search-recipes.bru
│       │   └── update-recipe.bru
│       ├── rewards
│       │   ├── cancel-claim.bru
│       │   ├── claim-reward.bru
│       │   ├── create-reward.bru
│       │   ├── delete-reward.bru
│       │   ├── folder.bru
│       │   ├── get-claim.bru
│       │   ├── get-reward.bru
│       │   ├── list-claims.bru
│       │   ├── list-rewards.bru
│       │   ├── toggle-favourite.bru
│       │   └── update-reward.bru
│       ├── shopping list
│       │   ├── add item.bru
│       │   ├── create list.bru
│       │   ├── delete item.bru
│       │   ├── delete list.bru
│       │   ├── folder.bru
│       │   ├── get list.bru
│       │   ├── list lists.bru
│       │   ├── update item.bru
│       │   └── update list.bru
│       └── tasks
│           ├── complete-task.bru
│           ├── create-schedule.bru
│           ├── create-task-with-karma.bru
│           ├── create-task.bru
│           ├── delete-schedule.bru
│           ├── delete-task.bru
│           ├── folder.bru
│           ├── get-task.bru
│           ├── list-schedules.bru
│           ├── list-tasks.bru
│           ├── update-schedule.bru
│           └── update-task.bru
├── constitution.md
├── docker
│   ├── compose.dev.yml
│   ├── compose.test.yml
│   └── scripts
├── openspec
│   ├── AGENTS.md
│   ├── changes
│   ├── project.md
│   └── specs
│       ├── activity-events
│       │   └── spec.md
│       ├── auth
│       │   └── spec.md
│       ├── chat
│       │   └── spec.md
│       ├── diary
│       │   └── spec.md
│       ├── family
│       │   └── spec.md
│       ├── karma
│       │   └── spec.md
│       ├── landing-page
│       │   └── spec.md
│       ├── recipes
│       │   └── spec.md
│       ├── rewards
│       │   └── spec.md
│       ├── shopping-lists
│       │   └── spec.md
│       ├── tasks
│       │   └── spec.md
│       ├── web-auth
│       │   └── spec.md
│       └── web-dashboard
│           └── spec.md
├── package.json
├── packages
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── reference
│   └── v0-famly
│       ├── README.md
│       ├── app
│       │   ├── api
│       │   │   └── chat
│       │   │       └── route.ts
│       │   ├── app
│       │   │   ├── ai-settings
│       │   │   │   └── page.tsx
│       │   │   ├── chat
│       │   │   │   └── page.tsx
│       │   │   ├── diary
│       │   │   │   └── page.tsx
│       │   │   ├── family
│       │   │   │   └── page.tsx
│       │   │   ├── locations
│       │   │   │   └── page.tsx
│       │   │   ├── memories
│       │   │   │   └── page.tsx
│       │   │   ├── page.tsx
│       │   │   ├── rewards
│       │   │   │   └── page.tsx
│       │   │   ├── settings
│       │   │   │   └── page.tsx
│       │   │   ├── shopping-lists
│       │   │   │   └── page.tsx
│       │   │   └── tasks
│       │   │       └── page.tsx
│       │   ├── get-started
│       │   │   └── page.tsx
│       │   ├── globals.css
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── signin
│       │       └── page.tsx
│       ├── components
│       │   ├── ai-settings-view.tsx
│       │   ├── chat-view.tsx
│       │   ├── dashboard-layout.tsx
│       │   ├── dashboard-overview.tsx
│       │   ├── diary-view.tsx
│       │   ├── family-view.tsx
│       │   ├── features.tsx
│       │   ├── footer.tsx
│       │   ├── get-started-flow.tsx
│       │   ├── hero.tsx
│       │   ├── language-selector.tsx
│       │   ├── locations-view.tsx
│       │   ├── memories-view.tsx
│       │   ├── navigation.tsx
│       │   ├── pricing.tsx
│       │   ├── privacy.tsx
│       │   ├── profile-view.tsx
│       │   ├── rewards-view.tsx
│       │   ├── shopping-lists-view.tsx
│       │   ├── signin-form.tsx
│       │   ├── tasks-view.tsx
│       │   ├── theme-provider.tsx
│       │   ├── theme-toggle.tsx
│       │   └── ui
│       │       ├── alert-dialog.tsx
│       │       ├── alert.tsx
│       │       ├── avatar.tsx
│       │       ├── badge.tsx
│       │       ├── button.tsx
│       │       ├── calendar.tsx
│       │       ├── card.tsx
│       │       ├── checkbox.tsx
│       │       ├── collapsible.tsx
│       │       ├── dialog.tsx
│       │       ├── dropdown-menu.tsx
│       │       ├── input.tsx
│       │       ├── label.tsx
│       │       ├── popover.tsx
│       │       ├── progress.tsx
│       │       ├── radio-group.tsx
│       │       ├── scroll-area.tsx
│       │       ├── select.tsx
│       │       ├── sheet.tsx
│       │       ├── tabs.tsx
│       │       ├── textarea.tsx
│       │       ├── toast.tsx
│       │       └── toaster.tsx
│       ├── components.json
│       ├── hooks
│       │   └── use-toast.ts
│       ├── lib
│       │   └── utils.ts
│       ├── next.config.mjs
│       ├── package.json
│       ├── pnpm-lock.yaml
│       ├── postcss.config.mjs
│       ├── public
│       │   ├── beach-sunset.png
│       │   ├── dinner-food-reward.jpg
│       │   ├── family-dinner.png
│       │   ├── money-reward-euro.jpg
│       │   ├── movie-night-popcorn.jpg
│       │   ├── placeholder-logo.png
│       │   ├── placeholder-logo.svg
│       │   ├── placeholder-user.jpg
│       │   ├── placeholder.jpg
│       │   ├── placeholder.svg
│       │   ├── sandcastle.jpg
│       │   └── screen-time-reward.jpg
│       ├── styles
│       │   └── globals.css
│       └── tsconfig.json
└── scripts
    ├── update-claude-tree.sh
    └── update-codex-tree.sh

217 directories, 658 files
```
<!-- TREE END -->

## Development

### Scripts

- `pnpm run claude` - Update project tree and open Claude
- `pnpm run update:claude:tree` - Update the project tree in this file

### Task management

We track work in Beads instead of Markdown. Run \`bd quickstart\` to see how.

### Document writing

You will not write summary markdown documents unless you are explicitly asked to by the user.
