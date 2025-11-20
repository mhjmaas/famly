# Famly Web

Next.js 16 App Router project for the Famly marketing site and public surfaces. The app now ships with built-in internationalization (i18n) that serves localized routes for `en-US` and `nl-NL` using sub-path routing (`/<locale>`).

## Getting Started

```bash
pnpm install
pnpm --filter web dev
```

The dev server is available at [http://localhost:3000](http://localhost:3000). Visiting `/` automatically redirects to the best matching locale based on the `Accept-Language` header.

## Project Structure

```
src/
  app/
    [lang]/          # locale-scoped routes
      layout.tsx     # awaits params (Next.js 16) and loads locale dictionary
      page.tsx       # landing page composed from localized components
    globals.css
  components/        # UI and landing components
  dictionaries/      # locale dictionaries (feature-scoped JSON + merge indexes)
  i18n/              # locale config and types
  proxy.ts      # locale detection + redirect proxy
```

## Dictionary Conventions

- Source-of-truth dictionaries live in `src/dictionaries/<locale>/` as feature-scoped JSON fragments merged by `src/dictionaries/<locale>/index.ts`.
- Each dictionary must share the same shape. Types are generated from the merged `en-US` dictionary (`Dictionary` in `src/i18n/types.ts`).
- Nested objects group copy by section (`navigation`, `hero`, `features`, `dashboard.pages.tasks`, etc.).
- HTML markup should be avoided—when needed (e.g. `<strong>` emphasis) keep it minimal and render with `dangerouslySetInnerHTML`.

### Adding Translation Keys

1. Add the key to the appropriate fragment under `src/dictionaries/en-US/` (or create a new fragment if needed) and ensure it merges correctly.
2. Mirror the key in every locale dictionary with translated text.
3. Update component props and TypeScript types if you introduce a new dictionary section.
4. Run `pnpm --filter web lint` to ensure formatting and type-safety hold.

### Adding a New Locale

1. Update `src/i18n/config.ts` to include the new locale in `i18n.locales` and `localeLabels`.
2. Create `src/dictionaries/<locale>/` by copying the `en-US/` fragments (and `index.ts`) and translating values.
3. Ensure proxy redirects support the locale (no code changes if you use the same config).
4. Revalidate static params if using ISR or regenerate the site.

## Middleware Behaviour

`src/proxy.ts` uses `@formatjs/intl-localematcher` and `negotiator` to read the `Accept-Language` header. Requests lacking a locale segment are redirected to the best match. API routes, static assets, and Next.js internals are excluded from redirects via the proxy matcher.

## Commands

```bash
pnpm --filter web dev     # start dev server
pnpm --filter web build   # build production assets
pnpm --filter web start   # run production build
pnpm --filter web lint    # biome lint/format check
pnpm --filter web format  # apply biome formatting
pnpm --filter web test:e2e # run Playwright E2E tests
```

## Useful Links

- [Next.js App Router Internationalization Guide](https://nextjs.org/docs/app/guides/internationalization)
- [Biome](https://biomejs.dev/) – formatting & linting
- [Playwright](https://playwright.dev/) – end-to-end testing
