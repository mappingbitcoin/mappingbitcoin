import type { Issue } from '../types.js';

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
 * Represents a parsed heading element with its level and text content.
 */
interface Heading {
  level: number;  // 1-6
  raw: string;    // original inner HTML
  text: string;   // stripped/decoded text
}

/**
 * Extract all heading elements (h1-h6) from HTML in document order.
 * Ignores headings inside <script>, <style>, and HTML comments.
 */
function extractHeadings(html: string): Heading[] {
  // Remove content we should not parse headings from
  let cleaned = html;
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  cleaned = cleaned.replace(/<script[\s>][\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<style[\s>][\s\S]*?<\/style>/gi, '');
  cleaned = cleaned.replace(/<template[\s>][\s\S]*?<\/template>/gi, '');
  cleaned = cleaned.replace(/<noscript[\s>][\s\S]*?<\/noscript>/gi, '');

  const headings: Heading[] = [];
  const pattern = /<h([1-6])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/gi;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(cleaned)) !== null) {
    const level = parseInt(match[1], 10);
    const raw = match[2];
    const text = decodeEntities(stripTags(raw)).trim();
    headings.push({ level, raw, text });
  }

  return headings;
}

/**
 * Check heading structure following SEO best practices.
 *
 * Checks performed:
 * - Missing H1 tag
 * - Multiple H1 tags
 * - H1 too long (>70 chars)
 * - Heading hierarchy skips levels (e.g. H1 -> H3 with no H2)
 * - Empty headings
 */
export function checkHeadings(html: string, url: string): Issue[] {
  const issues: Issue[] = [];
  const headings = extractHeadings(html);

  // --- H1 checks ---

  const h1s = headings.filter((h) => h.level === 1);

  if (h1s.length === 0) {
    issues.push({
      check: 'h1-missing',
      severity: 'error',
      message: 'Page is missing an H1 heading',
      url,
    });
  } else {
    if (h1s.length > 1) {
      issues.push({
        check: 'h1-multiple',
        severity: 'warning',
        message: `Page has ${h1s.length} H1 headings (recommended: exactly 1)`,
        url,
        details: h1s.map((h) => h.text || '(empty)').join(' | '),
      });
    }

    for (const h1 of h1s) {
      if (h1.text.length > 70) {
        issues.push({
          check: 'h1-too-long',
          severity: 'notice',
          message: `H1 is ${h1.text.length} characters (recommended: 70 max)`,
          url,
          details: h1.text,
        });
      }
    }
  }

  // --- Empty headings check ---

  for (const heading of headings) {
    if (heading.text.length === 0) {
      issues.push({
        check: 'heading-empty',
        severity: 'warning',
        message: `Empty <h${heading.level}> tag found`,
        url,
      });
    }
  }

  // --- Heading hierarchy check ---
  // Walk through headings in document order and check for level skips.
  // A skip is defined as going from level N to level N+2 or higher
  // (e.g., H1 -> H3 without an H2 in between).

  if (headings.length > 0) {
    // Check that the first heading is an H1 (or at least that levels
    // don't start too deep, which would indicate a hierarchy issue)
    const firstHeading = headings[0];
    if (firstHeading.level > 1) {
      issues.push({
        check: 'heading-hierarchy-skip',
        severity: 'warning',
        message: `First heading is <h${firstHeading.level}> instead of <h1> — heading hierarchy should start at H1`,
        url,
        details: `First heading: "${firstHeading.text || '(empty)'}"`,
      });
    }

    // Walk sequential pairs and detect level jumps
    const reportedSkips = new Set<string>();
    for (let i = 1; i < headings.length; i++) {
      const prev = headings[i - 1];
      const curr = headings[i];

      // Only flag when going deeper (increasing level) and skipping levels
      // Going from H3 -> H1 is fine (new section)
      if (curr.level > prev.level && curr.level - prev.level > 1) {
        const skipKey = `h${prev.level}-h${curr.level}`;
        if (!reportedSkips.has(skipKey)) {
          reportedSkips.add(skipKey);

          const skippedLevels: string[] = [];
          for (let lvl = prev.level + 1; lvl < curr.level; lvl++) {
            skippedLevels.push(`H${lvl}`);
          }

          issues.push({
            check: 'heading-hierarchy-skip',
            severity: 'warning',
            message: `Heading hierarchy skips from <h${prev.level}> to <h${curr.level}> (missing ${skippedLevels.join(', ')})`,
            url,
            details: `"${prev.text || '(empty)'}" (H${prev.level}) -> "${curr.text || '(empty)'}" (H${curr.level})`,
          });
        }
      }
    }
  }

  return issues;
}
