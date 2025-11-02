# Proposal: Add Internationalization (i18n)

## Why

Implement Next.js native internationalization to support en-US and nl-NL locales across the entire web application, using sub-path routing and Accept-Language header detection.

### Objective

Implement Next.js native internationalization to support en-US and nl-NL locales across the entire web application, using sub-path routing and Accept-Language header detection.

## Problem Statement

The current web application is hardcoded in English, limiting accessibility for Dutch-speaking users. A language selector component exists in the footer but only stores preference in localStorage without actually translating content. The application needs a robust i18n solution that:
- Follows Next.js 15 App Router best practices
- Supports automatic locale detection via Accept-Language header
- Allows manual locale selection via the existing language selector
- Uses sub-path routing (/en-US/*, /nl-NL/*) for SEO and stateless locale handling
- Provides a scalable foundation for future locale additions

## What Changes

Implement internationalization using Next.js native patterns:

1. **URL Structure**: Restructure app directory from `app/` to `app/[lang]/` to enable sub-path routing
2. **Locale Detection**: Create middleware to detect locale from Accept-Language header and redirect to appropriate sub-path
3. **Message Dictionaries**: Extract all hardcoded text into JSON dictionaries under `dictionaries/en-US.json` and `dictionaries/nl-NL.json`
4. **Translation Utilities**: Create `getDictionary()` server function to load translations based on locale
5. **Language Selector Enhancement**: Update the existing language selector to navigate between locale routes and display detected locale
6. **Type Safety**: Generate TypeScript types from dictionary structure for type-safe translations

## Scope

This change covers:
- Middleware for locale detection and routing
- App directory restructuring for sub-path routing
- Dictionary creation for en-US (current text) and nl-NL (Dutch translations)
- All landing page components (Hero, Features, Privacy, Pricing, Navigation, Footer)
- Language selector component enhancement
- Root layout metadata internationalization
- Infrastructure for future authenticated route localization

Out of scope:
- Translation of future authenticated pages (will use the established infrastructure)
- Additional locales beyond en-US and nl-NL
- RTL (right-to-left) language support

## Impact

### User Experience
- Dutch users can view the site in their native language
- Automatic locale detection provides seamless experience
- Manual language toggle allows user preference override
- SEO-friendly URLs for both English and Dutch content

### Technical
- App directory structure changes from `app/page.tsx` to `app/[lang]/page.tsx`
- All page and layout imports need locale parameter
- Component props updated to accept dictionary/locale parameters
- Static generation for both locales via `generateStaticParams`

### Testing
- Visual inspection of both locales required
- Language selector navigation testing
- Middleware locale detection testing
- Verify Accept-Language header handling

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking URL structure | High - existing bookmarks break | Implement redirects in middleware for old routes |
| Translation quality | Medium - poor Dutch translations | Native speaker review or professional translation service |
| Missing translations | Medium - fallback to English | Implement graceful fallback mechanism |
| Bundle size increase | Low - dictionary files add size | Server-only dictionary loading (no client bundle impact) |

## Dependencies

- Next.js 16 App Router (already in use - version 16.0.1)
- `@formatjs/intl-localematcher` for locale matching
- `negotiator` for Accept-Language header parsing
- `server-only` to enforce server-side dictionary loading

## Next.js 16 Compatibility

This proposal follows Next.js 16 conventions where `params` is now a Promise that must be awaited in server components:
- `params: Promise<{ lang: Locale }>` in pages and layouts
- `const { lang } = await params` to access the locale
- Client-side `useParams()` still returns synchronous values

## Alternatives Considered

1. **next-intl library**: Full-featured i18n library with many conveniences
   - Rejected: Adds dependency when Next.js native patterns are sufficient

2. **No URL locale (middleware-based only)**: Keep current URL structure
   - Rejected: Not SEO-optimal, requires cookie/session state, not Next.js recommended pattern

3. **Landing page only scope**: Limit to public pages initially
   - Rejected: Better to establish full infrastructure now for consistency

## Success Criteria

- All landing page text available in both en-US and nl-NL
- Language selector navigates between /en-US and /nl-NL routes
- Accept-Language header detection redirects to appropriate locale
- No broken links or missing translations
- Type-safe dictionary access throughout application
- Existing functionality (theme toggle, navigation, links) works in both locales
