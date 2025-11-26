## 1. Implementation
- [x] 1.1 Add cascade logic to family member removal to clean up chat memberships and DMs.
- [x] 1.2 Ensure chat + membership + message deletions are atomic per chat and emit required events.
- [x] 1.3 Add/adjust repositories or service helpers for bulk chat cleanup.

## 2. Testing
- [x] 2.1 Add E2E test covering member removal from a group chat (membership removed, chat retained).
- [x] 2.2 Add E2E test covering DM deletion when one participant is removed (chat, messages, memberships deleted).
- [ ] 2.3 Run test suite subset (`pnpm test --filter e2e` or equivalent) and capture results. (Blocked locally: container runtime not available)
