# SEO Guidelines for Mapping Bitcoin

This document outlines all SEO considerations implemented across the Mapping Bitcoin website. Follow these guidelines when creating new pages or modifying existing ones.

## Table of Contents

1. [Meta Tags](#meta-tags)
2. [Open Graph Protocol](#open-graph-protocol)
3. [Twitter Cards](#twitter-cards)
4. [JSON-LD Structured Data](#json-ld-structured-data)
5. [Content Structure](#content-structure)
6. [Internal Linking](#internal-linking)
7. [Technical SEO](#technical-seo)
8. [Internationalization](#internationalization)

---

## Meta Tags

### Title Tag

- **Maximum length**: 60 characters (Google truncates after ~60)
- **Format**: `{Page Title} | Mapping Bitcoin`
- **Requirements**:
  - Include primary keyword near the beginning
  - Make it descriptive and compelling
  - Unique for every page

**Examples:**
```
Good:  "Bitcoin Restaurants in Rome | Mapping Bitcoin" (45 chars)
Good:  "Interactive Bitcoin Map | Mapping Bitcoin" (41 chars)
Bad:   "Mapping Bitcoin - The Best Place to Find Bitcoin Accepting Merchants Worldwide" (78 chars - too long)
```

### Meta Description

- **Maximum length**: 160 characters (Google truncates after ~155-160)
- **Requirements**:
  - Include primary and secondary keywords naturally
  - Write compelling copy that encourages clicks
  - Include a call-to-action when appropriate
  - Unique for every page

**Examples:**
```
Good:  "Find cafes, restaurants, and shops accepting Bitcoin in Rome. Browse 150+ verified places on our interactive map." (114 chars)
Bad:   "Bitcoin places in Rome" (22 chars - too short, not compelling)
```

### Meta Keywords

- Include 5-10 relevant keywords
- Mix of branded and non-branded terms
- Include location-specific keywords where applicable

**Location in codebase**: `i18n/seo/*.ts`

---

## Open Graph Protocol

Required for proper social media sharing (Facebook, LinkedIn, etc.).

### Required Properties

| Property | Description | Max Length |
|----------|-------------|------------|
| `og:title` | Page title | 60 chars |
| `og:description` | Page description | 160 chars |
| `og:url` | Canonical URL | - |
| `og:type` | Content type | - |
| `og:image` | Preview image URL | - |
| `og:site_name` | "Mapping Bitcoin" | - |

### Image Requirements

- **Dimensions**: 1200 x 630 pixels (1.91:1 ratio)
- **Format**: WebP preferred, JPG/PNG fallback
- **File size**: < 300KB
- **Alt text**: Always include descriptive alt text

### Implementation

```typescript
openGraph: {
    title: "Page Title | Mapping Bitcoin",
    description: "Compelling description under 160 characters.",
    url: "https://mappingbitcoin.com/page-url",
    type: "website", // or "article" for blog posts
    siteName: "Mapping Bitcoin",
    images: [
        {
            url: "https://mappingbitcoin.com/assets/opengraph/image.webp",
            width: 1200,
            height: 630,
            alt: "Descriptive alt text",
        },
    ],
}
```

---

## Twitter Cards

Required for proper Twitter/X sharing.

### Card Types

- `summary_large_image` - Default for most pages (large image preview)
- `summary` - For pages without prominent images

### Required Properties

| Property | Description |
|----------|-------------|
| `twitter:card` | Card type |
| `twitter:title` | Page title (60 chars max) |
| `twitter:description` | Description (160 chars max) |
| `twitter:image` | Preview image URL |

### Implementation

```typescript
twitter: {
    card: "summary_large_image",
    title: "Page Title | Mapping Bitcoin",
    description: "Compelling description under 160 characters.",
    images: ["https://mappingbitcoin.com/assets/opengraph/image.webp"],
}
```

---

## JSON-LD Structured Data

Structured data helps search engines understand page content and enables rich snippets.

### Required Schemas by Page Type

| Page Type | Schemas |
|-----------|---------|
| Home | Organization, WebSite (with SearchAction), BreadcrumbList |
| Map | WebPage, Map, BreadcrumbList |
| Place Detail | LocalBusiness (specific type), BreadcrumbList, AggregateRating |
| Country/City Directory | CollectionPage, ItemList, BreadcrumbList |
| Categories | ItemList, BreadcrumbList |
| Blog Index | Blog, CollectionPage, BreadcrumbList |
| Blog Post | BlogPosting, BreadcrumbList |
| Contact | ContactPage, ContactPoint, BreadcrumbList |
| Docs | TechArticle, BreadcrumbList |

### LocalBusiness Schema (Place Pages)

Map subcategories to appropriate schema.org types:

```typescript
const subcategorySchemaTypeMap = {
    "restaurant": "Restaurant",
    "cafe": "CafeOrCoffeeShop",
    "fast_food": "FastFoodRestaurant",
    "hotel": "Hotel",
    "hostel": "Hostel",
    "bar": "BarOrPub",
    "bakery": "Bakery",
    "atm": "AutomatedTeller",
    "supermarket": "GroceryStore",
    "pharmacy": "Pharmacy",
    // ... see full list in places/[slug]/page.tsx
};
```

### Required LocalBusiness Properties

| Property | Required | Notes |
|----------|----------|-------|
| `@type` | Yes | Specific business type |
| `name` | Yes | Business name |
| `url` | Yes | Canonical URL |
| `geo` | Yes | GeoCoordinates (lat/lon) |
| `address` | If available | PostalAddress |
| `paymentAccepted` | Yes | ["Bitcoin", "Lightning Network"] |
| `telephone` | If available | Phone number |
| `email` | If available | Email address |
| `openingHours` | If available | Opening hours |
| `aggregateRating` | If available | Rating with reviewCount |
| `amenityFeature` | If available | WiFi, wheelchair access, etc. |

### BreadcrumbList (All Pages)

Every page must include breadcrumb structured data:

```typescript
{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
        {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://mappingbitcoin.com"
        },
        {
            "@type": "ListItem",
            "position": 2,
            "name": "Current Page",
            "item": "https://mappingbitcoin.com/current-page"
        }
    ]
}
```

### SearchAction (Home Page Only)

```typescript
{
    "@type": "SearchAction",
    "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://mappingbitcoin.com/map?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
}
```

---

## Content Structure

### Heading Hierarchy

Maintain proper heading hierarchy for accessibility and SEO:

```
H1 - Page Title (ONE per page)
├── H2 - Main Section
│   ├── H3 - Subsection
│   │   └── H4 - Detail
│   └── H3 - Subsection
└── H2 - Main Section
```

**Rules:**
- Only ONE `<h1>` per page
- Never skip heading levels (H1 → H3 is wrong)
- Headings should be descriptive and include keywords naturally
- Use semantic heading tags, not styled divs

### Minimum Content Requirements

| Page Type | Minimum Word Count | Notes |
|-----------|-------------------|-------|
| Home | 500+ | Spread across sections |
| Directory (Country/City) | 300+ | Include sr-only content |
| Place Detail | 200+ | Dynamic content acceptable |
| Blog Post | 800+ | Long-form content preferred |
| Category | 300+ | Include sr-only content |

### Screen Reader Only (sr-only) Content

Use `sr-only` class for SEO content that's hidden visually but accessible to crawlers:

```tsx
<div className="sr-only">
    <p>Detailed paragraph for crawlers...</p>
    <h2>Section Title</h2>
    <p>More SEO content...</p>
</div>
```

**sr-only content should include:**
- Detailed description of page content
- Relevant keywords in natural sentences
- Links to related pages (when appropriate)
- Location-specific information

---

## Internal Linking

### Link Structure

- Use descriptive anchor text (not "click here")
- Link to related pages naturally within content
- Maintain logical site hierarchy

**Good Examples:**
```tsx
<Link href="/categories">Browse all Bitcoin business categories</Link>
<Link href="/bitcoin-shops-in-rome-italy">Bitcoin merchants in Rome</Link>
```

**Bad Examples:**
```tsx
<Link href="/categories">Click here</Link>
<Link href="/page">Read more</Link>
```

### Breadcrumb Navigation

Visible breadcrumbs should match JSON-LD breadcrumb data:

```tsx
<nav aria-label="Breadcrumb">
    <ol>
        <li><Link href="/">Home</Link></li>
        <li>/</li>
        <li><Link href="/categories">Categories</Link></li>
        <li>/</li>
        <li>Restaurants</li>
    </ol>
</nav>
```

### Related Content Links

Include links to related pages in sr-only content and visible sections:

- Country pages → Link to cities within the country
- City pages → Link to categories in that city
- Category pages → Link to countries with that category
- Place pages → Link to other places in same city/category

---

## Technical SEO

### Canonical URLs

Every page must have a canonical URL:

```typescript
alternates: {
    canonical: "https://mappingbitcoin.com/page-url",
}
```

### Hreflang Tags

For internationalized pages:

```typescript
alternates: {
    languages: {
        'en': 'https://mappingbitcoin.com/en/page',
        'es': 'https://mappingbitcoin.com/es/page',
        'x-default': 'https://mappingbitcoin.com/en/page',
    },
}
```

### Robots.txt

Located at `/public/robots.txt`:

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /*/admin
Disallow: /api/

Sitemap: https://mappingbitcoin.com/sitemap.xml
Sitemap: https://mappingbitcoin.com/countries/sitemap.xml
Sitemap: https://mappingbitcoin.com/categories/sitemap.xml
```

### Sitemaps

| Sitemap | Location | Contents |
|---------|----------|----------|
| Main | `/sitemap.xml` | Static pages, docs, blog, merchant directories |
| Countries | `/countries/sitemap.xml` | Dynamic country/city pages |
| Categories | `/categories/sitemap.xml` | Dynamic category pages |

**Sitemap Properties:**
- `lastmod`: When content was last modified
- `changefreq`: How often content changes (daily, weekly, monthly)
- `priority`: Relative importance (0.0 - 1.0)

### Page Speed

- Use `next/image` for optimized images
- Lazy load below-fold content
- Minimize JavaScript bundle size
- Use WebP images with fallbacks

---

## Internationalization

### Translation Files

SEO content is split between two locations:

**1. Metadata (`i18n/seo/*.ts`):**
- Page titles
- Meta descriptions
- Open Graph content
- Twitter card content
- Keywords

**2. Page Content (`public/locales/{locale}/*.json`):**
- sr-only content
- Visible headings and text
- JSON-LD names and descriptions
- Breadcrumb labels

### Adding New Languages

1. Create translations in `i18n/seo/*.ts` for the new locale
2. Create translation files in `public/locales/{locale}/`
3. Add locale to routing configuration
4. Update hreflang tags

---

## Checklist for New Pages

Before publishing a new page, verify:

- [ ] Title is under 60 characters
- [ ] Description is under 160 characters
- [ ] Open Graph tags are complete
- [ ] Twitter Card tags are complete
- [ ] JSON-LD structured data is valid (test with Google Rich Results)
- [ ] Only one H1 tag exists
- [ ] Heading hierarchy is correct (no skipped levels)
- [ ] sr-only content includes detailed SEO text
- [ ] Canonical URL is set
- [ ] Page is included in sitemap
- [ ] Internal links use descriptive anchor text
- [ ] Breadcrumbs are implemented (visible and JSON-LD)
- [ ] All text is translatable (no hardcoded strings)
- [ ] Images have alt text

---

## Tools for Validation

- **JSON-LD**: [Google Rich Results Test](https://search.google.com/test/rich-results)
- **Open Graph**: [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- **Twitter Cards**: [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- **General SEO**: [Google Search Console](https://search.google.com/search-console)
- **Lighthouse**: Chrome DevTools → Lighthouse → SEO audit

---

## File Structure Reference

```
i18n/
└── seo/
    ├── index.ts          # Exports all SEO modules
    ├── types.ts          # TypeScript types
    ├── utils.ts          # Helper functions
    ├── home.ts           # Home page SEO
    ├── map.ts            # Map page SEO
    ├── categories.ts     # Categories SEO
    ├── countries.ts      # Countries SEO
    ├── places.ts         # Places SEO
    ├── blog.ts           # Blog SEO
    ├── docs.ts           # Docs SEO
    ├── contact.ts        # Contact SEO
    ├── stats.ts          # Stats SEO
    └── legal.ts          # Legal pages SEO

public/
└── locales/
    └── en/
        ├── home.json         # Home page translations
        ├── map.json          # Map page translations
        ├── categories.json   # Categories translations
        ├── countries.json    # Countries translations
        ├── stats.json        # Stats translations
        └── ...
```
