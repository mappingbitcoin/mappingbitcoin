import type { Issue } from '../types.js';

/**
 * Extract all matches for a regex pattern from a string.
 */
function matchAll(text: string, pattern: RegExp): RegExpExecArray[] {
  const results: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  const flags = pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g';
  const re = new RegExp(pattern.source, flags);
  while ((match = re.exec(text)) !== null) {
    results.push(match);
  }
  return results;
}

/**
 * Decode basic HTML entities in a string.
 */
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

/**
 * Get the content between <head> tags, if present.
 */
function getHeadSection(html: string): string {
  const headMatch = html.match(/<head[\s>]([\s\S]*?)<\/head>/i);
  return headMatch ? headMatch[1] : html;
}

/**
 * Represents a parsed meta tag with its property/name and content.
 */
interface MetaEntry {
  key: string;    // property or name value (e.g., "og:title", "twitter:card")
  content: string;
}

/**
 * Extract all meta tags with property= or name= attributes from the head section.
 */
function extractMetaTags(head: string): MetaEntry[] {
  const entries: MetaEntry[] = [];

  // Pattern 1: property/name before content
  // <meta property="og:title" content="...">
  const pattern1 = /<meta\s+[^>]*(?:property|name)\s*=\s*["']([^"']*)["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*\/?>/gi;
  for (const m of matchAll(head, pattern1)) {
    entries.push({
      key: m[1].toLowerCase(),
      content: decodeEntities(m[2]),
    });
  }

  // Pattern 2: content before property/name
  // <meta content="..." property="og:title">
  const pattern2 = /<meta\s+[^>]*content\s*=\s*["']([^"']*)["'][^>]*(?:property|name)\s*=\s*["']([^"']*)["'][^>]*\/?>/gi;
  for (const m of matchAll(head, pattern2)) {
    // Avoid duplicates — check if we already captured this exact position
    // by verifying the key+content pair doesn't already exist at the same index
    const key = m[2].toLowerCase();
    const content = decodeEntities(m[1]);

    // Simple dedup: skip if the same key-content pair was already added
    // (the two regex patterns can sometimes match the same tag)
    const isDuplicate = entries.some((e) => e.key === key && e.content === content);
    if (!isDuplicate) {
      entries.push({ key, content });
    }
  }

  return entries;
}

/**
 * Get all content values for a specific meta property/name key.
 */
function getValues(entries: MetaEntry[], key: string): string[] {
  return entries.filter((e) => e.key === key).map((e) => e.content);
}

/**
 * Check if a URL is absolute (starts with http:// or https://).
 */
function isAbsoluteUrl(urlStr: string): boolean {
  return /^https?:\/\//i.test(urlStr);
}

/**
 * Check Open Graph and Twitter Card tags.
 *
 * Checks performed:
 * - Missing og:title, og:description, og:image, og:url, og:type
 * - og:image not an absolute URL
 * - Duplicate OG tags
 * - Missing twitter:card, twitter:title, twitter:description
 */
export function checkSocial(html: string, url: string): Issue[] {
  const issues: Issue[] = [];
  const head = getHeadSection(html);
  const metaTags = extractMetaTags(head);

  // --- Open Graph checks ---

  const ogTitle = getValues(metaTags, 'og:title');
  const ogDescription = getValues(metaTags, 'og:description');
  const ogImage = getValues(metaTags, 'og:image');
  const ogUrl = getValues(metaTags, 'og:url');
  const ogType = getValues(metaTags, 'og:type');

  if (ogTitle.length === 0) {
    issues.push({
      check: 'og-title-missing',
      severity: 'warning',
      message: 'Missing og:title meta tag',
      url,
    });
  }

  if (ogDescription.length === 0) {
    issues.push({
      check: 'og-description-missing',
      severity: 'warning',
      message: 'Missing og:description meta tag',
      url,
    });
  }

  if (ogImage.length === 0) {
    issues.push({
      check: 'og-image-missing',
      severity: 'warning',
      message: 'Missing og:image meta tag',
      url,
    });
  } else {
    // Check that og:image is an absolute URL
    for (const imageUrl of ogImage) {
      if (imageUrl && !isAbsoluteUrl(imageUrl)) {
        issues.push({
          check: 'og-image-not-absolute',
          severity: 'warning',
          message: 'og:image should be an absolute URL (starting with https://)',
          url,
          details: `Found: "${imageUrl}"`,
        });
      }
    }
  }

  if (ogUrl.length === 0) {
    issues.push({
      check: 'og-url-missing',
      severity: 'notice',
      message: 'Missing og:url meta tag',
      url,
    });
  }

  if (ogType.length === 0) {
    issues.push({
      check: 'og-type-missing',
      severity: 'notice',
      message: 'Missing og:type meta tag',
      url,
    });
  }

  // --- Duplicate OG tag checks ---

  const ogKeys = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'og:site_name', 'og:locale'];
  for (const key of ogKeys) {
    const values = getValues(metaTags, key);
    if (values.length > 1) {
      issues.push({
        check: 'og-duplicate',
        severity: 'warning',
        message: `Duplicate ${key} meta tags found (${values.length} instances)`,
        url,
        details: values.join(' | '),
      });
    }
  }

  // --- Twitter Card checks ---

  const twitterCard = getValues(metaTags, 'twitter:card');
  const twitterTitle = getValues(metaTags, 'twitter:title');
  const twitterDescription = getValues(metaTags, 'twitter:description');

  if (twitterCard.length === 0) {
    issues.push({
      check: 'twitter-card-missing',
      severity: 'notice',
      message: 'Missing twitter:card meta tag',
      url,
    });
  }

  if (twitterTitle.length === 0) {
    issues.push({
      check: 'twitter-title-missing',
      severity: 'notice',
      message: 'Missing twitter:title meta tag',
      url,
    });
  }

  if (twitterDescription.length === 0) {
    issues.push({
      check: 'twitter-description-missing',
      severity: 'notice',
      message: 'Missing twitter:description meta tag',
      url,
    });
  }

  return issues;
}
