import type { Issue } from '../types.js';

/**
 * Check JSON-LD structured data on a page.
 *
 * Validates:
 * - Presence of JSON-LD script tags
 * - Valid JSON parsing
 * - Required @context and @type properties
 * - Schema-specific required fields for common types
 * - Reports all schema types found
 */
export function checkStructuredData(html: string, url: string): Issue[] {
  const issues: Issue[] = [];

  // Extract all <script type="application/ld+json"> blocks
  const jsonLdRegex =
    /<script\s[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const blocks: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    blocks.push(match[1].trim());
  }

  if (blocks.length === 0) {
    issues.push({
      check: 'structured-data',
      severity: 'notice',
      message: 'No JSON-LD structured data found',
      url,
      details:
        'Adding structured data (JSON-LD) helps search engines understand your content and can enable rich results.',
    });
    return issues;
  }

  const allTypes: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const blockLabel = blocks.length > 1 ? ` (block ${i + 1})` : '';
    let parsed: unknown;

    try {
      parsed = JSON.parse(blocks[i]);
    } catch (err) {
      issues.push({
        check: 'structured-data',
        severity: 'error',
        message: `JSON-LD parse error${blockLabel}`,
        url,
        details: `Invalid JSON in structured data: ${err instanceof Error ? err.message : String(err)}`,
      });
      continue;
    }

    // Handle arrays of schemas (e.g., [@graph] or just an array)
    const schemas = Array.isArray(parsed) ? parsed : [parsed];

    for (const schema of schemas) {
      if (typeof schema !== 'object' || schema === null) {
        issues.push({
          check: 'structured-data',
          severity: 'error',
          message: `JSON-LD block${blockLabel} is not a valid object`,
          url,
        });
        continue;
      }

      const obj = schema as Record<string, unknown>;

      // Handle @graph property (common in WordPress/Yoast)
      if (Array.isArray(obj['@graph'])) {
        for (const graphItem of obj['@graph']) {
          if (typeof graphItem === 'object' && graphItem !== null) {
            const graphIssues = validateSchema(
              graphItem as Record<string, unknown>,
              url,
              blockLabel
            );
            issues.push(...graphIssues);
            const graphType = getSchemaType(graphItem as Record<string, unknown>);
            if (graphType) allTypes.push(graphType);
          }
        }
        continue;
      }

      const schemaIssues = validateSchema(obj, url, blockLabel);
      issues.push(...schemaIssues);
      const schemaType = getSchemaType(obj);
      if (schemaType) allTypes.push(schemaType);
    }
  }

  // Report all schema types found
  if (allTypes.length > 0) {
    issues.push({
      check: 'structured-data',
      severity: 'pass',
      message: `Found ${allTypes.length} schema type(s): ${allTypes.join(', ')}`,
      url,
    });
  }

  // Proactive detection: HowTo opportunity
  const hasHowToSchema = allTypes.includes('HowTo');
  if (!hasHowToSchema) {
    const headingRegex = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
    let headingMatch: RegExpExecArray | null;
    let hasHowToHeading = false;

    while ((headingMatch = headingRegex.exec(html)) !== null) {
      const headingText = headingMatch[1].replace(/<[^>]*>/g, '').trim();
      if (/how\s+to\b|how\s+do\b|step\s+by\s+step|steps\s+to\b/i.test(headingText)) {
        hasHowToHeading = true;
        break;
      }
    }

    if (hasHowToHeading) {
      issues.push({
        check: 'schema-howto-opportunity',
        severity: 'notice',
        message: 'Page contains "how to" headings but no HowTo schema',
        url,
        details:
          'Adding HowTo structured data can enable rich results and increase AI pull-through for step-by-step content.',
      });
    }
  }

  // Proactive detection: FAQ opportunity
  const hasFAQSchema = allTypes.includes('FAQPage');
  if (!hasFAQSchema) {
    const faqHeadingRegex = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
    let faqHeadingMatch: RegExpExecArray | null;
    let hasFaqHeading = false;

    while ((faqHeadingMatch = faqHeadingRegex.exec(html)) !== null) {
      const headingText = faqHeadingMatch[1].replace(/<[^>]*>/g, '').trim();
      if (/\?|FAQ|Frequently\s+Asked/i.test(headingText)) {
        hasFaqHeading = true;
        break;
      }
    }

    if (hasFaqHeading) {
      issues.push({
        check: 'schema-faq-opportunity',
        severity: 'notice',
        message: 'Page contains FAQ-like headings but no FAQPage schema',
        url,
        details:
          'Adding FAQPage structured data can enable FAQ rich results in search and improve AI extraction.',
      });
    }
  }

  return issues;
}

/**
 * Validate a single schema object for required properties.
 */
function validateSchema(
  obj: Record<string, unknown>,
  url: string,
  blockLabel: string
): Issue[] {
  const issues: Issue[] = [];

  // Check @context
  if (!obj['@context']) {
    issues.push({
      check: 'structured-data',
      severity: 'error',
      message: `Missing @context in JSON-LD${blockLabel}`,
      url,
      details: '@context is required (usually "https://schema.org").',
    });
  }

  // Check @type
  if (!obj['@type']) {
    issues.push({
      check: 'structured-data',
      severity: 'error',
      message: `Missing @type in JSON-LD${blockLabel}`,
      url,
      details: '@type is required to identify the schema type.',
    });
    return issues;
  }

  const schemaType = String(obj['@type']);

  // Schema-specific validations
  switch (schemaType) {
    case 'Organization':
      if (!obj['name']) {
        issues.push({
          check: 'structured-data',
          severity: 'warning',
          message: `Organization schema missing "name"${blockLabel}`,
          url,
        });
      }
      if (!obj['url']) {
        issues.push({
          check: 'structured-data',
          severity: 'warning',
          message: `Organization schema missing "url"${blockLabel}`,
          url,
        });
      }
      break;

    case 'Article':
    case 'BlogPosting':
    case 'NewsArticle':
    case 'TechArticle':
      if (!obj['headline']) {
        issues.push({
          check: 'structured-data',
          severity: 'warning',
          message: `${schemaType} schema missing "headline"${blockLabel}`,
          url,
        });
      }
      if (!obj['datePublished']) {
        issues.push({
          check: 'structured-data',
          severity: 'warning',
          message: `${schemaType} schema missing "datePublished"${blockLabel}`,
          url,
        });
      }
      if (!obj['author']) {
        issues.push({
          check: 'structured-data',
          severity: 'warning',
          message: `${schemaType} schema missing "author"${blockLabel}`,
          url,
        });
      }
      break;

    case 'LocalBusiness':
    case 'Restaurant':
    case 'Store':
    case 'FinancialService':
      if (!obj['name']) {
        issues.push({
          check: 'structured-data',
          severity: 'warning',
          message: `${schemaType} schema missing "name"${blockLabel}`,
          url,
        });
      }
      if (!obj['address']) {
        issues.push({
          check: 'structured-data',
          severity: 'warning',
          message: `${schemaType} schema missing "address"${blockLabel}`,
          url,
        });
      }
      break;

    case 'WebSite':
      if (!obj['url']) {
        issues.push({
          check: 'structured-data',
          severity: 'warning',
          message: `WebSite schema missing "url"${blockLabel}`,
          url,
        });
      }
      break;

    case 'BreadcrumbList':
      issues.push({
        check: 'structured-data',
        severity: 'pass',
        message: `BreadcrumbList schema found${blockLabel}`,
        url,
        details:
          'BreadcrumbList structured data helps search engines understand site hierarchy and can appear in search results.',
      });
      break;

    case 'Product':
      if (!obj['name']) {
        issues.push({
          check: 'structured-data',
          severity: 'warning',
          message: `Product schema missing "name"${blockLabel}`,
          url,
        });
      }
      break;

    case 'FAQPage':
      if (!obj['mainEntity']) {
        issues.push({
          check: 'structured-data',
          severity: 'warning',
          message: `FAQPage schema missing "mainEntity"${blockLabel}`,
          url,
        });
      }
      break;

    case 'HowTo': {
      if (!obj.name) {
        issues.push({
          check: 'schema-howto-missing-name',
          severity: 'warning',
          message: 'HowTo schema missing "name" property',
          url,
          details: 'The "name" property is required for HowTo rich results.',
        });
      }
      if (!obj.step && !obj.steps) {
        issues.push({
          check: 'schema-howto-missing-steps',
          severity: 'warning',
          message: 'HowTo schema missing "step" property',
          url,
          details:
            'The "step" property is required for HowTo rich results. Each step should have a "name" and "text".',
        });
      }
      break;
    }

    default:
      // No specific validation for other types
      break;
  }

  return issues;
}

/**
 * Extract the @type from a schema object as a string.
 */
function getSchemaType(obj: Record<string, unknown>): string | null {
  if (!obj['@type']) return null;
  if (Array.isArray(obj['@type'])) {
    return (obj['@type'] as string[]).join('/');
  }
  return String(obj['@type']);
}
