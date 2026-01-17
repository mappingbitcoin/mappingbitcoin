# Repository Guidelines

## Project Overview
MappingBitcoin.com is a Next.js 15 application that helps users discover Bitcoin-accepting places worldwide. The project uses the App Router with internationalization support (English primary, Spanish secondary).

## Project Structure

### Core Directories
```
app/                    # Next.js App Router
├── [locale]/           # Localized routes (en/es)
│   ├── home/           # Homepage components
│   ├── map/            # Interactive Bitcoin map
│   ├── countries/      # Countries directory - browse places by country
│   ├── places/         # Place pages (view, create, edit)
│   ├── contact/        # Contact page
│   ├── [slug]/         # Dynamic place region pages (country/city/category)
│   └── ...             # Other pages (privacy, terms)
├── api/                # API routes
│   ├── auth/           # OSM OAuth authentication
│   ├── cache/          # Server-side caching utilities
│   ├── map/            # Map-related endpoints
│   ├── places/         # Place CRUD operations
│   └── ...             # Other API endpoints
└── layout.tsx          # Root layout
```

### Supporting Directories
```
components/             # Reusable React components
├── layout/             # Layout components (NavBar, Footer, PageSection, etc.)
├── ui/                 # UI primitives (Button, Badge, Tooltip, CategoryChip)
├── common/             # Shared components (FAQSection, Article, CookieNotice)
├── forms/              # Form components (FormInput, OpeningHoursPicker)
├── place/              # Place-specific components (PlaceSidebar, CategorySelector)
├── place-form/         # Barrel exports for place form components
└── auth/               # Authentication components (LoginWithOSM, UserInfo)

lib/                    # Core utilities (Environment, etc.)
utils/                  # Helper functions (camelCase)
hooks/                  # Custom React hooks
models/                 # TypeScript interfaces and types
i18n/                   # Internationalization
├── seo/                # SEO metadata (one file per module)
├── routing.ts          # Locale routing configuration
└── types.ts            # i18n type definitions
data/                   # Static data files
constants/              # Constants and configuration
public/                 # Static assets and content
scripts/                # Build and data pipeline scripts
```

## Build & Development Commands

```bash
# Development
npm run dev             # Start local development server (Node 20.x)
npm run build           # Production build
npm start               # Serve production build
npm run lint            # Run ESLint

# Data Pipeline
npm run maps:update     # Update place/map data from OpenStreetMap

# Fresh Setup
npm ci && cp .env.example .env.local
```

## Coding Patterns

### TypeScript
- Strict mode enabled; explicit types at module boundaries
- Use interfaces for component props and API responses
- Prefer type imports: `import type { Foo } from './types'`

### Components
- Components organized by category in `components/` subdirectories
- Use PascalCase for component names
- Two naming patterns allowed:
  - **Folder pattern**: `ComponentName/index.tsx` - for complex components or those with related files
  - **File pattern**: `ComponentName.tsx` - for simple single-file components
- Each category folder has a barrel `index.ts` for exports
- Server Components by default; add `'use client'` only when needed

#### Import Patterns
```tsx
// Import from category barrel exports (preferred)
import { Button, Badge } from '@/components/ui';
import { PageSection, NavBar } from '@/components/layout';
import { FAQSection, Article } from '@/components/common';
import { PlaceSidebar } from '@/components/place';
import { LoginWithOSM } from '@/components/auth';

// Place form components (combines forms + place components)
import { FormSection, CategorySelector, LocationSection } from '@/components/place-form';
```

### Routing & Navigation
- **Always** use `@/i18n/navigation` for Link and routing hooks
- **Never** import directly from `next/navigation` or `next/link`
- Route directories use kebab-case (e.g., `app/privacy-policy/`)

```tsx
// Correct
import { Link, usePathname, useRouter } from '@/i18n/navigation';

// Incorrect - will fail ESLint
import { useRouter } from 'next/navigation';
import Link from 'next/link';
```

### Path Aliases
- Use `@/*` alias for all imports (configured in `tsconfig.json`)
```tsx
import { env } from '@/lib/Environment';
import { Button } from '@/components/ui';
import { PageSection } from '@/components/layout';
```

### State Management
- Prefer server components and server-side data fetching
- Use React hooks (`useState`, `useEffect`) for client state
- Custom hooks in `hooks/` directory (e.g., `usePlaces.ts`)

### Styling
- Tailwind CSS with custom configuration
- Use semantic class names from design system
- Framer Motion for animations (`motion` components)

## API Patterns

### Route Handlers
- Located in `app/api/` using Next.js 15 conventions
- Use `NextResponse` for responses
- Implement proper error handling with status codes

### Caching
- Server-side caching utilities in `app/api/cache/`
- Use `TileCache`, `PlaceCache`, `LocationCache` for data caching
- Respect cache invalidation patterns

### Authentication
- OSM OAuth for place submissions
- Auth routes in `app/api/auth/osm/`
- Session management via `app/api/me/`

## SEO Configuration
- SEO metadata organized modularly in `i18n/seo/` directory
- One file per page/module (e.g., `home.ts`, `map.ts`, `places.ts`)
- Main entry point: `i18n/seo/index.ts` (aggregates all modules)
- Use `buildGeneratePageMetadata()` from `@/utils/SEOUtils`
- All pages should have proper OpenGraph and Twitter cards
- Canonical URLs use `generateCanonical()` helper from `@/i18n/seo`

## Internationalization (i18n)
- Primary locale: `en` (English)
- Secondary locale: `es` (Spanish)
- Use `next-intl` for translations in components

### Translation Files
Translations are organized by module in `public/locales/{locale}/`:
```
public/locales/
└── en/
    ├── index.ts        # Merges all modules and exports combined messages
    ├── home.json       # Homepage translations
    ├── contact.json    # Contact page translations
    ├── map.json        # Map page and venue tooltips
    ├── places.json     # Place forms and breadcrumbs
    ├── countries.json  # Countries page and region listings
    ├── common.json     # Shared: menu, footer, subscribe, notFound
    └── lessons.json    # Educational content (21 lessons)
```

### Translation Key Patterns
```tsx
// Use the module prefix for translation keys
const t = useTranslations('home');        // For home.json content
const t = useTranslations('map');         // For map.json content
const t = useTranslations('countries');   // For countries.json content
const t = useTranslations('menu');        // From common.json (root level)
const t = useTranslations('footer');      // From common.json (root level)
```

### Backward Compatibility
For migration purposes, old keys are aliased:
- `merchants.*` → maps to `countries.*`
- `venues.*` → maps to `places.*`

### Legacy Redirects
- Spanish legacy slugs redirect (308) to English-style slugs
- Configure high-traffic redirects in `next.config.ts`
- Use `locale: false` in redirect configuration

## Testing
- No formal test framework configured
- Use `npm run build` as smoke test
- Verify critical pages locally before PRs
- If adding tests, place in `tests/` directory

## Git Workflow

### Commits
- Concise, imperative messages
- Prefer Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`
- Reference issues/PRs when applicable

### Pull Requests
- Clear description with context
- Link related issues
- Include verification steps
- Screenshots for UI changes
- Keep PRs focused and small

## Security
- Never commit secrets or API keys
- Use `.env.local` for local environment variables
- Copy `.env.example` and fill required values
- Document new env variables in `.env.example`

## Key Dependencies
- Next.js 15 with App Router
- React 19
- TypeScript (strict mode)
- Tailwind CSS
- Framer Motion
- next-intl (i18n)
- Mapbox/Maplibre for maps

## Copywriting Guidelines

### Capitalization Rules

**Always capitalize:**
- **Proper nouns** — names of specific people, places, organizations, and things (Sarah, London, Microsoft, the Eiffel Tower)
- **Days, months, and holidays** — Monday, January, Christmas
- **Languages and nationalities** — English, French, Italian, Brazilian
- **Brand names and trademarks** — Apple, Coca-Cola, Google, Bitcoin, Lightning Network
- **Titles before names** — Doctor Smith, President Lincoln, Professor Chen (but lowercase when used generally: "the doctor prescribed medicine")
- **Specific historical events and periods** — the Renaissance, World War II, the Industrial Revolution
- **Religions, deities, and sacred texts** — Christianity, Allah, the Bible, the Quran
- **The first word of a sentence**
- **The pronoun "I"** — always capitalized regardless of position

**Titles and headings:**
- Capitalize the first and last words plus all major words (nouns, verbs, adjectives, adverbs)
- Minor words like "a," "an," "the," "and," "or," and "of" are lowercase unless they're the first word

**Do NOT capitalize:**
- Common nouns used generically (e.g., "the map" not "the Map")
- Seasons (spring, summer, fall, winter)
- Directions unless part of a proper name (go north vs. North America)
