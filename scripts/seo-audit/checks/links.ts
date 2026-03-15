import type { Issue } from '../types.js';

/**
 * Generic anchor text values that provide no SEO value.
 * Checked case-insensitively.
 */
const GENERIC_ANCHOR_TEXTS: ReadonlySet<string> = new Set([
  'click here',
  'here',
  'read more',
  'link',
  'more',
  'learn more',
  'click',
  'this',
  'go',
  'this link',
  'more info',
  'continue',
  'continue reading',
]);

/**
 * Analyze links on a page for SEO issues.
 *
 * Checks:
 * - Empty href attributes
 * - href="#" placeholder links
 * - Missing anchor text
 * - Generic/non-descriptive anchor text
 * - Nofollow on internal links
 * - Internal vs external link counts
 */
export function checkLinks(html: string, url: string): Issue[] {
  const issues: Issue[] = [];

  // Extract all <a> tags
  const linkRegex = /<a\s([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  let internalCount = 0;
  let externalCount = 0;
  let emptyHrefCount = 0;
  let hashOnlyCount = 0;
  let noTextCount = 0;
  let genericTextCount = 0;
  let nofollowInternalCount = 0;

  const pageDomain = extractDomain(url);

  while ((match = linkRegex.exec(html)) !== null) {
    const attrs = match[1];
    const innerHtml = match[2];

    // Extract href
    const hrefMatch = attrs.match(/href\s*=\s*["']([^"']*)["']/i);
    const href = hrefMatch ? hrefMatch[1].trim() : null;

    // Check for missing or empty href
    if (href === null || href === '') {
      emptyHrefCount++;
      continue;
    }

    // Check for hash-only links
    if (href === '#') {
      hashOnlyCount++;
      continue;
    }

    // Skip javascript: void links, mailto:, tel:, etc.
    if (/^(javascript:|mailto:|tel:|data:|blob:)/i.test(href)) {
      continue;
    }

    // Determine if internal or external
    const isInternal = isInternalLink(href, pageDomain);

    if (isInternal) {
      internalCount++;
    } else {
      externalCount++;
    }

    // Extract text content (strip HTML tags)
    const anchorText = stripHtml(innerHtml).trim();

    // Check for missing anchor text
    // Consider aria-label and title as alternatives
    const ariaLabel = attrs.match(/aria-label\s*=\s*["']([^"']*)["']/i);
    const titleAttr = attrs.match(/title\s*=\s*["']([^"']*)["']/i);
    const imgAlt = innerHtml.match(/<img\s[^>]*alt\s*=\s*["']([^"']*)["'][^>]*>/i);

    const hasAccessibleText =
      anchorText.length > 0 ||
      (ariaLabel && ariaLabel[1].trim().length > 0) ||
      (titleAttr && titleAttr[1].trim().length > 0) ||
      (imgAlt && imgAlt[1].trim().length > 0);

    if (!hasAccessibleText) {
      noTextCount++;
    }

    // Check for generic anchor text
    if (anchorText.length > 0 && GENERIC_ANCHOR_TEXTS.has(anchorText.toLowerCase())) {
      genericTextCount++;
    }

    // Check for nofollow on internal links
    if (isInternal) {
      const relMatch = attrs.match(/rel\s*=\s*["']([^"']*)["']/i);
      if (relMatch && /\bnofollow\b/i.test(relMatch[1])) {
        nofollowInternalCount++;
      }
    }
  }

  // Report issues

  if (emptyHrefCount > 0) {
    issues.push({
      check: 'links',
      severity: 'warning',
      message: `${emptyHrefCount} link(s) with empty or missing href`,
      url,
      details: 'Links without href attributes are not navigable and provide no SEO value.',
    });
  }

  if (hashOnlyCount > 0) {
    issues.push({
      check: 'links',
      severity: 'notice',
      message: `${hashOnlyCount} link(s) with href="#"`,
      url,
      details:
        'Hash-only links are often used for JavaScript functionality. Consider using buttons instead for non-navigation actions.',
    });
  }

  if (noTextCount > 0) {
    issues.push({
      check: 'links',
      severity: 'warning',
      message: `${noTextCount} link(s) with no anchor text or accessible label`,
      url,
      details:
        'Links should have descriptive text for accessibility and SEO. Use aria-label or alt text on images as alternatives.',
    });
  }

  if (genericTextCount > 0) {
    issues.push({
      check: 'links',
      severity: 'notice',
      message: `${genericTextCount} link(s) with generic anchor text`,
      url,
      details:
        'Avoid generic link text like "click here", "read more", or "here". Use descriptive text that tells users and search engines what the linked page is about.',
    });
  }

  if (nofollowInternalCount > 0) {
    issues.push({
      check: 'links',
      severity: 'notice',
      message: `${nofollowInternalCount} internal link(s) with rel="nofollow"`,
      url,
      details:
        'Using nofollow on internal links generally wastes link equity. Remove nofollow from internal links unless you have a specific reason.',
    });
  }

  // Summary counts
  issues.push({
    check: 'links',
    severity: 'pass',
    message: `Found ${internalCount} internal and ${externalCount} external link(s)`,
    url,
  });

  // Internal link count threshold evaluation
  if (internalCount < 3) {
    issues.push({
      check: 'links',
      severity: 'warning',
      message: `Only ${internalCount} internal link(s) found. Aim for 3-7 contextual internal links per page for better SEO.`,
      url,
    });
  } else if (internalCount > 50) {
    issues.push({
      check: 'links',
      severity: 'notice',
      message: `${internalCount} internal links found. Excessive internal links may dilute link equity.`,
      url,
    });
  }

  return issues;
}

/**
 * Extract all links from the page, categorized as internal or external.
 * Used by the crawler to discover new pages.
 */
export function extractLinks(
  html: string,
  url: string
): { internal: string[]; external: string[] } {
  const internal: string[] = [];
  const external: string[] = [];
  const pageDomain = extractDomain(url);
  const seen = new Set<string>();

  const linkRegex = /<a\s[^>]*href\s*=\s*["']([^"']*)["'][^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1].trim();

    // Skip empty, hash-only, javascript, mailto, tel links
    if (
      !href ||
      href === '#' ||
      /^(javascript:|mailto:|tel:|data:|blob:|#)/i.test(href)
    ) {
      continue;
    }

    // Remove fragment
    href = href.replace(/#.*$/, '');
    if (!href) continue;

    // Resolve relative URLs
    href = resolveUrl(href, url);
    if (!href) continue;

    // Normalize for deduplication
    const normalized = normalizeUrl(href);
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    if (isInternalLink(href, pageDomain)) {
      internal.push(href);
    } else {
      external.push(href);
    }
  }

  return { internal, external };
}

/**
 * Strip HTML tags from a string to get plain text.
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ');
}

/**
 * Extract the domain from a URL string.
 */
function extractDomain(urlStr: string): string | null {
  const match = urlStr.match(/^https?:\/\/([^/?#]+)/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Determine whether a link is internal (same domain) or external.
 */
function isInternalLink(href: string, pageDomain: string | null): boolean {
  if (!pageDomain) return false;

  // Relative URLs are internal
  if (!/^https?:\/\//i.test(href)) {
    return true;
  }

  const linkDomain = extractDomain(href);
  if (!linkDomain) return false;

  // Same domain or subdomain
  return linkDomain === pageDomain || linkDomain.endsWith('.' + pageDomain);
}

/**
 * Resolve a relative URL against a base URL.
 */
function resolveUrl(href: string, baseUrl: string): string {
  // Already absolute
  if (/^https?:\/\//i.test(href)) {
    return href;
  }

  // Protocol-relative
  if (href.startsWith('//')) {
    const protocol = baseUrl.match(/^(https?:)/i);
    return protocol ? protocol[1] + href : 'https:' + href;
  }

  // Extract base components
  const baseMatch = baseUrl.match(/^(https?:\/\/[^/?#]+)(\/[^?#]*)?/i);
  if (!baseMatch) return '';

  const origin = baseMatch[1];
  const basePath = baseMatch[2] || '/';

  // Absolute path
  if (href.startsWith('/')) {
    return origin + href;
  }

  // Relative path
  const baseDir = basePath.replace(/\/[^/]*$/, '/');
  return origin + baseDir + href;
}

/**
 * Normalize URL for deduplication.
 */
function normalizeUrl(urlStr: string): string {
  try {
    let normalized = urlStr.toLowerCase().trim();
    normalized = normalized.replace(/#.*$/, '');
    normalized = normalized.replace(/\/+$/, '');
    normalized = normalized.replace(/:(80|443)(?=\/|$)/, '');
    return normalized;
  } catch {
    return urlStr.toLowerCase().trim();
  }
}
