# SEO Audit Script

A comprehensive, zero-external-dependency SEO audit CLI tool that can audit **any website** following [Ahrefs](https://ahrefs.com) methodology. It crawls pages, checks on-page SEO, technical SEO, content quality, social tags, structured data, and produces a health score.

## Overview

The SEO audit script performs the following in order:

1. Fetches and validates `robots.txt`
2. Fetches and validates `sitemap.xml` (including sitemap index support)
3. Crawls the site up to the configured page and depth limits
4. Runs 8 parallel check categories on every crawled page
5. Detects site-wide issues (duplicates, orphan pages, redirect chains, sitemap mismatches)
6. Calculates a health score based on the Ahrefs formula
7. Outputs a report in console, JSON, or CSV format

Built entirely on Node.js built-in APIs (native `fetch`, `fs`, `path`). No npm dependencies are required beyond the TypeScript runner (`tsx`).

## Quick Start

```bash
# Basic audit with default settings (50 pages, depth 3)
npx tsx scripts/seo-audit/index.ts --url https://example.com

# Deep audit with JSON file output
npx tsx scripts/seo-audit/index.ts --url https://example.com --max-pages 100 --output json --output-file report.json

# Include external link checking
npx tsx scripts/seo-audit/index.ts --url https://example.com --check-external

# CSV output for spreadsheet analysis
npx tsx scripts/seo-audit/index.ts --url https://example.com --output csv --output-file report.csv

# Fast audit (fewer pages, higher concurrency)
npx tsx scripts/seo-audit/index.ts --url https://example.com --max-pages 10 --concurrency 10
```

## CLI Options

| Option | Type | Default | Description |
|---|---|---|---|
| `--url <url>` | string | **(required)** | The website URL to audit |
| `--max-pages <n>` | number | `50` | Maximum number of pages to crawl |
| `--max-depth <n>` | number | `3` | Maximum crawl depth from start URL |
| `--check-external` | flag | `false` | Also check external links for broken links |
| `--output <format>` | string | `console` | Output format: `console`, `json`, or `csv` |
| `--output-file <path>` | string | *(stdout)* | Write results to a file instead of stdout |
| `--concurrency <n>` | number | `5` | Number of parallel HTTP requests |
| `--timeout <ms>` | number | `15000` | Request timeout in milliseconds |
| `--help` | flag | | Show usage information |

## What It Checks

### Technical SEO

These checks correspond to the "Technical" category in an Ahrefs Site Audit.

| Check | Severity | Description |
|---|---|---|
| robots.txt missing | Warning | Site has no robots.txt file |
| robots.txt blocks all crawlers | Error | `Disallow: /` blocks search engines |
| robots.txt blocks specific paths | Notice | Specific paths are disallowed |
| sitemap.xml missing | Warning | No sitemap found at `/sitemap.xml` or in robots.txt |
| Sitemap empty | Warning | Sitemap exists but contains zero URLs |
| Canonical tag missing | Warning | Page lacks a `<link rel="canonical">` |
| Multiple canonical tags | Error | More than one canonical on a page |
| Canonical not absolute URL | Error | Canonical href is a relative path |
| Cross-domain canonical | Warning | Canonical points to a different domain |
| Non-self-referencing canonical | Notice | Canonical points to a different same-domain URL |
| Hreflang missing self-reference | Warning | Hreflang set does not include the current page |
| Hreflang missing x-default | Notice | No `x-default` hreflang tag |
| Hreflang invalid language code | Warning | Language code does not match ISO 639-1 |
| Redirect chains | Warning | More than 1 redirect hop |
| HTTP status 4xx / 5xx | Error | Page returns a client or server error |
| Page unreachable (timeout) | Error | Page could not be fetched |
| HTTPS mixed content | Warning | HTTPS page links to HTTP resources |

### On-Page SEO

These checks align with Ahrefs "On Page" audit recommendations.

| Check | Severity | Description |
|---|---|---|
| Title tag missing | Error | No `<title>` element in `<head>` |
| Title empty | Error | Title tag exists but is empty |
| Title too long (>60 chars) | Warning | May be truncated in SERPs |
| Title too short (<30 chars) | Notice | May not be descriptive enough |
| Multiple title tags | Error | More than one `<title>` on the page |
| Meta description missing | Warning | No `<meta name="description">` |
| Meta description empty | Warning | Description exists but is empty |
| Meta description too long (>160) | Notice | May be truncated in SERPs |
| Meta description too short (<70) | Notice | May not be compelling enough |
| Multiple meta descriptions | Warning | Conflicting meta descriptions |
| Viewport meta missing | Warning | Not mobile-responsive |
| H1 tag missing | Error | Page lacks a primary heading |
| Multiple H1 tags | Warning | Best practice is exactly one H1 |
| H1 too long (>70 chars) | Notice | May be too verbose |
| Heading hierarchy skips | Warning | Jumps levels (e.g., H1 to H3) |
| Empty headings | Warning | Heading tag with no text |
| Images without alt text | Warning | Accessibility and SEO issue |
| Low word count (<300 words) | Notice | Thin content signal |
| Meta noindex directive | Notice | Page excluded from indexing |

### Content and Links

| Check | Severity | Description |
|---|---|---|
| Broken internal links | Error | Internal links returning 4xx/5xx |
| Broken external links | Warning | External links returning 4xx/5xx (requires `--check-external`) |
| Orphan pages | Warning | Pages not linked from any other crawled page |
| Generic anchor text | Notice | Links using "click here", "read more", etc. |
| Empty anchor text | Warning | Links with no visible text |
| Pages in sitemap but broken | Error | Sitemap URL returns 4xx/5xx |
| Pages crawled but not in sitemap | Notice | Indexable page missing from sitemap |
| Nofollow internal links | Notice | Internal links with `rel="nofollow"` |

### Social and Structured Data

| Check | Severity | Description |
|---|---|---|
| Open Graph title missing | Notice | No `og:title` meta tag |
| Open Graph description missing | Notice | No `og:description` meta tag |
| Open Graph image missing | Notice | No `og:image` meta tag |
| Twitter Card missing | Notice | No `twitter:card` meta tag |
| JSON-LD missing | Notice | No structured data on the page |
| JSON-LD parse errors | Warning | Invalid JSON in `<script type="application/ld+json">` |
| JSON-LD missing @context | Warning | Schema.org context not declared |
| JSON-LD missing @type | Warning | No type specified in structured data |

### Site-Wide Issues

These issues are detected by comparing data across all crawled pages:

| Check | Severity | Description |
|---|---|---|
| Duplicate titles | Warning | Multiple pages share the same `<title>` |
| Duplicate meta descriptions | Warning | Multiple pages share the same meta description |
| Duplicate H1 headings | Warning | Multiple pages share the same H1 text |
| Redirect chains | Warning | Multi-hop redirects detected during crawl |

## Health Score Calculation

The health score follows the Ahrefs methodology:

```
Health Score = (Pages without errors / Total pages) x 100
```

- Only issues with severity `error` count against the health score
- Warnings, notices, and passes do not reduce the score
- A health score of 100% means zero errors were found on any crawled page

**Score interpretation:**

| Score | Rating | Action |
|---|---|---|
| 80-100% | Good | Minor tweaks only |
| 60-79% | Needs work | Address errors systematically |
| 0-59% | Critical | Prioritize fixing errors immediately |

## Severity Levels

Issues are categorized into four severity levels:

| Level | Color | Impact | Examples |
|---|---|---|---|
| **Error** | Red | Affects health score, likely hurts rankings | Missing title, broken links, 4xx/5xx pages |
| **Warning** | Yellow | Should be fixed, potential SEO impact | Missing meta description, multiple H1s, duplicate content |
| **Notice** | Blue | Best practice recommendations | Short descriptions, missing OG tags, thin content |
| **Pass** | Green | Check passed successfully | Self-referencing canonical is correct |

## Output Formats

### Console (default)

Colorized output to the terminal showing a summary, per-page issues, and site-wide issues. Ideal for quick audits during development.

### JSON

Structured JSON output containing the full audit data. Useful for programmatic analysis, CI/CD pipelines, or importing into dashboards.

```bash
npx tsx scripts/seo-audit/index.ts --url https://example.com --output json --output-file report.json
```

The JSON structure:

```json
{
  "url": "https://example.com",
  "timestamp": "2026-03-14T12:00:00.000Z",
  "pages": [
    {
      "url": "https://example.com/",
      "statusCode": 200,
      "responseTime": 250,
      "issues": [ ... ],
      "meta": { ... }
    }
  ],
  "siteWideIssues": [ ... ],
  "robotsTxt": { "exists": true, "issues": [ ... ] },
  "sitemap": { "exists": true, "urls": [ ... ], "issues": [ ... ] },
  "summary": {
    "totalPages": 42,
    "totalIssues": 15,
    "errors": 3,
    "warnings": 7,
    "notices": 4,
    "passes": 1,
    "healthScore": 93
  }
}
```

### CSV

Flat CSV output with one row per issue. Suitable for importing into spreadsheets or data analysis tools.

```bash
npx tsx scripts/seo-audit/index.ts --url https://example.com --output csv --output-file report.csv
```

Columns: `URL, Check, Severity, Message, Details`

## Ahrefs Guidelines Reference

This tool implements checks based on the following Ahrefs audit methodology:

| Ahrefs Category | Our Checks | Reference |
|---|---|---|
| Crawlability | robots.txt, sitemap, HTTP status, redirects | [Ahrefs Site Audit](https://ahrefs.com/site-audit) |
| On-Page SEO | Title tags, meta descriptions, headings, images | [On-Page SEO Guide](https://ahrefs.com/blog/on-page-seo/) |
| Internal Linking | Orphan pages, broken links, anchor text | [Internal Links Guide](https://ahrefs.com/blog/internal-links-for-seo/) |
| Content Quality | Word count, thin content detection | [Content Audit Guide](https://ahrefs.com/blog/content-audit/) |
| Structured Data | JSON-LD validation, Schema.org checks | [Schema Markup Guide](https://ahrefs.com/blog/schema-markup/) |
| Social Tags | Open Graph, Twitter Cards | [Social Tags Guide](https://ahrefs.com/blog/open-graph-meta-tags/) |
| Health Score | (error-free pages / total) x 100 | [Site Health Score](https://ahrefs.com/blog/site-audit/) |

### Key Ahrefs Thresholds Used

- **Title length**: 30-60 characters (Ahrefs recommended range)
- **Meta description length**: 70-160 characters
- **H1 length**: 70 characters max
- **Thin content**: below 300 words
- **Redirect chains**: flagged at 2+ hops

## Extending the Script

To add a custom check, create a new file in `scripts/seo-audit/checks/` that exports a function matching this signature:

```typescript
// scripts/seo-audit/checks/my-custom-check.ts
import type { Issue } from '../types.js';

export function checkMyCustomThing(html: string, url: string): Issue[] {
  const issues: Issue[] = [];

  // Your check logic here
  // Parse HTML with regex (no external DOM parser dependencies)

  if (/* something is wrong */) {
    issues.push({
      check: 'my-custom-check',
      severity: 'warning',
      message: 'Description of the issue',
      url,
      details: 'Optional additional context',
    });
  }

  return issues;
}
```

Then import and call it in `index.ts` alongside the other checks:

```typescript
import { checkMyCustomThing } from './checks/my-custom-check.js';

// Inside auditPage():
const allIssues: Issue[] = [
  ...checkMeta(html, url),
  ...checkHeadings(html, url),
  // ... existing checks
  ...checkMyCustomThing(html, url),  // Add here
];
```

### Check Function Contract

- **Input**: Raw HTML string and the page URL
- **Output**: Array of `Issue` objects (can be empty if all checks pass)
- **No side effects**: Checks must be pure functions
- **No external dependencies**: Use regex-based HTML parsing, not DOM parsers

## npm Scripts

Add these to `package.json` for convenience:

```json
{
  "scripts": {
    "seo:audit": "tsx scripts/seo-audit/index.ts",
    "seo:audit:json": "tsx scripts/seo-audit/index.ts --output json"
  }
}
```

Usage:

```bash
# Run with npm scripts
npm run seo:audit -- --url https://example.com
npm run seo:audit:json -- --url https://example.com --output-file report.json

# Or directly with npx
npx tsx scripts/seo-audit/index.ts --url https://example.com
```

## Architecture

```
scripts/seo-audit/
  index.ts                  # CLI entry point and orchestrator
  types.ts                  # Shared TypeScript types and defaults
  checks/
    meta.ts                 # Title and meta description checks
    headings.ts             # H1-H6 heading structure checks
    images.ts               # Image alt text and optimization checks
    social.ts               # Open Graph and Twitter Card checks
    canonical.ts            # Canonical URL validation
    hreflang.ts             # Hreflang tag validation
    structured-data.ts      # JSON-LD schema markup checks
    links.ts                # Internal and external link checks
    robots.ts               # robots.txt validation
    sitemap.ts              # sitemap.xml validation
  utils/
    crawler.ts              # Site crawler with redirect tracking
    reporter.ts             # Output formatters (console, JSON, CSV)
```

All imports use `.js` extensions for ESM compatibility with TypeScript.

## Requirements

- **Node.js 18+** (uses native `fetch`)
- **tsx** (TypeScript execution, already a project dependency)
- No additional npm packages needed
