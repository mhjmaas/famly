# Realtime Messaging Proposal

## Why

The current chat implementation provides REST-only endpoints for messaging. Users must poll for new messages, typing indicators, and read receipts—creating latency, poor UX, and unnecessary server load. A realtime messaging layer using Socket.IO will enable instant message delivery, presence awareness, and typing indicators while maintaining the existing REST API for backfill and initial data loading.

## What Changes

- **Add Socket.IO server integration** to the Express app for persistent WebSocket connections
- **Implement bidirectional event contracts** for message sending, room management, typing indicators, read receipts, and presence tracking
- **Add connection authentication** using JWT tokens or session tokens to secure Socket.IO connections
- **Implement idempotent message creation** via clientId to prevent duplicates during reconnects
- **Add presence tracking** with per-device online/offline status and throttled updates
- **Provide reconnection backfill strategy** using existing REST message listing endpoint
- **Add comprehensive e2e tests** for Socket.IO event flows using socket.io-client
- **Document event contracts** and client usage patterns in design.md

All changes are **additive**—no existing REST endpoints will be altered. REST continues to serve as the source of truth for historical data and backfill scenarios.

## Impact

- **Affected specs**: `chat` (adding realtime capabilities to existing chat spec)
- **Affected code**:
  - `apps/api/src/app.ts` - Integrate Socket.IO server
  - `apps/api/src/server.ts` - Attach Socket.IO to HTTP server
  - `apps/api/src/modules/chat/` - Add new realtime subdirectory for Socket.IO handlers
  - `apps/api/package.json` - Add socket.io dependency
  - `apps/api/tests/e2e/chat/` - Add Socket.IO integration tests
- **Dependencies**: Adds `socket.io` (~4.8.x) and `socket.io-client` (for testing)
- **Breaking changes**: None—purely additive feature
