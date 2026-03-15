#!/usr/bin/env node

/**
 * SEO Audit CLI — Following Ahrefs Guidelines
 *
 * A comprehensive, zero-dependency (Node.js built-ins only) SEO audit tool
 * that can audit ANY website. Crawls pages, checks on-page SEO, technical SEO,
 * content quality, structured data, and produces a health score.
 *
 * Usage:
 *   npx tsx scripts/seo-audit/index.ts --url https://example.com
 *   npx tsx scripts/seo-audit/index.ts --url https://example.com --max-pages 100 --output json
 */

import { type AuditConfig, DEFAULT_CONFIG, type SiteAudit, type PageAudit, type Issue } from './types.js';
import { crawlSite, fetchRobotsTxt, fetchSitemap } from './utils/crawler.js';
import { printReport, toJSON, toCSV } from './utils/reporter.js';
import { checkMeta } from './checks/meta.js';
import { checkHeadings } from './checks/headings.js';
import { checkImages } from './checks/images.js';
import { checkSocial } from './checks/social.js';
import { checkCanonical } from './checks/canonical.js';
import { checkHreflang } from './checks/hreflang.js';
import { checkStructuredData } from './checks/structured-data.js';
import { checkLinks } from './checks/links.js';
import { checkRobotsTxt } from './checks/robots.js';
import { checkSitemap } from './checks/sitemap.js';
import { checkUrlStructure } from './checks/url-structure.js';
import { checkPerformance } from './checks/performance.js';
import { checkContent, detectCannibalization } from './checks/content.js';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ---------------------------------------------------------------------------
// ANSI color helpers (no dependencies)
// ---------------------------------------------------------------------------

const supportsColor = process.stdout.isTTY !== false;

const c = {
  reset: supportsColor ? '\x1b[0m' : '',
  bold: supportsColor ? '\x1b[1m' : '',
  dim: supportsColor ? '\x1b[2m' : '',
  red: supportsColor ? '\x1b[31m' : '',
  green: supportsColor ? '\x1b[32m' : '',
  yellow: supportsColor ? '\x1b[33m' : '',
  blue: supportsColor ? '\x1b[34m' : '',
  cyan: supportsColor ? '\x1b[36m' : '',
  white: supportsColor ? '\x1b[37m' : '',
  bgRed: supportsColor ? '\x1b[41m' : '',
  bgGreen: supportsColor ? '\x1b[42m' : '',
  bgYellow: supportsColor ? '\x1b[43m' : '',
  bgBlue: supportsColor ? '\x1b[44m' : '',
};

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface CliArgs {
  url: string;
  maxPages: number;
  maxDepth: number;
  checkExternal: boolean;
  output: 'console' | 'json' | 'csv';
  outputFile?: string;
  concurrency: number;
  timeout: number;
  help: boolean;
}

function printUsage(): void {
  console.log(`
${c.bold}SEO Audit CLI${c.reset} — Following Ahrefs Guidelines

${c.bold}Usage:${c.reset}
  npx tsx scripts/seo-audit/index.ts --url <url> [options]

${c.bold}Required:${c.reset}
  --url <url>            The website URL to audit (e.g., https://example.com)

${c.bold}Options:${c.reset}
  --max-pages <n>        Maximum pages to crawl (default: 50)
  --max-depth <n>        Maximum crawl depth from start URL (default: 3)
  --check-external       Also check external links for broken links
  --output <format>      Output format: console, json, csv (default: console)
  --output-file <path>   Write results to a file instead of stdout
  --concurrency <n>      Number of parallel requests (default: 5)
  --timeout <ms>         Request timeout in milliseconds (default: 15000)
  --help                 Show this help message

${c.bold}Examples:${c.reset}
  ${c.dim}# Basic audit with defaults${c.reset}
  npx tsx scripts/seo-audit/index.ts --url https://example.com

  ${c.dim}# Deep audit with JSON output${c.reset}
  npx tsx scripts/seo-audit/index.ts --url https://example.com --max-pages 200 --max-depth 5 --output json --output-file report.json

  ${c.dim}# Check external links too${c.reset}
  npx tsx scripts/seo-audit/index.ts --url https://example.com --check-external

  ${c.dim}# Fast audit (fewer pages, higher concurrency)${c.reset}
  npx tsx scripts/seo-audit/index.ts --url https://example.com --max-pages 10 --concurrency 10
`);
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    url: '',
    maxPages: DEFAULT_CONFIG.maxPages,
    maxDepth: DEFAULT_CONFIG.maxDepth,
    checkExternal: DEFAULT_CONFIG.checkExternalLinks,
    output: 'console',
    outputFile: undefined,
    concurrency: DEFAULT_CONFIG.concurrency,
    timeout: DEFAULT_CONFIG.timeout,
    help: false,
  };

  // Skip the first two entries (node/tsx executable and script path)
  const raw = argv.slice(2);

  for (let i = 0; i < raw.length; i++) {
    const arg = raw[i];

    switch (arg) {
      case '--url':
        args.url = raw[++i] ?? '';
        break;
      case '--max-pages':
        args.maxPages = parseInt(raw[++i], 10) || DEFAULT_CONFIG.maxPages;
        break;
      case '--max-depth':
        args.maxDepth = parseInt(raw[++i], 10) || DEFAULT_CONFIG.maxDepth;
        break;
      case '--check-external':
        args.checkExternal = true;
        break;
      case '--output':
        {
          const val = (raw[++i] ?? 'console').toLowerCase();
          if (val === 'json' || val === 'csv' || val === 'console') {
            args.output = val;
          } else {
            console.error(`Unknown output format: ${val}. Using "console".`);
            args.output = 'console';
          }
        }
        break;
      case '--output-file':
        args.outputFile = raw[++i];
        break;
      case '--concurrency':
        args.concurrency = parseInt(raw[++i], 10) || DEFAULT_CONFIG.concurrency;
        break;
      case '--timeout':
        args.timeout = parseInt(raw[++i], 10) || DEFAULT_CONFIG.timeout;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}. Use --help for usage.`);
        }
    }
  }

  return args;
}

// ---------------------------------------------------------------------------
// Page-level audit: run all checks in parallel
// ---------------------------------------------------------------------------

function auditPage(html: string, url: string, statusCode: number, responseTime: number): PageAudit {
  // Extract meta information for site-wide comparison
  const meta = extractPageMeta(html);

  // Run all page-level checks
  const allIssues: Issue[] = [
    ...checkMeta(html, url),
    ...checkHeadings(html, url),
    ...checkImages(html, url),
    ...checkSocial(html, url),
    ...checkCanonical(html, url),
    ...checkHreflang(html, url),
    ...checkStructuredData(html, url),
    ...checkLinks(html, url),
    ...checkUrlStructure(url),
    ...checkPerformance(html, url),
    ...checkContent(html, url, meta.wordCount),
  ];

  return {
    url,
    statusCode,
    responseTime,
    issues: allIssues,
    meta,
  };
}

/**
 * Extract metadata from a page for site-wide duplicate detection.
 */
function extractPageMeta(html: string): PageAudit['meta'] {
  const head = getHeadSection(html);

  // Title
  const titleMatch = html.match(/<title[\s>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(stripTags(titleMatch[1]).trim()) : undefined;

  // Meta description
  const descMatch = head.match(
    /<meta\s+[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*\/?>/i
  ) ?? head.match(
    /<meta\s+[^>]*content\s*=\s*["']([^"']*)["'][^>]*name\s*=\s*["']description["'][^>]*\/?>/i
  );
  const description = descMatch ? decodeEntities(descMatch[1].trim()) : undefined;

  // Canonical
  const canonicalMatch = head.match(
    /<link[^>]+rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']*)["'][^>]*\/?>/i
  ) ?? head.match(
    /<link[^>]+href\s*=\s*["']([^"']*)["'][^>]*rel\s*=\s*["']canonical["'][^>]*\/?>/i
  );
  const canonical = canonicalMatch ? canonicalMatch[1].trim() : undefined;

  // Meta robots
  const robotsMatch = head.match(
    /<meta\s+[^>]*name\s*=\s*["']robots["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*\/?>/i
  ) ?? head.match(
    /<meta\s+[^>]*content\s*=\s*["']([^"']*)["'][^>]*name\s*=\s*["']robots["'][^>]*\/?>/i
  );
  const robots = robotsMatch ? robotsMatch[1].trim() : undefined;

  // Open Graph
  const ogTitle = getMetaProperty(head, 'og:title');
  const ogDescription = getMetaProperty(head, 'og:description');
  const ogImage = getMetaProperty(head, 'og:image');
  const ogUrl = getMetaProperty(head, 'og:url');
  const ogType = getMetaProperty(head, 'og:type');

  // Twitter Card
  const twitterCard = getMetaName(head, 'twitter:card');
  const twitterTitle = getMetaName(head, 'twitter:title');
  const twitterDescription = getMetaName(head, 'twitter:description');
  const twitterImage = getMetaName(head, 'twitter:image');

  // Headings
  const h1s = extractHeadingTexts(html, 1);
  const h2s = extractHeadingTexts(html, 2);
  const headingOrder = extractHeadingOrder(html);

  // Hreflang tags
  const hreflangTags = extractHreflangTags(head);

  // JSON-LD structured data
  const jsonLd = extractJsonLd(html);

  // Word count (text content of <body>)
  const wordCount = countWords(html);

  // Images
  const images = extractImages(html);
  const imageCount = images.length;
  const imagesWithoutAlt = images.filter((img) => !img.hasAlt).map((img) => img.src);

  // Links
  const { internalLinks, externalLinks } = extractLinksFromHtml(html);

  return {
    title,
    titleLength: title?.length ?? 0,
    description,
    descriptionLength: description?.length ?? 0,
    canonical,
    robots,
    ogTitle,
    ogDescription,
    ogImage,
    ogUrl,
    ogType,
    twitterCard,
    twitterTitle,
    twitterDescription,
    twitterImage,
    h1s,
    h2s,
    headingOrder,
    hreflangTags,
    jsonLd,
    wordCount,
    imageCount,
    imagesWithoutAlt,
    internalLinks,
    externalLinks,
  };
}

// ---------------------------------------------------------------------------
// HTML extraction helpers (lightweight, no DOM parser)
// ---------------------------------------------------------------------------

function getHeadSection(html: string): string {
  const match = html.match(/<head[\s>]([\s\S]*?)<\/head>/i);
  return match ? match[1] : html;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');
}

function stripTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

function getMetaProperty(head: string, property: string): string | undefined {
  const match = head.match(
    new RegExp(
      `<meta\\s+[^>]*property\\s*=\\s*["']${property}["'][^>]*content\\s*=\\s*["']([^"']*)["'][^>]*/?>`,
      'i'
    )
  ) ?? head.match(
    new RegExp(
      `<meta\\s+[^>]*content\\s*=\\s*["']([^"']*)["'][^>]*property\\s*=\\s*["']${property}["'][^>]*/?>`,
      'i'
    )
  );
  return match ? decodeEntities(match[1].trim()) : undefined;
}

function getMetaName(head: string, name: string): string | undefined {
  const match = head.match(
    new RegExp(
      `<meta\\s+[^>]*name\\s*=\\s*["']${name}["'][^>]*content\\s*=\\s*["']([^"']*)["'][^>]*/?>`,
      'i'
    )
  ) ?? head.match(
    new RegExp(
      `<meta\\s+[^>]*content\\s*=\\s*["']([^"']*)["'][^>]*name\\s*=\\s*["']${name}["'][^>]*/?>`,
      'i'
    )
  );
  return match ? decodeEntities(match[1].trim()) : undefined;
}

function extractHeadingTexts(html: string, level: number): string[] {
  const results: string[] = [];
  const regex = new RegExp(`<h${level}[\\s>][^>]*>([\\s\\S]*?)<\\/h${level}>`, 'gi');
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    results.push(decodeEntities(stripTags(match[1]).trim()));
  }
  return results;
}

function extractHeadingOrder(html: string): string[] {
  const order: string[] = [];
  const regex = /<h([1-6])[\s>][^>]*>[\s\S]*?<\/h\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    order.push(`H${match[1]}`);
  }
  return order;
}

function extractHreflangTags(head: string): { lang: string; href: string }[] {
  const tags: { lang: string; href: string }[] = [];
  const regex = /<link[^>]+rel\s*=\s*["']alternate["'][^>]+hreflang\s*=\s*["']([^"']*)["'][^>]+href\s*=\s*["']([^"']*)["'][^>]*\/?>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(head)) !== null) {
    tags.push({ lang: match[1], href: match[2] });
  }
  // Also handle reversed attribute order (href before hreflang)
  const regex2 = /<link[^>]+href\s*=\s*["']([^"']*)["'][^>]+hreflang\s*=\s*["']([^"']*)["'][^>]*\/?>/gi;
  while ((match = regex2.exec(head)) !== null) {
    // Avoid duplicates
    const href = match[1];
    const lang = match[2];
    if (!tags.some((t) => t.lang === lang && t.href === href)) {
      tags.push({ lang, href });
    }
  }
  return tags;
}

function extractJsonLd(html: string): object[] {
  const results: object[] = [];
  const regex = /<script\s+[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      results.push(parsed);
    } catch {
      // Invalid JSON-LD; will be caught by structured-data check
    }
  }
  return results;
}

function countWords(html: string): number {
  // Extract body content
  const bodyMatch = html.match(/<body[\s>]([\s\S]*?)<\/body>/i);
  let bodyText = bodyMatch ? bodyMatch[1] : html;

  // Remove scripts, styles, and non-visible elements
  bodyText = bodyText.replace(/<script[\s>][\s\S]*?<\/script>/gi, '');
  bodyText = bodyText.replace(/<style[\s>][\s\S]*?<\/style>/gi, '');
  bodyText = bodyText.replace(/<noscript[\s>][\s\S]*?<\/noscript>/gi, '');
  bodyText = bodyText.replace(/<!--[\s\S]*?-->/g, '');

  const text = stripTags(bodyText).trim();
  if (!text) return 0;

  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

function extractImages(html: string): { src: string; hasAlt: boolean }[] {
  const images: { src: string; hasAlt: boolean }[] = [];
  const regex = /<img\s([^>]*)>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const attrs = match[1];
    const srcMatch = attrs.match(/src\s*=\s*["']([^"']*)["']/i);
    const altMatch = attrs.match(/alt\s*=\s*["']([^"']*)["']/i);
    const src = srcMatch ? srcMatch[1] : '(no src)';
    const hasAlt = altMatch !== null && altMatch[1].trim().length > 0;
    images.push({ src, hasAlt });
  }
  return images;
}

function extractLinksFromHtml(
  html: string
): { internalLinks: { href: string; text: string }[]; externalLinks: { href: string; text: string }[] } {
  const internalLinks: { href: string; text: string }[] = [];
  const externalLinks: { href: string; text: string }[] = [];

  const regex = /<a\s([^>]*?)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const attrs = match[1];
    const hrefMatch = attrs.match(/href\s*=\s*["']([^"']*)["']/i);
    if (!hrefMatch) continue;

    const href = hrefMatch[1].trim();
    const text = decodeEntities(stripTags(match[2]).trim());

    // Skip non-HTTP links
    if (/^(javascript|mailto|tel|data):/i.test(href)) continue;

    if (/^https?:\/\//i.test(href)) {
      externalLinks.push({ href, text });
    } else {
      internalLinks.push({ href, text });
    }
  }

  return { internalLinks, externalLinks };
}

// ---------------------------------------------------------------------------
// Site-wide issue detection
// ---------------------------------------------------------------------------

function detectSiteWideIssues(
  pages: PageAudit[],
  sitemapUrls: string[],
  crawledUrls: Set<string>,
  redirectChains: Map<string, string[]>,
): Issue[] {
  const issues: Issue[] = [];

  // --- Duplicate titles ---
  const titleMap = new Map<string, string[]>();
  for (const page of pages) {
    if (page.meta.title) {
      const key = page.meta.title.toLowerCase().trim();
      if (!titleMap.has(key)) titleMap.set(key, []);
      titleMap.get(key)!.push(page.url);
    }
  }
  for (const [title, urls] of Array.from(titleMap.entries())) {
    if (urls.length > 1) {
      issues.push({
        check: 'duplicate-title',
        severity: 'warning',
        message: `Duplicate title found on ${urls.length} pages`,
        details: `Title: "${title}"\nPages: ${urls.join(', ')}`,
      });
    }
  }

  // --- Duplicate meta descriptions ---
  const descMap = new Map<string, string[]>();
  for (const page of pages) {
    if (page.meta.description) {
      const key = page.meta.description.toLowerCase().trim();
      if (!descMap.has(key)) descMap.set(key, []);
      descMap.get(key)!.push(page.url);
    }
  }
  for (const [desc, urls] of Array.from(descMap.entries())) {
    if (urls.length > 1) {
      issues.push({
        check: 'duplicate-description',
        severity: 'warning',
        message: `Duplicate meta description found on ${urls.length} pages`,
        details: `Description: "${desc.slice(0, 100)}..."\nPages: ${urls.join(', ')}`,
      });
    }
  }

  // --- Duplicate H1s ---
  const h1Map = new Map<string, string[]>();
  for (const page of pages) {
    for (const h1 of page.meta.h1s) {
      const key = h1.toLowerCase().trim();
      if (!h1Map.has(key)) h1Map.set(key, []);
      h1Map.get(key)!.push(page.url);
    }
  }
  for (const [h1, urls] of Array.from(h1Map.entries())) {
    if (urls.length > 1) {
      issues.push({
        check: 'duplicate-h1',
        severity: 'warning',
        message: `Duplicate H1 found on ${urls.length} pages`,
        details: `H1: "${h1}"\nPages: ${urls.join(', ')}`,
      });
    }
  }

  // --- Orphan pages (not linked from any other crawled page) ---
  const linkedUrls = new Set<string>();
  for (const page of pages) {
    for (const link of page.meta.internalLinks) {
      // Resolve relative links using the page URL as base
      try {
        const resolved = new URL(link.href, page.url).toString();
        linkedUrls.add(normalizeUrlForComparison(resolved));
      } catch {
        // Skip malformed links
      }
    }
  }

  for (const page of pages) {
    const normalized = normalizeUrlForComparison(page.url);
    // The start URL is always linked (it's the entry point)
    if (pages.indexOf(page) > 0 && !linkedUrls.has(normalized)) {
      issues.push({
        check: 'orphan-page',
        severity: 'warning',
        message: 'Orphan page: not linked from any other crawled page',
        url: page.url,
        details: 'This page was discovered but no other crawled page links to it internally.',
      });
    }
  }

  // --- Redirect chains ---
  for (const [url, chain] of Array.from(redirectChains.entries())) {
    if (chain.length > 1) {
      issues.push({
        check: 'redirect-chain',
        severity: 'warning',
        message: `Redirect chain detected (${chain.length} hops)`,
        url,
        details: `Chain: ${chain.join(' -> ')} -> ${url}`,
      });
    }
  }

  // --- Pages in sitemap but not crawlable (4xx/5xx) ---
  const crawledStatusMap = new Map<string, number>();
  for (const page of pages) {
    crawledStatusMap.set(normalizeUrlForComparison(page.url), page.statusCode);
  }

  for (const sitemapUrl of sitemapUrls) {
    const normalizedSitemapUrl = normalizeUrlForComparison(sitemapUrl);
    const statusCode = crawledStatusMap.get(normalizedSitemapUrl);
    if (statusCode !== undefined && statusCode >= 400) {
      issues.push({
        check: 'sitemap-broken-url',
        severity: 'error',
        message: `Sitemap URL returns ${statusCode}`,
        url: sitemapUrl,
        details: `This URL is listed in the sitemap but returns HTTP ${statusCode}.`,
      });
    }
  }

  // --- Pages crawled but not in sitemap ---
  const sitemapNormalized = new Set(sitemapUrls.map(normalizeUrlForComparison));
  if (sitemapUrls.length > 0) {
    for (const page of pages) {
      const normalizedPageUrl = normalizeUrlForComparison(page.url);
      if (!sitemapNormalized.has(normalizedPageUrl) && page.statusCode >= 200 && page.statusCode < 300) {
        issues.push({
          check: 'not-in-sitemap',
          severity: 'notice',
          message: 'Page is crawlable but not listed in sitemap',
          url: page.url,
        });
      }
    }
  }

  return issues;
}

function normalizeUrlForComparison(urlStr: string): string {
  try {
    let normalized = urlStr.toLowerCase().trim();
    normalized = normalized.replace(/#.*$/, '');
    normalized = normalized.replace(/\/+$/, '') || '/';
    normalized = normalized.replace(/:80(\/|$)/, '$1').replace(/:443(\/|$)/, '$1');
    return normalized;
  } catch {
    return urlStr.toLowerCase().trim();
  }
}

// ---------------------------------------------------------------------------
// Health score calculation
// ---------------------------------------------------------------------------

function calculateHealthScore(pages: PageAudit[]): number {
  if (pages.length === 0) return 0;

  const pagesWithErrors = pages.filter((page) =>
    page.issues.some((issue) => issue.severity === 'error')
  ).length;

  const pagesWithoutErrors = pages.length - pagesWithErrors;
  return Math.round((pagesWithoutErrors / pages.length) * 100);
}

// ---------------------------------------------------------------------------
// Progress logging
// ---------------------------------------------------------------------------

function logStep(step: string, detail?: string): void {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const detailStr = detail ? ` ${c.dim}${detail}${c.reset}` : '';
  console.log(`${c.dim}[${timestamp}]${c.reset} ${c.cyan}${step}${c.reset}${detailStr}`);
}

function printBanner(url: string): void {
  console.log('');
  console.log(`${c.bold}============================================${c.reset}`);
  console.log(`${c.bold}  SEO Audit -- Following Ahrefs Guidelines  ${c.reset}`);
  console.log(`${c.bold}============================================${c.reset}`);
  console.log(`${c.dim}  Target:${c.reset} ${c.cyan}${url}${c.reset}`);
  console.log(`${c.dim}  Date:${c.reset}   ${new Date().toISOString().split('T')[0]}`);
  console.log(`${c.bold}============================================${c.reset}`);
  console.log('');
}

// ---------------------------------------------------------------------------
// Main audit orchestrator
// ---------------------------------------------------------------------------

async function runAudit(cliArgs: CliArgs): Promise<SiteAudit> {
  const config: AuditConfig = {
    url: cliArgs.url,
    maxPages: cliArgs.maxPages,
    maxDepth: cliArgs.maxDepth,
    checkExternalLinks: cliArgs.checkExternal,
    concurrency: cliArgs.concurrency,
    timeout: cliArgs.timeout,
    userAgent: DEFAULT_CONFIG.userAgent,
  };

  const origin = new URL(config.url).origin;

  // (a) Print banner
  printBanner(config.url);

  // (b) Check robots.txt
  logStep('Checking robots.txt...');
  const robotsTxtResult = await fetchRobotsTxt(origin, config);
  const robotsIssues = checkRobotsTxt(
    robotsTxtResult.content ?? null,
    config.url
  );

  if (robotsTxtResult.exists) {
    logStep('robots.txt', `found (${robotsTxtResult.content?.length ?? 0} bytes)`);
  } else {
    logStep('robots.txt', 'NOT FOUND');
  }

  // (c) Check sitemap
  logStep('Checking sitemap.xml...');
  const sitemapResult = await fetchSitemap(origin, config, robotsTxtResult.content);
  const sitemapCheck = checkSitemap(
    sitemapResult.content ?? null,
    config.url
  );

  if (sitemapResult.exists) {
    logStep('sitemap.xml', `found (${sitemapCheck.urls.length} URLs)`);
  } else {
    logStep('sitemap.xml', 'NOT FOUND');
  }

  // (d) Crawl the site
  logStep('Crawling site...', `max ${config.maxPages} pages, depth ${config.maxDepth}`);
  const startTime = Date.now();
  const crawledPages = await crawlSite(config);
  const crawlDuration = ((Date.now() - startTime) / 1000).toFixed(1);
  logStep('Crawl complete', `${crawledPages.length} pages in ${crawlDuration}s`);

  // Collect redirect chains from crawl
  const redirectChains = new Map<string, string[]>();
  for (const page of crawledPages) {
    if (page.redirectChain.length > 0) {
      redirectChains.set(page.url, page.redirectChain);
    }
  }

  // (e) Run all page-level checks
  logStep('Running page-level checks...');
  const pageAudits: PageAudit[] = [];
  let processed = 0;

  for (const page of crawledPages) {
    if (page.html && page.statusCode >= 200 && page.statusCode < 400) {
      const audit = auditPage(page.html, page.url, page.statusCode, page.responseTime);
      pageAudits.push(audit);
    } else {
      // Still record non-HTML / error pages with minimal data
      pageAudits.push({
        url: page.url,
        statusCode: page.statusCode,
        responseTime: page.responseTime,
        issues: page.statusCode >= 400 ? [{
          check: 'http-status',
          severity: 'error',
          message: `Page returns HTTP ${page.statusCode}`,
          url: page.url,
        }] : page.statusCode === 0 ? [{
          check: 'http-status',
          severity: 'error',
          message: 'Page could not be reached (timeout or network error)',
          url: page.url,
        }] : [],
        meta: {
          titleLength: 0,
          descriptionLength: 0,
          h1s: [],
          h2s: [],
          headingOrder: [],
          hreflangTags: [],
          jsonLd: [],
          wordCount: 0,
          imageCount: 0,
          imagesWithoutAlt: [],
          internalLinks: [],
          externalLinks: [],
        },
      });
    }

    processed++;
    if (processed % 10 === 0 || processed === crawledPages.length) {
      logStep('Progress', `${processed}/${crawledPages.length} pages checked`);
    }
  }

  // (f) Compile site-wide issues
  logStep('Detecting site-wide issues...');
  const crawledUrlsSet = new Set(crawledPages.map((p) => normalizeUrlForComparison(p.url)));
  const siteWideIssues = detectSiteWideIssues(
    pageAudits,
    sitemapCheck.urls,
    crawledUrlsSet,
    redirectChains,
  );

  // Content cannibalization detection
  const cannibalizationPages = pageAudits.map((p) => ({
    url: p.url,
    title: p.meta.title,
    h1s: p.meta.h1s,
    description: p.meta.description,
  }));
  const cannibalizationIssues = detectCannibalization(cannibalizationPages);

  // Combine robots and sitemap issues into site-wide
  const allSiteWideIssues = [...robotsIssues, ...sitemapCheck.issues, ...siteWideIssues, ...cannibalizationIssues];

  logStep('Site-wide issues', `${allSiteWideIssues.length} found`);

  // (g) Calculate health score
  const healthScore = calculateHealthScore(pageAudits);

  // Count all issues
  const allIssues = [...allSiteWideIssues, ...pageAudits.flatMap((p) => p.issues)];
  const errors = allIssues.filter((i) => i.severity === 'error').length;
  const warnings = allIssues.filter((i) => i.severity === 'warning').length;
  const notices = allIssues.filter((i) => i.severity === 'notice').length;
  const passes = allIssues.filter((i) => i.severity === 'pass').length;

  const siteAudit: SiteAudit = {
    url: config.url,
    timestamp: new Date().toISOString(),
    pages: pageAudits,
    siteWideIssues: allSiteWideIssues,
    robotsTxt: {
      exists: robotsTxtResult.exists,
      content: robotsTxtResult.content,
      issues: robotsIssues,
    },
    sitemap: {
      exists: sitemapResult.exists,
      urls: sitemapCheck.urls,
      issues: sitemapCheck.issues,
    },
    summary: {
      totalPages: pageAudits.length,
      totalIssues: allIssues.length,
      errors,
      warnings,
      notices,
      passes,
      healthScore,
    },
  };

  return siteAudit;
}

// ---------------------------------------------------------------------------
// Output handling
// ---------------------------------------------------------------------------

function outputResults(audit: SiteAudit, args: CliArgs): void {
  let content: string;

  switch (args.output) {
    case 'json':
      content = toJSON(audit);
      break;
    case 'csv':
      content = toCSV(audit);
      break;
    case 'console':
    default:
      if (args.outputFile) {
        // If writing console format to file, still use JSON as it is more practical
        content = toJSON(audit);
      } else {
        // Print directly to console with colors
        printReport(audit);
        return;
      }
  }

  if (args.outputFile) {
    const filePath = resolve(process.cwd(), args.outputFile);
    writeFileSync(filePath, content, 'utf-8');
    console.log(`\n${c.green}Report written to:${c.reset} ${filePath}`);
  } else {
    console.log(content);
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  if (!args.url) {
    console.error(`${c.red}Error:${c.reset} --url is required. Use --help for usage.\n`);
    printUsage();
    process.exit(1);
  }

  // Validate URL
  try {
    new URL(args.url);
  } catch {
    console.error(`${c.red}Error:${c.reset} Invalid URL: "${args.url}"\n`);
    console.error('Please provide a fully-qualified URL like https://example.com');
    process.exit(1);
  }

  // Ensure URL has a trailing scheme
  if (!/^https?:\/\//i.test(args.url)) {
    args.url = `https://${args.url}`;
  }

  try {
    const audit = await runAudit(args);

    // Print summary to stderr (so it shows even with --output-file)
    console.log('');
    console.log(`${c.bold}=============== SUMMARY ===============${c.reset}`);
    console.log(`  Pages crawled:    ${audit.summary.totalPages}`);
    console.log(`  Total issues:     ${audit.summary.totalIssues}`);
    console.log(`    ${c.red}Errors:${c.reset}         ${audit.summary.errors}`);
    console.log(`    ${c.yellow}Warnings:${c.reset}       ${audit.summary.warnings}`);
    console.log(`    ${c.blue}Notices:${c.reset}        ${audit.summary.notices}`);
    console.log(`    ${c.green}Passes:${c.reset}         ${audit.summary.passes}`);
    console.log('');

    // Health score with color
    const scoreColor =
      audit.summary.healthScore >= 80 ? c.green :
      audit.summary.healthScore >= 60 ? c.yellow :
      c.red;
    console.log(`  ${c.bold}Health Score:${c.reset}    ${scoreColor}${c.bold}${audit.summary.healthScore}%${c.reset}`);
    console.log(`${c.bold}=======================================${c.reset}`);
    console.log('');

    // Output the full report
    outputResults(audit, args);

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`\n${c.red}Fatal error:${c.reset} ${errorMessage}\n`);
    if (err instanceof Error && err.stack) {
      console.error(`${c.dim}${err.stack}${c.reset}`);
    }
    process.exit(1);
  }
}

// Run
main();
