import type { Issue } from '../types.js';

/**
 * Extract a specific attribute value from a tag string.
 * Returns null if the attribute is not present.
 */
function getAttribute(tag: string, attrName: string): string | null {
  const patterns = [
    // Double-quoted
    new RegExp(`\\b${attrName}\\s*=\\s*"([^"]*)"`, 'i'),
    // Single-quoted
    new RegExp(`\\b${attrName}\\s*=\\s*'([^']*)'`, 'i'),
    // Unquoted (value ends at whitespace, >, or /)
    new RegExp(`\\b${attrName}\\s*=\\s*([^\\s>"']+)`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = tag.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // Check for standalone boolean attribute (e.g., <script defer>)
  const standalonePattern = new RegExp(`\\b${attrName}(?=\\s|/?>)(?!\\s*=)`, 'i');
  if (standalonePattern.test(tag)) {
    return '';
  }

  return null;
}

/**
 * Clean HTML by removing comments, script contents, and noscript blocks
 * to avoid false positives when parsing tags.
 */
function cleanHtml(html: string): string {
  let cleaned = html;
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  cleaned = cleaned.replace(/<noscript[\s>][\s\S]*?<\/noscript>/gi, '');
  return cleaned;
}

/**
 * Extract all <img> tags from cleaned HTML.
 */
function extractImgTags(html: string): string[] {
  const tags: string[] = [];
  const pattern = /<img\s[^>]*\/?>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    tags.push(match[0]);
  }
  return tags;
}

/**
 * Extract all <script> tags (opening tag only, with attributes) from cleaned HTML.
 */
function extractScriptTags(html: string): string[] {
  const tags: string[] = [];
  const pattern = /<script\s([^>]*)>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    tags.push(match[0]);
  }
  return tags;
}

/**
 * Extract inline <style> block contents from HTML.
 */
function extractInlineStyleContents(html: string): string[] {
  const contents: string[] = [];
  const pattern = /<style[\s>][^>]*>([\s\S]*?)<\/style>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    contents.push(match[1]);
  }
  return contents;
}

/**
 * Check performance-related HTML attributes.
 *
 * Checks performed:
 * - Non-WebP/AVIF images (legacy formats)
 * - Missing lazy loading on images (skipping first 2 and eager-loaded)
 * - Render-blocking scripts (no defer/async, not type=module/json)
 * - Missing font-display in inline @font-face blocks
 */
export function checkPerformance(html: string, url: string): Issue[] {
  const issues: Issue[] = [];
  const cleaned = cleanHtml(html);

  // --- 1. Non-WebP/AVIF images ---
  const imgTags = extractImgTags(cleaned);
  const legacyExtPattern = /\.(png|jpg|jpeg|gif|bmp|tiff)(?:[?#]|$)/i;
  let legacyImageCount = 0;
  const totalImages = imgTags.length;

  for (const tag of imgTags) {
    const src = getAttribute(tag, 'src');
    if (!src) continue;

    const extMatch = src.match(legacyExtPattern);
    if (extMatch) {
      const ext = extMatch[1].toLowerCase();
      legacyImageCount++;
      issues.push({
        check: 'image-legacy-format',
        severity: 'notice',
        message: `Image '${src}' uses ${ext} format. Consider converting to WebP or AVIF for better compression.`,
        url,
      });
    }
  }

  if (legacyImageCount > 0) {
    issues.push({
      check: 'image-legacy-format-summary',
      severity: 'warning',
      message: `${legacyImageCount} of ${totalImages} images use legacy formats (not WebP/AVIF).`,
      url,
    });
  }

  // --- 2. Missing lazy loading ---
  // Skip the first 2 images (likely above-the-fold) and images with loading="eager"
  let missingLazyCount = 0;
  const missingLazySrcs: string[] = [];

  for (let i = 0; i < imgTags.length; i++) {
    // Skip first 2 images (likely above the fold)
    if (i < 2) continue;

    const tag = imgTags[i];
    const loadingAttr = getAttribute(tag, 'loading');

    // Skip images explicitly set to eager (intentional above-the-fold)
    if (loadingAttr !== null && loadingAttr.toLowerCase() === 'eager') {
      continue;
    }

    // Flag if loading attribute is missing or not set to lazy
    if (loadingAttr === null || loadingAttr.toLowerCase() !== 'lazy') {
      const src = getAttribute(tag, 'src') || '(no src)';
      missingLazyCount++;
      missingLazySrcs.push(src);
      issues.push({
        check: 'image-missing-lazy-loading',
        severity: 'notice',
        message: `Image '${src}' is missing loading="lazy" attribute.`,
        url,
      });
    }
  }

  if (missingLazyCount > 0) {
    issues.push({
      check: 'image-lazy-loading-summary',
      severity: 'warning',
      message: `${missingLazyCount} image(s) below the fold are missing lazy loading.`,
      url,
      details:
        missingLazySrcs.slice(0, 10).join('\n') +
        (missingLazySrcs.length > 10
          ? `\n... and ${missingLazySrcs.length - 10} more`
          : ''),
    });
  }

  // --- 3. Render-blocking scripts ---
  const scriptTags = extractScriptTags(cleaned);
  let renderBlockingCount = 0;
  const renderBlockingSrcs: string[] = [];

  for (const tag of scriptTags) {
    const src = getAttribute(tag, 'src');

    // Only check scripts with a src attribute (external scripts)
    if (src === null) continue;

    // Skip type="module" (deferred by default)
    const typeAttr = getAttribute(tag, 'type');
    if (typeAttr !== null) {
      const typeLower = typeAttr.toLowerCase();
      if (
        typeLower === 'module' ||
        typeLower === 'application/ld+json' ||
        typeLower === 'application/json'
      ) {
        continue;
      }
    }

    // Check for defer or async attributes
    const hasDefer = getAttribute(tag, 'defer') !== null;
    const hasAsync = getAttribute(tag, 'async') !== null;

    if (!hasDefer && !hasAsync) {
      renderBlockingCount++;
      renderBlockingSrcs.push(src);
      issues.push({
        check: 'script-render-blocking',
        severity: 'warning',
        message: `Script '${src}' is render-blocking. Add defer or async attribute.`,
        url,
      });
    }
  }

  if (renderBlockingCount > 0) {
    issues.push({
      check: 'script-render-blocking-summary',
      severity: 'warning',
      message: `${renderBlockingCount} render-blocking script(s) found.`,
      url,
      details: renderBlockingSrcs.join('\n'),
    });
  }

  // --- 4. Missing font-display in inline @font-face ---
  const styleContents = extractInlineStyleContents(cleaned);
  const fontFacePattern = /@font-face\s*\{[^}]*\}/gi;

  for (const styleContent of styleContents) {
    let fontFaceMatch: RegExpExecArray | null;
    const fontFaceRe = new RegExp(fontFacePattern.source, 'gi');

    while ((fontFaceMatch = fontFaceRe.exec(styleContent)) !== null) {
      const block = fontFaceMatch[0];

      if (!/font-display\s*:/i.test(block)) {
        issues.push({
          check: 'font-display-missing',
          severity: 'notice',
          message:
            'Inline @font-face missing font-display property. Use font-display: swap to prevent invisible text.',
          url,
        });
      }
    }
  }

  return issues;
}
