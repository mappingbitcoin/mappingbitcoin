import type { Issue } from '../types.js';

/**
 * Represents a parsed <img> tag with its relevant attributes.
 */
interface ImageTag {
  src: string | null;
  alt: string | null;  // null means attribute is absent; '' means empty alt=""
  hasWidth: boolean;
  hasHeight: boolean;
  raw: string;         // the full <img ...> tag for reference
}

/**
 * Extract a specific attribute value from a tag string.
 * Returns null if the attribute is not present.
 * Returns '' if the attribute is present but empty (e.g., alt="").
 */
function getAttribute(tag: string, attrName: string): string | null {
  // Match attr="value", attr='value', or attr=value (unquoted)
  // Also match standalone boolean-style attribute (e.g., just `alt` with no value)
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

  // Check for standalone attribute (e.g., <img alt> with no = sign)
  // This is unusual but valid HTML — treat it as empty string
  const standalonePattern = new RegExp(`\\b${attrName}(?=\\s|/?>)(?!\\s*=)`, 'i');
  if (standalonePattern.test(tag)) {
    return '';
  }

  return null;
}

/**
 * Extract all <img> tags from HTML, ignoring those in scripts/styles/comments.
 */
function extractImages(html: string): ImageTag[] {
  // Remove content we should not parse images from
  let cleaned = html;
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  cleaned = cleaned.replace(/<script[\s>][\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<style[\s>][\s\S]*?<\/style>/gi, '');
  cleaned = cleaned.replace(/<noscript[\s>][\s\S]*?<\/noscript>/gi, '');

  const images: ImageTag[] = [];
  // Match self-closing <img .../> and unclosed <img ...>
  const pattern = /<img\s[^>]*\/?>/gi;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(cleaned)) !== null) {
    const tag = match[0];
    images.push({
      src: getAttribute(tag, 'src'),
      alt: getAttribute(tag, 'alt'),
      hasWidth: getAttribute(tag, 'width') !== null,
      hasHeight: getAttribute(tag, 'height') !== null,
      raw: tag,
    });
  }

  return images;
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
 * Check images following Ahrefs guidelines.
 *
 * Checks performed:
 * - Images without alt attribute (warning, lists src)
 * - Images with empty alt="" (notice, may be decorative)
 * - Images without width/height attributes (notice, CLS risk)
 * - Summary of total images vs images without alt
 */
export function checkImages(html: string, url: string): Issue[] {
  const issues: Issue[] = [];
  const images = extractImages(html);

  if (images.length === 0) {
    return issues;
  }

  const missingAlt: string[] = [];
  const emptyAlt: string[] = [];
  const missingDimensions: string[] = [];

  for (const img of images) {
    const srcDisplay = img.src ? decodeEntities(img.src) : '(no src)';

    // alt attribute is completely absent
    if (img.alt === null) {
      missingAlt.push(srcDisplay);
      issues.push({
        check: 'image-alt-missing',
        severity: 'warning',
        message: `Image is missing alt attribute: ${srcDisplay}`,
        url,
        details: img.raw,
      });
    }
    // alt attribute is present but empty
    else if (img.alt.trim() === '') {
      emptyAlt.push(srcDisplay);
      issues.push({
        check: 'image-alt-empty',
        severity: 'notice',
        message: `Image has empty alt text (may be intentional for decorative images): ${srcDisplay}`,
        url,
        details: img.raw,
      });
    }

    // Missing width or height (CLS risk)
    if (!img.hasWidth || !img.hasHeight) {
      const missing = [];
      if (!img.hasWidth) missing.push('width');
      if (!img.hasHeight) missing.push('height');

      missingDimensions.push(srcDisplay);
      issues.push({
        check: 'image-missing-dimensions',
        severity: 'notice',
        message: `Image is missing ${missing.join(' and ')} attribute(s) (CLS risk): ${srcDisplay}`,
        url,
        details: img.raw,
      });
    }
  }

  // Summary notice with counts
  if (missingAlt.length > 0) {
    issues.push({
      check: 'image-alt-summary',
      severity: 'warning',
      message: `${missingAlt.length} of ${images.length} images are missing alt attributes`,
      url,
      details: missingAlt.slice(0, 10).join('\n') + (missingAlt.length > 10 ? `\n... and ${missingAlt.length - 10} more` : ''),
    });
  }

  // Check for non-descriptive image filenames
  const genericFilenamePatterns = [
    /^IMG[_-]\d+/i,
    /^DSC[_-]\d+/i,
    /^DCIM/i,
    /^image\d+/i,
    /^photo\d+/i,
    /^pic\d+/i,
    /^screenshot[\d_-]/i,
    /^untitled$/i,
    /^[a-f0-9]{8,}$/i,           // Hash/UUID-like string (8+ hex chars)
    /^[a-f0-9]{8}-[a-f0-9]{4}-/i, // UUID format
    /^[a-z0-9]$/i,               // Single letter or number filename
    /^\d$/,                       // Single digit filename
  ];

  const genericFilenames: string[] = [];

  for (const img of images) {
    if (!img.src) continue;

    // Extract filename from src (strip path and extension)
    const srcDecoded = decodeEntities(img.src);
    const pathSegments = srcDecoded.split(/[/\\]/);
    const fullFilename = pathSegments[pathSegments.length - 1];
    // Remove query string and fragment
    const cleanFilename = fullFilename.split(/[?#]/)[0];
    // Remove extension
    const filename = cleanFilename.replace(/\.[^.]+$/, '');

    if (!filename) continue;

    const isGeneric = genericFilenamePatterns.some((pattern) => pattern.test(filename));

    if (isGeneric) {
      genericFilenames.push(cleanFilename);
      issues.push({
        check: 'image-filename-generic',
        severity: 'notice',
        message: `Image has non-descriptive filename: "${cleanFilename}"`,
        url,
        details: `Source: ${srcDecoded}. Use descriptive filenames like "brown-dog-playing.jpg" instead of "${cleanFilename}"`,
      });
    }
  }

  if (genericFilenames.length > 0) {
    issues.push({
      check: 'image-filename-summary',
      severity: 'warning',
      message: `${genericFilenames.length} of ${images.length} images have non-descriptive filenames`,
      url,
    });
  }

  return issues;
}
