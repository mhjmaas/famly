## 1. Implementation
- [x] 1.1 Review existing frontend notification dictionaries and mirror their keys/placeholders into backend-local dictionaries (no cross-package imports).
- [x] 1.2 Add backend localization helper to resolve supported language from user profile and provide default fallback.
- [x] 1.3 Update notification template builders to accept locale and interpolate localized title/body using the backend dictionaries.
- [x] 1.4 Ensure batch notification helpers fetch per-recipient language and send payloads in their language (with fallback for missing translations).
- [x] 1.5 Add automated tests covering language resolution, fallback, and multi-recipient localization for notification flows.
- [x] 1.6 Run validation: pnpm test && pnpm run lint. (Root lint now clean in both api and web; offline font fetch still blocks web build without network.)
