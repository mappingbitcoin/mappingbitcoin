import type { Issue } from '../types.js';

/**
 * Stop words to filter out when extracting significant keywords.
 */
const STOP_WORDS: ReadonlySet<string> = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'shall', 'should', 'may', 'might', 'can', 'could', 'how', 'what',
  'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'it', 'its',
  'your', 'my', 'our', 'their', '|', '-', '\u2013', '\u2014',
]);

/**
 * Summary-like section labels to look for in long content.
 */
const SUMMARY_LABELS: readonly string[] = [
  'tl;dr',
  'tldr',
  'summary',
  'key takeaways',
  'at a glance',
  'overview',
  'quick summary',
  'in brief',
];

/**
 * URL path segments that indicate an article/blog page.
 */
const ARTICLE_PATH_SEGMENTS = ['/blog/', '/article/', '/post/', '/news/'];

/**
 * Check content quality for a single page.
 *
 * Checks performed:
 * - Thin content (under 300 words)
 * - Article pages with fewer than 1,500 words
 * - Long content (1,500+ words) missing a TL;DR or summary section
 */
export function checkContent(html: string, url: string, wordCount: number): Issue[] {
  const issues: Issue[] = [];

  // 1. Thin content check
  if (wordCount < 300) {
    issues.push({
      check: 'content-thin',
      severity: 'warning',
      message: `Page has only ${wordCount} words. Pages under 300 words are considered thin content.`,
      url,
    });
  } else if (wordCount < 1500) {
    // Check if this is likely an article/blog page
    const lowerUrl = url.toLowerCase();
    const isArticle = ARTICLE_PATH_SEGMENTS.some((seg) => lowerUrl.includes(seg));

    if (isArticle) {
      issues.push({
        check: 'content-article-length',
        severity: 'notice',
        message: `Article page has only ${wordCount} words. Aim for 1,500+ words for comprehensive, high-quality content.`,
        url,
      });
    }
  }

  // 2. Missing TL;DR / summary section check
  if (wordCount >= 1500) {
    const hasSummarySection = checkForSummarySection(html);

    if (!hasSummarySection) {
      issues.push({
        check: 'content-missing-summary',
        severity: 'notice',
        message: `Long content (${wordCount} words) without a TL;DR or summary section. Adding a summary helps users and AI extraction.`,
        url,
      });
    }
  }

  return issues;
}

/**
 * Check if the first 20% of the body content contains a summary-like section.
 * Looks for headings or elements containing summary-related text.
 */
function checkForSummarySection(html: string): boolean {
  // Extract body content if possible
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;

  // Take the first 20% of body content
  const cutoff = Math.ceil(bodyContent.length * 0.2);
  const firstPortion = bodyContent.slice(0, cutoff).toLowerCase();

  // Check for summary labels in headings, strong tags, or any element text
  for (const label of SUMMARY_LABELS) {
    // Check in heading tags (h1-h6)
    const headingPattern = new RegExp(`<h[1-6][^>]*>[^<]*${escapeRegex(label)}[^<]*</h[1-6]>`, 'i');
    if (headingPattern.test(firstPortion)) {
      return true;
    }

    // Check in strong/b tags
    const strongPattern = new RegExp(`<(?:strong|b)[^>]*>[^<]*${escapeRegex(label)}[^<]*</(?:strong|b)>`, 'i');
    if (strongPattern.test(firstPortion)) {
      return true;
    }

    // Check as plain text near the beginning (e.g., a paragraph starting with "TL;DR:")
    if (firstPortion.includes(label)) {
      return true;
    }
  }

  return false;
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Detect possible content cannibalization across pages.
 *
 * Compares keyword overlap in titles and H1s between pairs of pages.
 * If overlap > 0.6, flags a warning.
 */
export function detectCannibalization(
  pages: Array<{ url: string; title?: string; h1s: string[]; description?: string }>
): Issue[] {
  const issues: Issue[] = [];

  // Extract significant keywords for each page
  const pageKeywords: Array<{ url: string; keywords: Set<string> }> = [];

  for (const page of pages) {
    const keywords = new Set<string>();

    // Extract keywords from title
    if (page.title) {
      extractKeywords(page.title).forEach((kw) => keywords.add(kw));
    }

    // Extract keywords from H1s
    for (const h1 of page.h1s) {
      extractKeywords(h1).forEach((kw) => keywords.add(kw));
    }

    if (keywords.size > 0) {
      pageKeywords.push({ url: page.url, keywords });
    }
  }

  // Compare each pair of pages
  for (let i = 0; i < pageKeywords.length; i++) {
    for (let j = i + 1; j < pageKeywords.length; j++) {
      const a = pageKeywords[i];
      const b = pageKeywords[j];

      // Skip if same URL
      if (a.url === b.url) continue;

      // Compute shared keywords
      let sharedCount = 0;
      for (const kw of Array.from(a.keywords)) {
        if (b.keywords.has(kw)) {
          sharedCount++;
        }
      }

      const minSize = Math.min(a.keywords.size, b.keywords.size);
      if (minSize === 0) continue;

      const overlap = sharedCount / minSize;

      if (overlap > 0.6) {
        issues.push({
          check: 'content-cannibalization',
          severity: 'warning',
          message: `Possible content cannibalization between '${a.url}' and '${b.url}' \u2014 similar keywords in titles/H1s`,
        });
      }
    }
  }

  return issues;
}

/**
 * Extract significant keywords from a text string.
 * Splits by spaces, lowercases, and filters out stop words.
 */
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9]/g, ''))
    .filter((word) => word.length > 0 && !STOP_WORDS.has(word));
}
