# Design: Internationalization Implementation

## Architecture Overview

The i18n implementation follows Next.js 15 App Router conventions using sub-path routing, middleware-based locale detection, and server-side dictionary loading.

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  Request: GET /  (Accept-Language: nl-NL, en-US;q=0.9)     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Middleware                              │
│  - Parse Accept-Language header                             │
│  - Match against supported locales [en-US, nl-NL]           │
│  - Redirect to /nl-NL/ if no locale in pathname            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   app/[lang]/page.tsx                        │
│  - Extract lang param from URL                              │
│  - Load dictionary: getDictionary(lang)                     │
│  - Pass translations to components                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Server Component (e.g., Hero)                   │
│  - Receive dictionary prop                                  │
│  - Use dict.hero.heading instead of hardcoded text         │
│  - Render localized HTML                                    │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── [lang]/                    # Locale-scoped routes
│   │   │   ├── layout.tsx            # Root layout with lang param
│   │   │   └── page.tsx              # Landing page with lang param
│   │   ├── globals.css
│   │   └── favicon.ico
│   ├── components/
│   │   ├── landing/
│   │   │   ├── hero.tsx              # Updated with dictionary prop
│   │   │   ├── features.tsx          # Updated with dictionary prop
│   │   │   ├── privacy.tsx           # Updated with dictionary prop
│   │   │   ├── pricing.tsx           # Updated with dictionary prop
│   │   │   ├── navigation.tsx        # Updated with dictionary prop
│   │   │   └── footer.tsx            # Updated with dictionary prop
│   │   └── language-selector.tsx     # Enhanced for locale navigation
│   ├── dictionaries/
│   │   ├── en-US.json                # English translations
│   │   ├── nl-NL.json                # Dutch translations
│   │   └── index.ts                  # getDictionary function
│   ├── i18n/
│   │   ├── config.ts                 # Locale configuration
│   │   └── types.ts                  # Generated dictionary types
│   └── middleware.ts                 # Locale detection and routing
```

## Middleware Design

The middleware (`src/middleware.ts`) handles locale detection and redirection:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { i18n } from './i18n/config';

function getLocale(request: NextRequest): string {
  // Get Accept-Language header
  const headers = { 'accept-language': request.headers.get('accept-language') || '' };
  const languages = new Negotiator({ headers }).languages();

  // Match against supported locales
  return match(languages, i18n.locales, i18n.defaultLocale);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname already has a locale
  const pathnameHasLocale = i18n.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Detect locale and redirect
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
```

## Dictionary Structure

Dictionaries are organized by page section for maintainability:

**dictionaries/en-US.json**:
```json
{
  "navigation": {
    "features": "Features",
    "privacy": "Privacy",
    "pricing": "Pricing",
    "docs": "Docs",
    "signIn": "Sign In",
    "getStarted": "Get Started"
  },
  "hero": {
    "badge": "Privacy-First Family Management",
    "heading": "Your Family's Digital",
    "headingHighlight": "Home",
    "subheading": "Keep your family connected, organized, and secure. Your data stays yours—forever.",
    "ctaPrimary": "Start Self-Hosting",
    "ctaSecondary": "Try Cloud Beta",
    "trustEncrypted": "End-to-End Encrypted",
    "trustSelfHosted": "Self-Hosted Option",
    "trustFamilyFirst": "Family-First Design"
  },
  "features": {
    "sectionHeading": "Everything Your Family Needs",
    // ... more sections
  }
}
```

**dictionaries/nl-NL.json**: Dutch translations with same structure.

## Dictionary Loading

Server-side only dictionary loading via dynamic import:

```typescript
// src/dictionaries/index.ts
import 'server-only';
import type { Locale } from '@/i18n/config';

const dictionaries = {
  'en-US': () => import('./en-US.json').then((module) => module.default),
  'nl-NL': () => import('./nl-NL.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale]();
};
```

## Component Integration Pattern

Components receive dictionaries through props (server components) or context (client components):

**Server Component Pattern**:
```typescript
// app/[lang]/page.tsx
import { getDictionary } from '@/dictionaries';
import { Hero } from '@/components/landing/hero';

export default async function Home({
  params
}: {
  params: Promise<{ lang: Locale }>
}) {
  // Next.js 16: params is now a Promise and must be awaited
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <div>
      <Hero dict={dict.hero} />
      {/* Other components */}
    </div>
  );
}
```

**Client Component Pattern** (for language-selector):
```typescript
'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import type { Locale } from '@/i18n/config';

export function LanguageSelector() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  // In client components, useParams() still returns synchronous values
  const currentLocale = params.lang as Locale;

  const handleLocaleChange = (newLocale: Locale) => {
    // Replace locale in pathname: /en-US/foo -> /nl-NL/foo
    const newPathname = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(newPathname);
  };

  // Render UI with currentLocale highlighted
}
```

## Type Safety

Generate TypeScript types from dictionary structure for type-safe access:

```typescript
// src/i18n/types.ts
import type enUS from '@/dictionaries/en-US.json';

export type Dictionary = typeof enUS;
export type DictionaryKey = keyof Dictionary;
```

## Static Generation

Enable static generation for both locales:

```typescript
// app/[lang]/layout.tsx or page.tsx
import { i18n } from '@/i18n/config';

export async function generateStaticParams() {
  // Return array of param objects for static generation
  return i18n.locales.map((locale) => ({ lang: locale }));
}

// Note: Each page/layout will receive params as Promise<{ lang: Locale }>
```

## Language Selector Enhancement

Current component stores locale in localStorage. New version will:
1. Display current locale from URL params
2. Highlight detected locale visually
3. Navigate to locale-specific routes on selection
4. Show locale labels in native language (EN / NL)

## Metadata Localization

Root layout metadata varies by locale:

```typescript
// app/[lang]/layout.tsx
export async function generateMetadata({
  params
}: {
  params: Promise<{ lang: Locale }>
}) {
  // Next.js 16: params must be awaited
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return {
    title: dict.metadata.title,
    description: dict.metadata.description,
  };
}
```

## Migration Strategy

1. Create dictionaries first (extract all text)
2. Implement middleware and i18n config
3. Restructure app directory (move app/* to app/[lang]/*)
4. Update components to accept dictionary props
5. Update language selector for route navigation
6. Add redirects for old root routes
7. Test both locales thoroughly

## Translation Guidelines

For Dutch translations:
- Use formal "u" form for user-facing content (appropriate for family app)
- Maintain brand voice: friendly, trustworthy, privacy-focused
- Keep technical terms in English where commonly used (e.g., "Self-Hosting")
- Translate marketing copy naturally, not word-for-word
- Preserve HTML structure and formatting

## Performance Considerations

- **No client bundle impact**: Dictionaries loaded server-side only via `server-only` package
- **Static generation**: Both locales pre-rendered at build time
- **Minimal middleware overhead**: Simple locale matching logic
- **No runtime translation**: All translations resolved server-side before render

## Accessibility Considerations

- Set `lang` attribute on `<html>` element based on locale
- Maintain semantic HTML across translations
- Ensure translated text maintains proper heading hierarchy
- Keep ARIA labels and alt text localized
