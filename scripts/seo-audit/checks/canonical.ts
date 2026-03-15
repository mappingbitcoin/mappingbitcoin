import type { Issue } from '../types.js';

/**
 * Check canonical URL implementation on a page.
 *
 * Validates:
 * - Presence of a canonical tag
 * - Canonical is an absolute URL
 * - Canonical points to the same domain
 * - Only one canonical tag exists
 * - Self-referencing canonical (pass)
 */
export function checkCanonical(html: string, url: string): Issue[] {
  const issues: Issue[] = [];

  // Extract all <link rel="canonical"> tags from the <head>
  // We match link tags with rel="canonical" (case-insensitive attributes)
  const canonicalRegex = /<link\s[^>]*rel\s*=\s*["']canonical["'][^>]*>/gi;
  const matches = html.match(canonicalRegex) || [];

  if (matches.length === 0) {
    issues.push({
      check: 'canonical',
      severity: 'warning',
      message: 'Missing canonical tag',
      url,
      details: 'Every page should have a self-referencing canonical tag to prevent duplicate content issues.',
    });
    return issues;
  }

  if (matches.length > 1) {
    issues.push({
      check: 'canonical',
      severity: 'error',
      message: `Multiple canonical tags found (${matches.length})`,
      url,
      details:
        'Only one canonical tag should be present per page. Multiple canonicals confuse search engines.',
    });
  }

  // Extract href from each canonical tag
  for (const tag of matches) {
    const hrefMatch = tag.match(/href\s*=\s*["']([^"']*)["']/i);

    if (!hrefMatch || !hrefMatch[1]) {
      issues.push({
        check: 'canonical',
        severity: 'error',
        message: 'Canonical tag has no href attribute',
        url,
        details: `Tag found: ${tag}`,
      });
      continue;
    }

    const canonicalHref = hrefMatch[1].trim();

    if (canonicalHref === '') {
      issues.push({
        check: 'canonical',
        severity: 'error',
        message: 'Canonical tag has empty href',
        url,
      });
      continue;
    }

    // Check if canonical is an absolute URL
    const isAbsolute = /^https?:\/\//i.test(canonicalHref);
    if (!isAbsolute) {
      issues.push({
        check: 'canonical',
        severity: 'error',
        message: 'Canonical URL is not absolute',
        url,
        details: `Canonical href "${canonicalHref}" should be a full absolute URL (starting with https://).`,
      });
      continue;
    }

    // Parse domains for comparison
    const pageDomain = extractDomain(url);
    const canonicalDomain = extractDomain(canonicalHref);

    if (pageDomain && canonicalDomain && pageDomain !== canonicalDomain) {
      issues.push({
        check: 'canonical',
        severity: 'warning',
        message: 'Canonical points to a different domain',
        url,
        details: `Page domain: ${pageDomain}, Canonical domain: ${canonicalDomain}. This may be intentional (e.g., cross-domain canonicalization) but should be reviewed.`,
      });
    }

    // Check for self-referencing canonical
    if (normalizeUrl(canonicalHref) === normalizeUrl(url)) {
      issues.push({
        check: 'canonical',
        severity: 'pass',
        message: 'Self-referencing canonical tag is correctly set',
        url,
        details: `Canonical: ${canonicalHref}`,
      });
    } else if (pageDomain === canonicalDomain) {
      issues.push({
        check: 'canonical',
        severity: 'notice',
        message: 'Canonical points to a different URL on the same domain',
        url,
        details: `Canonical: ${canonicalHref}. This page is canonicalized to another page, meaning search engines will treat this as a duplicate.`,
      });
    }
  }

  return issues;
}

/**
 * Extract the domain (hostname) from a URL string.
 */
function extractDomain(urlStr: string): string | null {
  const match = urlStr.match(/^https?:\/\/([^/?#]+)/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Normalize a URL for comparison by lowercasing the scheme/host,
 * removing default ports, removing trailing slashes, and removing fragments.
 */
function normalizeUrl(urlStr: string): string {
  try {
    let normalized = urlStr.toLowerCase().trim();
    // Remove fragment
    normalized = normalized.replace(/#.*$/, '');
    // Remove trailing slash (but keep root "/")
    normalized = normalized.replace(/\/+$/, '');
    // Remove default ports
    normalized = normalized.replace(/:(80|443)(?=\/|$)/, '');
    return normalized;
  } catch {
    return urlStr.toLowerCase().trim();
  }
}
