# Tasks: Add Internationalization

## Overview

Implement Next.js native i18n with sub-path routing for en-US and nl-NL locales. Tasks are ordered to deliver incremental, testable progress.

## 1. Setup and Configuration

- [x] 1.1 Install i18n dependencies (`@formatjs/intl-localematcher`, `negotiator`, `server-only`)
- [x] 1.2 Create i18n config file with supported locales and Locale type
- [x] 1.3 Implement locale detection middleware
- [x] 1.4 Configure middleware matcher to exclude API and static routes

## 2. Create Translation Dictionaries

- [x] 2.1 Create English dictionary (en-US.json) with all landing page text
  - [x] 2.1.1 Extract navigation text (links, buttons)
  - [x] 2.1.2 Extract hero section text (badge, heading, subheading, CTAs, trust indicators)
  - [x] 2.1.3 Extract features section text (heading, cards, highlight)
  - [x] 2.1.4 Extract privacy section text (heading, cards, promise)
  - [x] 2.1.5 Extract pricing section text (headings, features, CTAs)
  - [x] 2.1.6 Extract footer text (tagline, links, copyright)
  - [x] 2.1.7 Extract metadata (title, description)
  - [x] 2.1.8 Validate JSON syntax and structure

- [x] 2.2 Create Dutch dictionary (nl-NL.json) with translations
  - [x] 2.2.1 Translate navigation to Dutch
  - [x] 2.2.2 Translate hero section to Dutch
  - [x] 2.2.3 Translate features section to Dutch
  - [x] 2.2.4 Translate privacy section to Dutch
  - [x] 2.2.5 Translate pricing section to Dutch
  - [x] 2.2.6 Translate footer to Dutch
  - [x] 2.2.7 Translate metadata to Dutch
  - [x] 2.2.8 Validate keys match en-US.json structure

- [x] 2.3 Create dictionary loading utility
  - [x] 2.3.1 Implement `getDictionary(locale)` function with `server-only`
  - [x] 2.3.2 Add dynamic imports for each locale dictionary
  - [x] 2.3.3 Create Dictionary TypeScript type from en-US.json structure
  - [x] 2.3.4 Verify type safety and autocomplete

## 3. Restructure App Directory

- [x] 3.1 Create app/[lang]/ directory structure
- [x] 3.2 Move layout.tsx to app/[lang]/layout.tsx
  - [x] 3.2.1 Update to accept params as `Promise<{ lang: Locale }>` (Next.js 16)
  - [x] 3.2.2 Await params and extract lang
  - [x] 3.2.3 Set HTML lang attribute to match locale
  - [x] 3.2.4 Implement `generateStaticParams()` for both locales
  - [x] 3.2.5 Implement `generateMetadata()` with localized title/description
- [x] 3.3 Move page.tsx to app/[lang]/page.tsx
  - [x] 3.3.1 Update to accept params as `Promise<{ lang: Locale }>`
  - [x] 3.3.2 Await params and call `getDictionary(lang)`
  - [x] 3.3.3 Pass dictionary sections to child components
- [x] 3.4 Keep globals.css in app/ (shared by all locales)
- [x] 3.5 Test routes are accessible at /en-US and /nl-NL

## 4. Update Components with Dictionary Props

- [x] 4.1 Update Navigation component
  - [x] 4.1.1 Accept dict prop with navigation translations
  - [x] 4.1.2 Replace hardcoded text with dict keys
  - [x] 4.1.3 Update link hrefs to include locale parameter

- [x] 4.2 Update Hero component
  - [x] 4.2.1 Accept dict prop with hero translations
  - [x] 4.2.2 Replace badge, heading, subheading with dict keys
  - [x] 4.2.3 Replace CTA button text with dict keys
  - [x] 4.2.4 Replace trust indicators with dict keys
  - [x] 4.2.5 Verify animations still work correctly

- [x] 4.3 Update Features component
  - [x] 4.3.1 Accept dict prop with features translations
  - [x] 4.3.2 Replace section heading and description
  - [x] 4.3.3 Replace feature card titles and descriptions
  - [x] 4.3.4 Replace highlight section text with dict keys

- [x] 4.4 Update Privacy component
  - [x] 4.4.1 Accept dict prop with privacy translations
  - [x] 4.4.2 Replace section heading and description
  - [x] 4.4.3 Replace privacy feature cards with dict keys
  - [x] 4.4.4 Replace privacy promise text with dict keys

- [x] 4.5 Update Pricing component
  - [x] 4.5.1 Accept dict prop with pricing translations
  - [x] 4.5.2 Replace section heading and description
  - [x] 4.5.3 Replace pricing card titles and CTAs with dict keys
  - [x] 4.5.4 Replace feature lists with dict keys
  - [x] 4.5.5 Keep pricing amounts unchanged (€5)

- [x] 4.6 Update Footer component
  - [x] 4.6.1 Accept dict and lang props
  - [x] 4.6.2 Replace footer text with dict keys
  - [x] 4.6.3 Update link hrefs to include locale
  - [x] 4.6.4 Pass lang prop to LanguageSelector

## 5. Enhance Language Selector

- [x] 5.1 Convert LanguageSelector to client component
  - [x] 5.1.1 Import useParams, usePathname, useRouter
  - [x] 5.1.2 Extract current locale from URL params
  - [x] 5.1.3 Implement handleLocaleChange function
  - [x] 5.1.4 Preserve pathname when switching locales
  - [x] 5.1.5 Highlight current locale visually
  - [x] 5.1.6 Add keyboard accessibility
  - [x] 5.1.7 Remove localStorage persistence (replaced by URL)

## 6. Testing and Validation

- [x] 6.1 Visual testing in development
  - [x] 6.1.1 Start dev server and navigate to /en-US
  - [x] 6.1.2 Verify English text displays correctly
  - [x] 6.1.3 Navigate to /nl-NL and verify Dutch text
  - [x] 6.1.4 Test language selector navigation both directions
  - [x] 6.1.5 Verify no console errors or warnings
  - [x] 6.1.6 Test Accept-Language header detection

- [x] 6.2 Build and production validation
  - [x] 6.2.1 Run `pnpm build` and verify success
  - [x] 6.2.2 Check both /en-US and /nl-NL in .next output
  - [x] 6.2.3 Run `pnpm start` and test production routes
  - [x] 6.2.4 Verify static generation reduced build time impact
  - [x] 6.2.5 Check Lighthouse scores remain high

- [x] 6.3 Edge case testing
  - [x] 6.3.1 Test redirect with unsupported locale in Accept-Language
  - [x] 6.3.2 Test already-localized URLs don't redirect
  - [x] 6.3.3 Test language selector on various pages
  - [x] 6.3.4 Test theme toggle works across locales
  - [x] 6.3.5 Verify HTML lang attribute matches locale

## 7. Documentation

- [x] 7.1 Update web app README with i18n section
  - [x] 7.1.1 Document how to add new translation keys
  - [x] 7.1.2 Document dictionary structure conventions
  - [x] 7.1.3 Document how to add new locales in future

- [x] 7.2 Add code comments
  - [x] 7.2.1 Comment middleware locale detection logic
  - [x] 7.2.2 Comment getDictionary function
  - [x] 7.2.3 Comment async params pattern for Next.js 16

## Dependencies and Ordering

**Must be completed in order**:
1. Section 1 (Setup) → all others depend on this
2. Section 2 (Dictionaries) → needed before components
3. Section 3 (App restructuring) → needed before component updates
4. Sections 4, 5 (Components) → can be worked in parallel after section 3
5. Section 6 (Testing) → after all implementation
6. Section 7 (Documentation) → final step

## Parallel Work Opportunities

- Sections 4.1-4.6 (component updates) can be split among team members
- Section 2.1 and 2.2 (dictionary creation) can be done in parallel
- Section 6.1 can begin while 4.x is finishing

## Success Criteria

- [x] All landing page text available in en-US and nl-NL
- [x] Language selector navigates between /en-US and /nl-NL routes
- [x] Accept-Language header detection works correctly
- [x] No broken links or missing translations
- [x] TypeScript enforces type-safe dictionary access
- [x] Both locales statically generated at build time
- [x] No client bundle size increase from dictionaries
- [x] Zero runtime performance degradation
- [x] All existing functionality (theme, navigation) works in both locales
