# Tasks: Add Internationalization

## Overview

Implement Next.js native i18n with sub-path routing for en-US and nl-NL locales. Tasks are ordered to deliver incremental, testable progress.

## Tasks

### 1. Install i18n dependencies

Install required npm packages for locale detection and matching.

**Actions**:
- Install `@formatjs/intl-localematcher` for locale matching
- Install `negotiator` for Accept-Language header parsing
- Install `server-only` to enforce server-side dictionary loading
- Update package.json and lockfile

**Validation**:
- `pnpm install` completes successfully
- Dependencies appear in package.json
- No dependency conflicts

**Estimated effort**: 5 minutes

---

### 2. Create i18n configuration

Set up locale configuration and TypeScript types.

**Actions**:
- Create `apps/web/src/i18n/config.ts` with supported locales and default locale
- Export `Locale` type for use throughout application
- Export `i18n` configuration object with locales array and defaultLocale

**Validation**:
- TypeScript compiles without errors
- Locale type is available for import
- Configuration exports correctly

**Estimated effort**: 10 minutes

---

### 3. Create English dictionary structure

Extract all landing page text into a structured English dictionary.

**Actions**:
- Create `apps/web/src/dictionaries/en-US.json`
- Extract navigation text (links, buttons)
- Extract hero section text (badge, heading, subheading, CTAs, trust indicators)
- Extract features section text (heading, feature cards, highlight section)
- Extract privacy section text (heading, feature cards, promise)
- Extract pricing section text (headings, features, CTAs, notes)
- Extract footer text (tagline, link sections, copyright)
- Extract metadata (title, description)
- Organize into nested structure by section

**Validation**:
- Valid JSON syntax
- All landing page text is extracted
- Consistent naming conventions
- No duplicate keys

**Estimated effort**: 45 minutes

---

### 4. Create Dutch dictionary with translations

Create Dutch translations matching the English dictionary structure.

**Actions**:
- Create `apps/web/src/dictionaries/nl-NL.json`
- Translate all navigation text to Dutch
- Translate hero section text to Dutch
- Translate features section text to Dutch
- Translate privacy section text to Dutch
- Translate pricing section text to Dutch
- Translate footer text to Dutch
- Translate metadata to Dutch
- Ensure same structure as en-US.json

**Validation**:
- Valid JSON syntax
- All keys from en-US.json are present
- Translations use appropriate formality (formal "u")
- Technical terms handled appropriately
- Brand voice maintained

**Estimated effort**: 60 minutes

---

### 5. Create dictionary loading utilities

Implement server-side dictionary loading function with TypeScript types.

**Actions**:
- Create `apps/web/src/dictionaries/index.ts`
- Import `server-only` to enforce server-side execution
- Implement `getDictionary(locale)` function with dynamic imports
- Create `apps/web/src/i18n/types.ts` with Dictionary type derived from en-US.json
- Export types for use in components

**Validation**:
- TypeScript compiles without errors
- getDictionary returns correctly typed dictionary
- Dictionary type provides autocomplete
- server-only package enforces server execution

**Estimated effort**: 15 minutes

---

### 6. Implement locale detection middleware

Create middleware for Accept-Language detection and locale routing.

**Actions**:
- Create `apps/web/src/middleware.ts`
- Implement `getLocale()` function using Negotiator and intl-localematcher
- Implement middleware function to check pathname for locale
- Redirect requests without locale to detected locale path
- Configure matcher to exclude API routes, static files, and _next
- Add proper TypeScript types for NextRequest and NextResponse

**Validation**:
- TypeScript compiles without errors
- Middleware exports correctly
- Matcher pattern is correct
- Root URL redirects to /en-US/ or /nl-NL/ based on header

**Estimated effort**: 30 minutes

---

### 7. Restructure app directory for sub-path routing

Move app/* to app/[lang]/* to enable locale-based routing.

**Actions**:
- Create `apps/web/src/app/[lang]/` directory
- Move `page.tsx` to `app/[lang]/page.tsx`
- Move `layout.tsx` to `app/[lang]/layout.tsx`
- Update layout.tsx to accept `params: Promise<{ lang: Locale }>` (Next.js 16 async params)
- Await params and set HTML lang attribute
- Implement `generateStaticParams()` to generate routes for both locales
- Implement `generateMetadata()` for localized metadata (also with async params)

**Validation**:
- Application builds successfully
- Both /en-US and /nl-NL routes are accessible
- HTML lang attribute matches route locale
- Static generation produces pages for both locales
- TypeScript enforces Promise<{ lang: Locale }> type

**Estimated effort**: 25 minutes

---

### 8. Update Navigation component with dictionary

Convert Navigation component to use dictionary translations.

**Actions**:
- Convert Navigation to accept `dict` prop with navigation translations
- Replace hardcoded "Features" with `dict.features`
- Replace hardcoded "Privacy" with `dict.privacy`
- Replace hardcoded "Pricing" with `dict.pricing`
- Replace hardcoded "Docs" with `dict.docs`
- Replace hardcoded "Sign In" with `dict.signIn`
- Replace hardcoded "Get Started" with `dict.getStarted`
- Update link hrefs to include locale (e.g., `/${lang}/docs`)

**Validation**:
- Component renders with English text when dict is en-US
- Component renders with Dutch text when dict is nl-NL
- Links include locale in path
- TypeScript shows errors for invalid dictionary keys

**Estimated effort**: 15 minutes

---

### 9. Update Hero component with dictionary

Convert Hero component to use dictionary translations.

**Actions**:
- Convert Hero to accept `dict` prop with hero translations
- Replace hardcoded badge text with `dict.badge`
- Replace hardcoded heading with `dict.heading` and `dict.headingHighlight`
- Replace hardcoded subheading with `dict.subheading`
- Replace hardcoded CTA buttons with `dict.ctaPrimary` and `dict.ctaSecondary`
- Replace hardcoded trust indicators with dict values
- Maintain all animations and styling

**Validation**:
- Component renders with English text when dict is en-US
- Component renders with Dutch text when dict is nl-NL
- Animations still work correctly
- TypeScript enforces correct dictionary structure

**Estimated effort**: 15 minutes

---

### 10. Update Features component with dictionary

Convert Features component to use dictionary translations.

**Actions**:
- Convert Features to accept `dict` prop with features translations
- Replace hardcoded section heading with `dict.sectionHeading`
- Create feature data structure with dictionary keys instead of hardcoded text
- Map over features array with translated titles and descriptions
- Replace hardcoded highlight section with dict values
- Replace hardcoded bullet points with dict array

**Validation**:
- Component renders with English text when dict is en-US
- Component renders with Dutch text when dict is nl-NL
- All feature cards display correctly
- Highlight section is translated

**Estimated effort**: 20 minutes

---

### 11. Update Privacy component with dictionary

Convert Privacy component to use dictionary translations.

**Actions**:
- Convert Privacy to accept `dict` prop with privacy translations
- Replace hardcoded badge and headings with dict values
- Create privacy features structure with dictionary keys
- Replace hardcoded privacy promise with dict values
- Replace hardcoded privacy policy link text with dict value
- Maintain all styling and layout

**Validation**:
- Component renders with English text when dict is en-US
- Component renders with Dutch text when dict is nl-NL
- Privacy features display correctly
- Privacy promise displays correctly

**Estimated effort**: 20 minutes

---

### 12. Update Pricing component with dictionary

Convert Pricing component to use dictionary translations.

**Actions**:
- Convert Pricing to accept `dict` prop with pricing translations
- Replace hardcoded section heading and description with dict values
- Create pricing feature arrays with dictionary keys
- Replace hardcoded card headings, CTAs, and notes with dict values
- Replace hardcoded comparison note with dict value
- Keep pricing amounts (€5) unchanged
- Maintain all styling and badges

**Validation**:
- Component renders with English text when dict is en-US
- Component renders with Dutch text when dict is nl-NL
- Pricing amounts remain in Euros
- All features and CTAs are translated

**Estimated effort**: 20 minutes

---

### 13. Update Footer component with dictionary

Convert Footer component to use dictionary translations.

**Actions**:
- Convert Footer to accept `dict` and `lang` props
- Replace hardcoded tagline with dict value
- Replace hardcoded column headings with dict values
- Create link structures with dictionary keys
- Replace hardcoded copyright text with dict value
- Update link hrefs to include locale
- Pass lang prop to LanguageSelector

**Validation**:
- Component renders with English text when dict is en-US
- Component renders with Dutch text when dict is nl-NL
- Links include locale in path
- LanguageSelector receives lang prop

**Estimated effort**: 20 minutes

---

### 14. Update page.tsx to load and pass dictionaries

Update the landing page to load dictionaries and pass to components.

**Actions**:
- Import getDictionary in `app/[lang]/page.tsx`
- Accept params as `Promise<{ lang: Locale }>` (Next.js 16)
- Await params: `const { lang } = await params`
- Call `getDictionary(lang)` to load translations
- Pass appropriate dictionary sections to each component
- Pass `lang` param to components that need it
- Ensure page is async to support dictionary loading

**Validation**:
- Page renders successfully in both locales
- All components receive correct dictionary sections
- No TypeScript errors for async params handling
- Page is statically generated for both locales

**Estimated effort**: 20 minutes

---

### 15. Enhance LanguageSelector component

Update LanguageSelector to navigate between locale routes and display current locale.

**Actions**:
- Import useParams, usePathname, and useRouter from next/navigation
- Extract current locale from params
- Implement handleLocaleChange to replace locale in pathname and navigate
- Update UI to highlight current locale
- Display labels in native languages ("EN" / "NL")
- Remove localStorage logic (replaced by URL-based locale)
- Add keyboard accessibility

**Validation**:
- Current locale is highlighted correctly
- Clicking language button navigates to correct locale route
- Pathname is preserved during locale change (/en-US/foo -> /nl-NL/foo)
- Component works on all pages
- Keyboard navigation works correctly

**Estimated effort**: 25 minutes

---

### 16. Add redirects for legacy root routes

Implement redirects to maintain compatibility with old root URL structure.

**Actions**:
- Update middleware to redirect "/" to default locale
- Add any additional redirects for common routes if needed
- Test that old bookmarks redirect correctly
- Document redirect behavior

**Validation**:
- "/" redirects to "/en-US/"
- Accept-Language header determines redirect target
- Redirects use 307 (temporary) status code
- No redirect loops

**Estimated effort**: 10 minutes

---

### 17. Visual testing of both locales

Manually verify both English and Dutch locales display correctly.

**Actions**:
- Run dev server: `pnpm dev`
- Test /en-US/ route - verify all English text displays
- Test /nl-NL/ route - verify all Dutch text displays
- Test language selector switches between locales
- Test Accept-Language header detection (use browser dev tools)
- Verify no layout shifts or broken styling
- Verify animations work in both locales
- Check HTML lang attribute matches locale

**Validation**:
- All landing page sections display correctly in English
- All landing page sections display correctly in Dutch
- Language selector works bidirectionally
- Accept-Language detection works
- No console errors or warnings
- Styling is consistent across locales

**Estimated effort**: 30 minutes

---

### 18. Build and verify static generation

Ensure both locales are statically generated at build time.

**Actions**:
- Run production build: `pnpm build`
- Verify build output shows static pages for both locales
- Check .next output for /en-US and /nl-NL HTML files
- Run production server: `pnpm start`
- Test both locale routes in production mode
- Verify performance is acceptable

**Validation**:
- Build completes without errors
- Both /en-US and /nl-NL routes are statically generated
- Production server serves both locales correctly
- No runtime errors
- Lighthouse scores remain high

**Estimated effort**: 15 minutes

---

### 19. Update documentation

Document the i18n implementation for future developers.

**Actions**:
- Update web app README.md with i18n usage
- Document how to add new translation keys
- Document how to add new locales (if needed in future)
- Add comments to middleware explaining locale detection
- Document dictionary structure conventions

**Validation**:
- Documentation is clear and accurate
- Examples are provided for common tasks
- New developers can understand the i18n setup

**Estimated effort**: 20 minutes

---

## Dependencies Between Tasks

- Tasks 1-2 are foundational (config and deps)
- Tasks 3-5 create the dictionary infrastructure
- Task 6 implements routing (requires tasks 1-2)
- Task 7 restructures the app (requires task 6)
- Tasks 8-13 can run in parallel after task 7 (component updates)
- Task 14 integrates all components (requires tasks 8-13)
- Task 15 enhances language selector (requires task 7)
- Task 16 adds redirects (requires task 6-7)
- Tasks 17-19 are verification and documentation (require all previous tasks)

## Parallel Work Opportunities

- **Dictionary creation** (tasks 3-4) can be done in parallel if multiple people work on it
- **Component updates** (tasks 8-13) can be done in parallel after task 7
- **Documentation** (task 19) can be drafted earlier and updated as implementation progresses

## Rollback Plan

If critical issues arise:
1. Revert app/[lang] back to app/ structure
2. Remove middleware.ts
3. Keep dictionaries and dictionary loading utils for future use
4. Restore original hardcoded components
5. Remove i18n dependencies if needed

## Success Metrics

- All landing page text available in both en-US and nl-NL
- Language selector navigates between locale routes
- Accept-Language detection works correctly
- No broken links or missing translations
- Type-safe dictionary access throughout
- Static generation produces pages for both locales
- Build time increases by < 50%
- Zero runtime performance degradation
