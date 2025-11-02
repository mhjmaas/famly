# i18n Specification

## Purpose

Provide internationalization capabilities for the Famly web application, supporting multiple locales with automatic detection and user-selectable language preferences.

## Implementation Notes

This specification follows Next.js 16 conventions where `params` is a Promise in server components. All scenarios referencing params in server components (pages, layouts, generateMetadata) assume async handling: `const { lang } = await params`.

## ADDED Requirements

### Requirement: Locale Configuration

The application SHALL support configured locales with a default fallback.

#### Scenario: Supported locales are defined

- **WHEN** the application initializes
- **THEN** it recognizes en-US and nl-NL as supported locales
- **AND** en-US is set as the default locale
- **AND** the locale configuration is type-safe and exported for use throughout the application

#### Scenario: Locale type is enforced

- **WHEN** developers reference a locale in code
- **THEN** TypeScript enforces the locale is one of the supported values
- **AND** invalid locale values are rejected at compile time

### Requirement: Locale Detection and Routing

The application SHALL automatically detect user locale preference and route to the appropriate localized version.

#### Scenario: User visits root URL with Accept-Language header

- **GIVEN** a user visits "/" with Accept-Language header "nl-NL, en-US;q=0.9"
- **WHEN** the middleware processes the request
- **THEN** the user is redirected to "/nl-NL/"
- **AND** the redirect uses a 307 (temporary redirect) status code

#### Scenario: User visits root URL with unsupported locale

- **GIVEN** a user visits "/" with Accept-Language header "fr-FR, en;q=0.5"
- **WHEN** the middleware processes the request
- **THEN** the user is redirected to "/en-US/" (default locale)
- **AND** the redirect uses a 307 status code

#### Scenario: User visits URL with locale already in path

- **GIVEN** a user visits "/nl-NL/" or "/nl-NL/about"
- **WHEN** the middleware processes the request
- **THEN** no redirect occurs
- **AND** the request proceeds to the appropriate route

#### Scenario: Middleware excludes API and static routes

- **GIVEN** a user requests "/api/*", "/_next/static/*", "/_next/image/*", or "/favicon.ico"
- **WHEN** the middleware processes the request
- **THEN** the middleware does not run
- **AND** the request proceeds directly to the handler

#### Scenario: Middleware handles locale matching

- **GIVEN** a user's Accept-Language header contains multiple locales
- **WHEN** the middleware matches against supported locales
- **THEN** it uses the @formatjs/intl-localematcher algorithm
- **AND** selects the best matching supported locale
- **AND** falls back to the default locale if no match is found

### Requirement: Sub-path Routing Structure

The application SHALL use sub-path routing to serve different locales.

#### Scenario: App directory is structured for locale routing

- **WHEN** the application is built
- **THEN** all pages are nested under app/[lang]/
- **AND** the [lang] dynamic segment captures the locale from the URL
- **AND** each page receives the locale as a param

#### Scenario: Root layout receives locale parameter

- **GIVEN** a user visits a localized route
- **WHEN** the root layout renders
- **THEN** it receives the lang parameter from the URL
- **AND** sets the HTML lang attribute to match the locale
- **AND** renders with the correct locale context

#### Scenario: Static routes are generated for all locales

- **WHEN** the application builds
- **THEN** generateStaticParams returns all supported locales
- **AND** Next.js pre-renders pages for each locale
- **AND** both /en-US/* and /nl-NL/* routes are statically generated

### Requirement: Translation Dictionary Loading

The application SHALL load translation dictionaries based on the current locale.

#### Scenario: Dictionary is loaded server-side

- **GIVEN** a page component needs translations
- **WHEN** the component calls getDictionary(locale)
- **THEN** the appropriate dictionary JSON file is dynamically imported
- **AND** the dictionary is returned as a typed object
- **AND** the dictionary loading occurs only on the server (not in client bundle)

#### Scenario: Dictionary structure is type-safe

- **WHEN** developers access dictionary keys in components
- **THEN** TypeScript provides autocomplete for available keys
- **AND** TypeScript errors if an invalid key is accessed
- **AND** the type is derived from the en-US dictionary structure

#### Scenario: Missing locale dictionary causes error

- **GIVEN** getDictionary is called with an unsupported locale
- **WHEN** the dictionary import is attempted
- **THEN** an error is thrown
- **AND** the error message indicates the missing locale

### Requirement: Landing Page Localization

All landing page components SHALL display text in the user's selected locale.

#### Scenario: Navigation displays localized links

- **GIVEN** a user views the landing page in nl-NL
- **WHEN** the navigation renders
- **THEN** navigation links display in Dutch
- **AND** "Features" displays as "Functies"
- **AND** "Privacy" displays as "Privacy"
- **AND** "Pricing" displays as "Prijzen"
- **AND** "Docs" displays as "Documentatie"
- **AND** "Sign In" displays as "Inloggen"
- **AND** "Get Started" displays as "Aan de slag"

#### Scenario: Hero section displays localized content

- **GIVEN** a user views the landing page in nl-NL
- **WHEN** the hero section renders
- **THEN** the badge displays "Privacy-First Familiebeheer"
- **AND** the heading displays "Jouw Digitale Gezins" with "Thuis" highlighted
- **AND** the subheading is translated to Dutch
- **AND** CTA buttons display "Start Self-Hosting" and "Probeer Cloud Beta"
- **AND** trust indicators are translated

#### Scenario: Features section displays localized content

- **GIVEN** a user views the landing page in nl-NL
- **WHEN** the features section renders
- **THEN** the section heading displays in Dutch
- **AND** each feature card title and description are translated
- **AND** the feature highlight section text is translated
- **AND** all bullet points are translated

#### Scenario: Privacy section displays localized content

- **GIVEN** a user views the landing page in nl-NL
- **WHEN** the privacy section renders
- **THEN** the section heading and subheading are translated
- **AND** each privacy feature card is translated
- **AND** the privacy promise card content is translated
- **AND** the privacy policy link text is translated

#### Scenario: Pricing section displays localized content

- **GIVEN** a user views the landing page in nl-NL
- **WHEN** the pricing section renders
- **THEN** the section heading and description are translated
- **AND** pricing card headings, features, and CTAs are translated
- **AND** the comparison note is translated
- **AND** pricing amounts remain in Euros (€5)

#### Scenario: Footer displays localized content

- **GIVEN** a user views the landing page in nl-NL
- **WHEN** the footer renders
- **THEN** the tagline and column headings are translated
- **AND** all footer links are translated
- **AND** the copyright text is translated
- **AND** social media icons remain unchanged

### Requirement: Language Selector

The application SHALL provide a language selector that allows users to switch between supported locales.

#### Scenario: Language selector displays current locale

- **GIVEN** a user is viewing /nl-NL/
- **WHEN** the language selector renders
- **THEN** the NL button is highlighted/selected
- **AND** the EN button is not highlighted
- **AND** both buttons are clearly visible and accessible

#### Scenario: User changes locale via language selector

- **GIVEN** a user is viewing /en-US/about
- **WHEN** the user clicks the NL button in the language selector
- **THEN** the user is navigated to /nl-NL/about
- **AND** the page content updates to Dutch
- **AND** the NL button becomes highlighted
- **AND** the URL reflects the new locale

#### Scenario: Language selector works on all pages

- **GIVEN** a user is on any page with a language selector
- **WHEN** the user changes the locale
- **THEN** the user stays on the same page path but with the new locale
- **AND** /en-US/foo becomes /nl-NL/foo when switching to Dutch
- **AND** /nl-NL/bar becomes /en-US/bar when switching to English

#### Scenario: Language selector shows native language labels

- **WHEN** the language selector renders
- **THEN** the English option displays "EN" or "English"
- **AND** the Dutch option displays "NL" or "Nederlands"
- **AND** labels are displayed in their respective native languages

#### Scenario: Language selector is keyboard accessible

- **WHEN** a user navigates with keyboard
- **THEN** both language buttons are reachable via Tab
- **AND** buttons can be activated via Enter or Space
- **AND** focus indicators are clearly visible

### Requirement: Metadata Localization

Page metadata SHALL be localized based on the current locale.

#### Scenario: Page title is localized

- **GIVEN** a user visits /nl-NL/
- **WHEN** the page metadata is generated
- **THEN** the page title is in Dutch
- **AND** displays "Famly - Jouw Digitale Gezinsthuis" (or similar)

#### Scenario: Meta description is localized

- **GIVEN** a user visits /nl-NL/
- **WHEN** the page metadata is generated
- **THEN** the meta description is in Dutch
- **AND** describes the platform in Dutch

#### Scenario: HTML lang attribute matches locale

- **GIVEN** a user visits any localized route
- **WHEN** the page renders
- **THEN** the <html> element has lang="en-US" for English routes
- **AND** the <html> element has lang="nl-NL" for Dutch routes

### Requirement: Translation Quality

Translations SHALL be accurate, culturally appropriate, and maintain brand voice.

#### Scenario: Dutch translations use appropriate formality

- **WHEN** user-facing text is translated to Dutch
- **THEN** the formal "u" form is used consistently
- **AND** the tone remains friendly and approachable
- **AND** professional terminology is used appropriately

#### Scenario: Technical terms are handled appropriately

- **WHEN** technical terms appear in Dutch translations
- **THEN** commonly English terms (e.g., "Docker", "API") remain in English
- **AND** translatable technical terms are translated
- **AND** translations are consistent across the application

#### Scenario: Brand voice is maintained

- **WHEN** marketing copy is translated
- **THEN** the privacy-first, family-focused tone is preserved
- **AND** Dutch translations feel natural, not word-for-word
- **AND** emotional resonance matches the English version

### Requirement: Graceful Fallback

The application SHALL handle missing translations gracefully.

#### Scenario: Missing translation key shows English fallback

- **GIVEN** a translation key exists in en-US but not nl-NL
- **WHEN** the Dutch page renders
- **THEN** the English text is displayed
- **AND** a warning is logged to the console (development only)
- **AND** the page does not crash or show empty content

#### Scenario: Malformed dictionary is handled

- **GIVEN** a dictionary file is malformed or fails to load
- **WHEN** getDictionary is called
- **THEN** an error is caught and logged
- **AND** the application falls back to the default locale dictionary
- **OR** displays a helpful error message to developers

### Requirement: Performance

Internationalization SHALL not negatively impact application performance.

#### Scenario: Dictionaries do not increase client bundle size

- **WHEN** the application is built
- **THEN** dictionary JSON files are not included in client JavaScript bundles
- **AND** dictionaries are loaded server-side only
- **AND** the server-only package enforces this constraint

#### Scenario: Static generation works for all locales

- **WHEN** the application is built
- **THEN** all pages are statically generated for both en-US and nl-NL
- **AND** build time increases proportionally to the number of locales
- **AND** runtime performance is identical to non-localized pages

#### Scenario: Middleware performance is acceptable

- **WHEN** locale detection middleware runs
- **THEN** processing time is under 10ms for typical requests
- **AND** Accept-Language parsing does not cause noticeable latency
- **AND** locale matching completes efficiently

### Requirement: Developer Experience

The i18n implementation SHALL be easy for developers to use and extend.

#### Scenario: Adding a new translation key is straightforward

- **WHEN** a developer needs to add new translatable text
- **THEN** they add the key to both en-US.json and nl-NL.json
- **AND** TypeScript immediately recognizes the new key
- **AND** the key is available in components via the dictionary

#### Scenario: Missing translations are detected at development time

- **WHEN** a developer uses a non-existent dictionary key
- **THEN** TypeScript shows a compile-time error
- **AND** the error message indicates the invalid key
- **AND** autocomplete suggests valid keys

#### Scenario: Adding a new locale is documented

- **WHEN** a developer wants to add a new locale (e.g., de-DE)
- **THEN** clear documentation exists in the codebase
- **AND** the process involves adding to i18n config, creating dictionary, and updating types
- **AND** the change is verified by TypeScript

## MODIFIED Requirements

### Requirement: Landing Page Navigation (from landing-page spec)

The navigation component SHALL support localized content for all supported locales.

#### Scenario: Navigation displays in user's locale

- **WHEN** a user visits the landing page
- **THEN** navigation links SHALL display in the user's selected locale
- **AND** link destinations SHALL preserve the locale (e.g., /nl-NL/docs)
- **AND** the Famly logo SHALL remain unchanged across locales

### Requirement: Landing Page Footer (from landing-page spec)

The footer component SHALL support localized content for all supported locales.

#### Scenario: Footer displays in user's locale

- **WHEN** a user scrolls to the footer
- **THEN** all footer text SHALL display in the user's selected locale
- **AND** the language selector SHALL display the current locale
- **AND** the theme toggle SHALL remain functional across locales
