import type { Issue } from '../types.js';

/**
 * Check URL structure following Ahrefs guidelines.
 *
 * Checks performed:
 * - URL path exceeds 100 characters
 * - More than 5 path segments
 * - Dates in URL (e.g., /2024/03/14/ or /2024-03-14/)
 * - Repeated words in slug
 * - Over-specific numbers (e.g., /top-37-/ or /25-best-/)
 * - Uppercase letters in path
 * - Underscores in path
 * - Query parameters present
 * - File extensions in path (.html, .php, etc.)
 */
export function checkUrlStructure(url: string): Issue[] {
  const issues: Issue[] = [];

  // Parse the URL to extract path, query, etc.
  const urlMatch = url.match(/^https?:\/\/[^/?#]+(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i);
  const path = urlMatch?.[1] || '/';
  const query = urlMatch?.[2] || '';

  // --- 1. URL too long ---
  if (path.length > 100) {
    issues.push({
      check: 'url-too-long',
      severity: 'warning',
      message: `URL path is ${path.length} characters. Keep URLs short and focused.`,
      url,
    });
  }

  // --- 2. Too many path segments ---
  // Split path by '/' and filter out empty segments
  const segments = path.split('/').filter((s) => s.length > 0);
  if (segments.length > 5) {
    issues.push({
      check: 'url-too-many-segments',
      severity: 'notice',
      message: `URL has ${segments.length} path segments. Flatten URL structure for better crawlability.`,
      url,
    });
  }

  // --- 3. Dates in URL ---
  // Detect /2024/03/14/ style (slash-separated date components)
  // or /2024-03-14/ style (hyphenated date in a segment)
  const slashDatePattern = /\/(\d{4})\/(\d{1,2})\/(\d{1,2})(\/|$)/;
  const hyphenDatePattern = /\/\d{4}-\d{1,2}-\d{1,2}(\/|$)/;

  if (slashDatePattern.test(path) || hyphenDatePattern.test(path)) {
    issues.push({
      check: 'url-contains-date',
      severity: 'warning',
      message: 'URL contains a date. Dates make URLs longer and content look outdated.',
      url,
    });
  }

  // --- 4. Repeated words ---
  // Check each segment's slug for repeated words (split by hyphens)
  for (const segment of segments) {
    const words = segment.toLowerCase().split('-').filter((w) => w.length > 0);
    const seen = new Set<string>();
    for (const word of words) {
      if (seen.has(word)) {
        issues.push({
          check: 'url-repeated-word',
          severity: 'warning',
          message: `URL contains repeated word: '${word}'. Remove duplicates for cleaner URLs.`,
          url,
        });
        break; // Only report once per segment
      }
      seen.add(word);
    }
  }

  // --- 5. Over-specific numbers ---
  // Patterns like /top-37-/ or /25-best-/ — 2+ digit numbers that aren't years (1900-2099)
  const overSpecificPattern = /(?:^|[-/])(\d{2,})(?:[-/]|$)/g;
  let numMatch: RegExpExecArray | null;
  const overSpecificRe = new RegExp(overSpecificPattern.source, 'g');

  while ((numMatch = overSpecificRe.exec(path)) !== null) {
    const num = numMatch[1];
    const numVal = parseInt(num, 10);

    // Skip years (1900-2099)
    if (numVal >= 1900 && numVal <= 2099) {
      continue;
    }

    // Only flag 2+ digit numbers
    if (num.length >= 2) {
      issues.push({
        check: 'url-over-specific-number',
        severity: 'notice',
        message: `URL contains over-specific number '${num}'. Use round numbers or omit for evergreen URLs.`,
        url,
      });
      break; // Only report once
    }
  }

  // --- 6. Uppercase in URL ---
  if (/[A-Z]/.test(path)) {
    issues.push({
      check: 'url-uppercase',
      severity: 'warning',
      message: 'URL contains uppercase letters. Use lowercase to avoid duplicate content.',
      url,
    });
  }

  // --- 7. Underscores in URL ---
  if (path.includes('_')) {
    issues.push({
      check: 'url-underscores',
      severity: 'notice',
      message: 'URL uses underscores. Google recommends hyphens for word separation.',
      url,
    });
  }

  // --- 8. URL parameters ---
  if (query.length > 0) {
    issues.push({
      check: 'url-parameters',
      severity: 'notice',
      message: 'URL contains query parameters. Use clean, parameter-free URLs when possible.',
      url,
    });
  }

  // --- 9. File extension in URL ---
  const extPattern = /\.(html|php|asp|aspx|jsp)(?:[?#/]|$)/i;
  const extMatch = path.match(extPattern);
  if (extMatch) {
    const ext = extMatch[1].toLowerCase();
    issues.push({
      check: 'url-file-extension',
      severity: 'notice',
      message: `URL contains file extension '.${ext}'. Modern URLs should be extension-free.`,
      url,
    });
  }

  return issues;
}
