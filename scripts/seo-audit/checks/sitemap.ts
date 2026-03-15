import type { Issue } from '../types.js';

/**
 * Check a sitemap for SEO issues and extract URLs.
 *
 * Validates:
 * - Sitemap exists (content is not null)
 * - Valid XML structure
 * - Contains URLs
 * - Handles sitemap index files (sitemapindex)
 * - Extracts all <loc> URLs
 *
 * @param content - Raw sitemap XML content, or null if not found
 * @param siteUrl - The base URL of the site
 * @returns Object with issues and extracted URLs
 */
export function checkSitemap(
  content: string | null,
  siteUrl: string
): { issues: Issue[]; urls: string[] } {
  const issues: Issue[] = [];
  const urls: string[] = [];

  if (content === null || content === undefined) {
    issues.push({
      check: 'sitemap',
      severity: 'error',
      message: 'Sitemap not found',
      url: siteUrl,
      details:
        'A sitemap.xml helps search engines discover and index your pages. Create one and reference it in robots.txt.',
    });
    return { issues, urls };
  }

  const trimmedContent = content.trim();

  if (trimmedContent === '') {
    issues.push({
      check: 'sitemap',
      severity: 'error',
      message: 'Sitemap is empty',
      url: siteUrl,
    });
    return { issues, urls };
  }

  // Basic XML validation
  if (!isValidXml(trimmedContent)) {
    issues.push({
      check: 'sitemap',
      severity: 'error',
      message: 'Sitemap has invalid XML',
      url: siteUrl,
      details:
        'The sitemap could not be parsed as valid XML. Check for malformed tags, unclosed elements, or encoding issues.',
    });
    return { issues, urls };
  }

  // Detect sitemap type
  const isSitemapIndex = /<sitemapindex[\s>]/i.test(trimmedContent);

  if (isSitemapIndex) {
    // Extract sitemap URLs from sitemap index
    const sitemapUrls = extractSitemapIndexUrls(trimmedContent);

    if (sitemapUrls.length === 0) {
      issues.push({
        check: 'sitemap',
        severity: 'error',
        message: 'Sitemap index contains no sitemap references',
        url: siteUrl,
        details:
          'The sitemapindex file was found but contains no <sitemap><loc> entries.',
      });
    } else {
      issues.push({
        check: 'sitemap',
        severity: 'pass',
        message: `Sitemap index found with ${sitemapUrls.length} sitemap(s)`,
        url: siteUrl,
        details: sitemapUrls.join('\n'),
      });
      // Return the sub-sitemap URLs for the main script to fetch and check
      urls.push(...sitemapUrls);
    }

    return { issues, urls };
  }

  // Regular sitemap - extract page URLs
  const pageUrls = parseSitemapUrls(trimmedContent);

  if (pageUrls.length === 0) {
    issues.push({
      check: 'sitemap',
      severity: 'error',
      message: 'Sitemap contains no URLs',
      url: siteUrl,
      details: 'The sitemap was found but contains no <url><loc> entries.',
    });
    return { issues, urls };
  }

  // Validate URLs belong to the site
  const siteDomain = extractDomain(siteUrl);
  let foreignUrlCount = 0;
  const foreignDomains = new Set<string>();

  for (const pageUrl of pageUrls) {
    const urlDomain = extractDomain(pageUrl);
    if (urlDomain && siteDomain && urlDomain !== siteDomain) {
      foreignUrlCount++;
      foreignDomains.add(urlDomain);
    }
  }

  if (foreignUrlCount > 0) {
    issues.push({
      check: 'sitemap',
      severity: 'warning',
      message: `Sitemap contains ${foreignUrlCount} URL(s) from different domain(s)`,
      url: siteUrl,
      details: `Foreign domains: ${Array.from(foreignDomains).join(', ')}. Sitemaps should only contain URLs from the same domain.`,
    });
  }

  // Check for non-absolute URLs
  const relativeUrls = pageUrls.filter((u) => !/^https?:\/\//i.test(u));
  if (relativeUrls.length > 0) {
    issues.push({
      check: 'sitemap',
      severity: 'error',
      message: `Sitemap contains ${relativeUrls.length} non-absolute URL(s)`,
      url: siteUrl,
      details: `All URLs in a sitemap must be absolute. Examples: ${relativeUrls.slice(0, 3).join(', ')}`,
    });
  }

  // Check for lastmod dates
  const lastmodRegex = /<lastmod>\s*([^<]*)\s*<\/lastmod>/gi;
  const lastmods: string[] = [];
  let lastmodMatch: RegExpExecArray | null;
  while ((lastmodMatch = lastmodRegex.exec(trimmedContent)) !== null) {
    lastmods.push(lastmodMatch[1].trim());
  }

  if (lastmods.length === 0 && pageUrls.length > 0) {
    issues.push({
      check: 'sitemap',
      severity: 'notice',
      message: 'Sitemap URLs have no <lastmod> dates',
      url: siteUrl,
      details:
        'Adding <lastmod> dates helps search engines prioritize which pages to recrawl.',
    });
  } else if (lastmods.length > 0) {
    // Validate date formats
    const invalidDates = lastmods.filter((d) => !isValidDate(d));
    if (invalidDates.length > 0) {
      issues.push({
        check: 'sitemap',
        severity: 'warning',
        message: `${invalidDates.length} invalid <lastmod> date(s) in sitemap`,
        url: siteUrl,
        details: `Invalid dates: ${invalidDates.slice(0, 3).join(', ')}. Use W3C Datetime format (e.g., 2024-01-15 or 2024-01-15T10:30:00+00:00).`,
      });
    }
  }

  issues.push({
    check: 'sitemap',
    severity: 'pass',
    message: `Sitemap contains ${pageUrls.length} URL(s)`,
    url: siteUrl,
  });

  urls.push(...pageUrls);
  return { issues, urls };
}

/**
 * Extract all <loc> URLs from a sitemap XML string.
 * Works for both regular sitemaps (<urlset>) and sitemap indexes (<sitemapindex>).
 */
export function parseSitemapUrls(xml: string): string[] {
  const urls: string[] = [];
  const locRegex = /<url>\s*<loc>\s*([^<]*)\s*<\/loc>/gi;
  // Also handle cases where <loc> is not the first child of <url>
  const altLocRegex = /<url>[\s\S]*?<loc>\s*([^<]*)\s*<\/loc>[\s\S]*?<\/url>/gi;

  let match: RegExpExecArray | null;
  const seen = new Set<string>();

  // Try simple pattern first
  while ((match = locRegex.exec(xml)) !== null) {
    const url = decodeXmlEntities(match[1].trim());
    if (url && !seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }

  // If simple pattern found nothing, try the more permissive pattern
  if (urls.length === 0) {
    while ((match = altLocRegex.exec(xml)) !== null) {
      const url = decodeXmlEntities(match[1].trim());
      if (url && !seen.has(url)) {
        seen.add(url);
        urls.push(url);
      }
    }
  }

  return urls;
}

/**
 * Extract sitemap URLs from a sitemap index file.
 */
function extractSitemapIndexUrls(xml: string): string[] {
  const urls: string[] = [];
  const locRegex = /<sitemap>[\s\S]*?<loc>\s*([^<]*)\s*<\/loc>[\s\S]*?<\/sitemap>/gi;
  let match: RegExpExecArray | null;

  while ((match = locRegex.exec(xml)) !== null) {
    const url = decodeXmlEntities(match[1].trim());
    if (url) urls.push(url);
  }

  return urls;
}

/**
 * Basic XML validity check using regex heuristics.
 * Not a full XML parser, but catches common issues.
 */
function isValidXml(content: string): boolean {
  // Must start with XML declaration or root element
  const trimmed = content.trim();
  if (
    !trimmed.startsWith('<?xml') &&
    !trimmed.startsWith('<urlset') &&
    !trimmed.startsWith('<sitemapindex')
  ) {
    // Allow BOM or whitespace before XML declaration
    if (!/^(\xef\xbb\xbf)?\s*(<\?xml|<urlset|<sitemapindex)/i.test(trimmed)) {
      return false;
    }
  }

  // Check for basic tag balance (very rough check)
  // Count opening and self-closing tags
  const openTags = (content.match(/<[a-zA-Z][^>]*[^/]>/g) || []).length;
  const closeTags = (content.match(/<\/[a-zA-Z][^>]*>/g) || []).length;
  const selfClosing = (content.match(/<[a-zA-Z][^>]*\/>/g) || []).length;

  // Tags should roughly balance (with some tolerance for processing instructions)
  if (openTags > 0 && closeTags === 0) return false;

  // Must have a root element
  if (
    !/<(urlset|sitemapindex)[\s>]/i.test(content) ||
    !/<\/(urlset|sitemapindex)>/i.test(content)
  ) {
    return false;
  }

  return true;
}

/**
 * Validate a date string (W3C Datetime format).
 */
function isValidDate(dateStr: string): boolean {
  // Accept: YYYY-MM-DD, YYYY-MM-DDThh:mm:ss, with optional timezone
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z)?)?$/.test(
    dateStr
  );
}

/**
 * Decode common XML entities.
 */
function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Extract the domain from a URL.
 */
function extractDomain(urlStr: string): string | null {
  const match = urlStr.match(/^https?:\/\/([^/?#]+)/i);
  return match ? match[1].toLowerCase() : null;
}
