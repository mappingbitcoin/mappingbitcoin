import type { Issue } from '../types.js';

/**
 * Extract all matches for a regex pattern from HTML.
 */
function matchAll(html: string, pattern: RegExp): RegExpExecArray[] {
  const results: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
  while ((match = re.exec(html)) !== null) {
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
 * Strip HTML tags from a string.
 */
function stripTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Get the content between <head> tags, if present.
 * Falls back to the full HTML if no head section is found.
 */
function getHeadSection(html: string): string {
  const headMatch = html.match(/<head[\s>]([\s\S]*?)<\/head>/i);
  return headMatch ? headMatch[1] : html;
}

/**
 * Extract a meta tag's content attribute value by name or property.
 * Returns all matches (to detect duplicates).
 */
function getMetaContents(head: string, attr: string, value: string): string[] {
  // Match <meta name="X" content="Y"> or <meta content="Y" name="X"> patterns
  // Also handles property= for OG tags
  const results: string[] = [];

  // Pattern 1: attr comes before content
  const pattern1 = new RegExp(
    `<meta\\s+[^>]*${attr}\\s*=\\s*["']${value}["'][^>]*content\\s*=\\s*["']([^"']*)["'][^>]*/?>`,
    'gi'
  );
  for (const m of matchAll(head, pattern1)) {
    results.push(decodeEntities(m[1]));
  }

  // Pattern 2: content comes before attr
  const pattern2 = new RegExp(
    `<meta\\s+[^>]*content\\s*=\\s*["']([^"']*)["'][^>]*${attr}\\s*=\\s*["']${value}["'][^>]*/?>`,
    'gi'
  );
  for (const m of matchAll(head, pattern2)) {
    results.push(decodeEntities(m[1]));
  }

  return results;
}

/**
 * Check title tags and meta descriptions following Ahrefs thresholds.
 *
 * Checks performed:
 * - Missing title tag
 * - Title too long (>60 chars)
 * - Title too short (<30 chars)
 * - Multiple title tags
 * - Missing meta description
 * - Meta description too long (>160 chars)
 * - Meta description too short (<70 chars)
 * - Multiple meta descriptions
 * - Missing viewport meta tag
 * - Meta robots noindex flag
 */
export function checkMeta(html: string, url: string): Issue[] {
  const issues: Issue[] = [];
  const head = getHeadSection(html);

  // --- Title tag checks ---

  const titleMatches = matchAll(head, /<title[\s>]*>([\s\S]*?)<\/title>/gi);

  if (titleMatches.length === 0) {
    issues.push({
      check: 'title-missing',
      severity: 'error',
      message: 'Page is missing a <title> tag',
      url,
    });
  } else {
    if (titleMatches.length > 1) {
      issues.push({
        check: 'title-multiple',
        severity: 'error',
        message: `Page has ${titleMatches.length} <title> tags (should have exactly 1)`,
        url,
        details: titleMatches.map((m) => decodeEntities(stripTags(m[1]).trim())).join(' | '),
      });
    }

    const titleText = decodeEntities(stripTags(titleMatches[0][1]).trim());
    const titleLength = titleText.length;

    if (titleLength === 0) {
      issues.push({
        check: 'title-empty',
        severity: 'error',
        message: 'Page has an empty <title> tag',
        url,
      });
    } else if (titleLength > 60) {
      issues.push({
        check: 'title-too-long',
        severity: 'warning',
        message: `Title is ${titleLength} characters (recommended: 60 max)`,
        url,
        details: titleText,
      });
    } else if (titleLength < 30) {
      issues.push({
        check: 'title-too-short',
        severity: 'notice',
        message: `Title is ${titleLength} characters (recommended: 30+ chars)`,
        url,
        details: titleText,
      });
    }
  }

  // --- Meta description checks ---

  const descriptions = getMetaContents(head, 'name', 'description');

  if (descriptions.length === 0) {
    issues.push({
      check: 'meta-description-missing',
      severity: 'warning',
      message: 'Page is missing a meta description',
      url,
    });
  } else {
    if (descriptions.length > 1) {
      issues.push({
        check: 'meta-description-multiple',
        severity: 'warning',
        message: `Page has ${descriptions.length} meta descriptions (should have exactly 1)`,
        url,
        details: descriptions.join(' | '),
      });
    }

    const descText = descriptions[0].trim();
    const descLength = descText.length;

    if (descLength === 0) {
      issues.push({
        check: 'meta-description-empty',
        severity: 'warning',
        message: 'Page has an empty meta description',
        url,
      });
    } else if (descLength > 160) {
      issues.push({
        check: 'meta-description-too-long',
        severity: 'notice',
        message: `Meta description is ${descLength} characters (recommended: 160 max)`,
        url,
        details: descText,
      });
    } else if (descLength < 70) {
      issues.push({
        check: 'meta-description-too-short',
        severity: 'notice',
        message: `Meta description is ${descLength} characters (recommended: 70+ chars)`,
        url,
        details: descText,
      });
    }
  }

  // --- Viewport meta check ---

  const viewportMatches = getMetaContents(head, 'name', 'viewport');

  if (viewportMatches.length === 0) {
    issues.push({
      check: 'viewport-missing',
      severity: 'warning',
      message: 'Page is missing a <meta name="viewport"> tag (required for mobile responsiveness)',
      url,
    });
  }

  // --- Meta robots noindex check ---

  const robotsValues = getMetaContents(head, 'name', 'robots');
  const googlebotValues = getMetaContents(head, 'name', 'googlebot');
  const allRobotsValues = [...robotsValues, ...googlebotValues];

  for (const robotsContent of allRobotsValues) {
    if (/noindex/i.test(robotsContent)) {
      issues.push({
        check: 'meta-noindex',
        severity: 'notice',
        message: 'Page has a noindex directive — it will not be indexed by search engines',
        url,
        details: `Content: "${robotsContent}"`,
      });
      break; // Only report once even if both robots and googlebot have noindex
    }
  }

  return issues;
}
