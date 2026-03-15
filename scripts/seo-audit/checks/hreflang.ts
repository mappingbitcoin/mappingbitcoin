import type { Issue } from '../types.js';

/**
 * ISO 639-1 language codes (subset of commonly used codes for validation).
 * This covers the vast majority of languages used on the web.
 */
const VALID_ISO_639_1: ReadonlySet<string> = new Set([
  'aa', 'ab', 'af', 'ak', 'am', 'an', 'ar', 'as', 'av', 'ay', 'az',
  'ba', 'be', 'bg', 'bh', 'bi', 'bm', 'bn', 'bo', 'br', 'bs',
  'ca', 'ce', 'ch', 'co', 'cr', 'cs', 'cu', 'cv', 'cy',
  'da', 'de', 'dv', 'dz',
  'ee', 'el', 'en', 'eo', 'es', 'et', 'eu',
  'fa', 'ff', 'fi', 'fj', 'fo', 'fr', 'fy',
  'ga', 'gd', 'gl', 'gn', 'gu', 'gv',
  'ha', 'he', 'hi', 'ho', 'hr', 'ht', 'hu', 'hy', 'hz',
  'ia', 'id', 'ie', 'ig', 'ii', 'ik', 'in', 'io', 'is', 'it', 'iu',
  'ja', 'jv',
  'ka', 'kg', 'ki', 'kj', 'kk', 'kl', 'km', 'kn', 'ko', 'kr', 'ks', 'ku', 'kv', 'kw', 'ky',
  'la', 'lb', 'lg', 'li', 'ln', 'lo', 'lt', 'lu', 'lv',
  'mg', 'mh', 'mi', 'mk', 'ml', 'mn', 'mr', 'ms', 'mt', 'my',
  'na', 'nb', 'nd', 'ne', 'ng', 'nl', 'nn', 'no', 'nr', 'nv', 'ny',
  'oc', 'oj', 'om', 'or', 'os',
  'pa', 'pi', 'pl', 'ps', 'pt',
  'qu',
  'rm', 'rn', 'ro', 'ru', 'rw',
  'sa', 'sc', 'sd', 'se', 'sg', 'si', 'sk', 'sl', 'sm', 'sn', 'so', 'sq', 'sr', 'ss', 'st', 'su', 'sv', 'sw',
  'ta', 'te', 'tg', 'th', 'ti', 'tk', 'tl', 'tn', 'to', 'tr', 'ts', 'tt', 'tw', 'ty',
  'ug', 'uk', 'ur', 'uz',
  've', 'vi', 'vo',
  'wa', 'wo',
  'xh',
  'yi', 'yo',
  'za', 'zh', 'zu',
]);

/**
 * Check hreflang implementation on a page.
 *
 * According to Ahrefs, 67%+ of sites have hreflang errors. This check validates:
 * - Self-referencing hreflang tag exists
 * - x-default tag is present
 * - Language codes are valid ISO 639-1 (optionally with region)
 * - All hreflang URLs are absolute
 * - Reports all hreflang tags found
 */
export function checkHreflang(html: string, url: string): Issue[] {
  const issues: Issue[] = [];

  // Extract all <link rel="alternate" hreflang="..."> tags
  const hreflangRegex = /<link\s[^>]*rel\s*=\s*["']alternate["'][^>]*hreflang\s*=\s*["']([^"']*)["'][^>]*>/gi;
  const hreflangRegex2 = /<link\s[^>]*hreflang\s*=\s*["']([^"']*)["'][^>]*rel\s*=\s*["']alternate["'][^>]*>/gi;

  interface HreflangEntry {
    lang: string;
    href: string;
    raw: string;
  }

  const entries: HreflangEntry[] = [];
  const seenTags = new Set<string>();

  // Collect from both attribute orderings
  for (const regex of [hreflangRegex, hreflangRegex2]) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      const fullTag = match[0];
      // Deduplicate in case both regexes match the same tag
      if (seenTags.has(fullTag)) continue;
      seenTags.add(fullTag);

      const lang = match[1].trim();
      const hrefMatch = fullTag.match(/href\s*=\s*["']([^"']*)["']/i);
      const href = hrefMatch ? hrefMatch[1].trim() : '';

      entries.push({ lang, href, raw: fullTag });
    }
  }

  // If no hreflang tags found, nothing to check (not every site needs them)
  if (entries.length === 0) {
    return issues;
  }

  // Report all hreflang tags found (informational)
  const langList = entries.map((e) => `${e.lang} -> ${e.href}`).join('\n');
  issues.push({
    check: 'hreflang',
    severity: 'pass',
    message: `Found ${entries.length} hreflang tag(s)`,
    url,
    details: langList,
  });

  // Check for self-referencing hreflang
  const normalizedPageUrl = normalizeUrl(url);
  const hasSelfRef = entries.some(
    (e) => normalizeUrl(e.href) === normalizedPageUrl && e.lang !== 'x-default'
  );

  if (!hasSelfRef) {
    issues.push({
      check: 'hreflang',
      severity: 'error',
      message: 'Missing self-referencing hreflang tag',
      url,
      details:
        'Every page with hreflang tags must include a self-referencing hreflang tag pointing to itself. This is the most common hreflang error.',
    });
  }

  // Check for x-default
  const hasXDefault = entries.some((e) => e.lang.toLowerCase() === 'x-default');
  if (!hasXDefault) {
    issues.push({
      check: 'hreflang',
      severity: 'warning',
      message: 'Missing x-default hreflang tag',
      url,
      details:
        'The x-default tag tells search engines which page to show users whose language/region does not match any hreflang tag.',
    });
  }

  // Validate each entry
  for (const entry of entries) {
    // Check absolute URL
    if (entry.href && !/^https?:\/\//i.test(entry.href)) {
      issues.push({
        check: 'hreflang',
        severity: 'error',
        message: `Hreflang URL is not absolute for lang="${entry.lang}"`,
        url,
        details: `href="${entry.href}" must be a full absolute URL.`,
      });
    }

    if (!entry.href) {
      issues.push({
        check: 'hreflang',
        severity: 'error',
        message: `Hreflang tag for lang="${entry.lang}" has no href`,
        url,
      });
    }

    // Validate language code (skip x-default)
    if (entry.lang.toLowerCase() !== 'x-default') {
      if (!isValidLanguageCode(entry.lang)) {
        issues.push({
          check: 'hreflang',
          severity: 'error',
          message: `Invalid hreflang language code: "${entry.lang}"`,
          url,
          details:
            'Hreflang values must be a valid ISO 639-1 language code (e.g., "en"), optionally followed by an ISO 3166-1 alpha-2 region code (e.g., "en-US").',
        });
      }
    }
  }

  return issues;
}

/**
 * Validate a language/region code.
 * Accepts formats: "en", "en-US", "zh-Hans", "pt-BR"
 */
function isValidLanguageCode(code: string): boolean {
  const lower = code.toLowerCase();

  // Simple language code: "en"
  if (VALID_ISO_639_1.has(lower)) {
    return true;
  }

  // Language-Region: "en-US", "pt-BR"
  const parts = lower.split('-');
  if (parts.length === 2) {
    const lang = parts[0];
    const region = parts[1];

    if (!VALID_ISO_639_1.has(lang)) {
      return false;
    }

    // Region code: 2-letter country code (ISO 3166-1 alpha-2) or script code (4-letter, e.g., Hans/Hant)
    if (/^[a-z]{2}$/.test(region) || /^[a-z]{4}$/.test(region)) {
      return true;
    }
  }

  // Language-Script-Region: "zh-Hans-CN"
  if (parts.length === 3) {
    const lang = parts[0];
    const script = parts[1];
    const region = parts[2];

    if (
      VALID_ISO_639_1.has(lang) &&
      /^[a-z]{4}$/.test(script) &&
      /^[a-z]{2}$/.test(region)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Normalize URL for comparison.
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
