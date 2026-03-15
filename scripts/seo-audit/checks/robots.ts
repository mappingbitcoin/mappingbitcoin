import type { Issue } from '../types.js';

/**
 * Parsed robots.txt rule.
 */
interface RobotsRule {
  userAgent: string;
  allows: string[];
  disallows: string[];
}

/**
 * Check robots.txt for SEO issues.
 *
 * Validates:
 * - robots.txt exists
 * - Contains User-agent: *
 * - Does not block important paths (/, /sitemap.xml)
 * - References a sitemap
 */
export function checkRobotsTxt(
  content: string | null,
  siteUrl: string
): Issue[] {
  const issues: Issue[] = [];

  if (content === null || content === undefined) {
    issues.push({
      check: 'robots',
      severity: 'error',
      message: 'robots.txt not found',
      url: siteUrl,
      details:
        'A robots.txt file should exist at the root of your domain. Without it, crawlers will assume all pages are crawlable.',
    });
    return issues;
  }

  if (content.trim() === '') {
    issues.push({
      check: 'robots',
      severity: 'warning',
      message: 'robots.txt is empty',
      url: siteUrl,
      details:
        'An empty robots.txt provides no crawl directives. Consider adding User-agent and Sitemap directives.',
    });
    return issues;
  }

  const lines = content.split(/\r?\n/);

  // Check for User-agent: *
  const hasWildcardUserAgent = lines.some(
    (line) => /^\s*user-agent\s*:\s*\*/i.test(line)
  );

  if (!hasWildcardUserAgent) {
    issues.push({
      check: 'robots',
      severity: 'warning',
      message: 'robots.txt missing User-agent: *',
      url: siteUrl,
      details:
        'The wildcard User-agent (*) provides default rules for all crawlers. Without it, crawlers without specific rules will ignore the file.',
    });
  }

  // Parse all rules
  const rules = parseRobotsTxt(content);

  // Check if root path is blocked
  const rootBlocked = !isUrlAllowed(content, siteUrl + '/', '*');
  if (rootBlocked) {
    issues.push({
      check: 'robots',
      severity: 'warning',
      message: 'robots.txt blocks the root path (/)',
      url: siteUrl,
      details:
        'Disallowing the root path prevents search engines from crawling your entire site.',
    });
  }

  // Check if sitemap path is blocked
  const sitemapBlocked = !isUrlAllowed(content, siteUrl + '/sitemap.xml', '*');
  if (sitemapBlocked) {
    issues.push({
      check: 'robots',
      severity: 'warning',
      message: 'robots.txt blocks /sitemap.xml',
      url: siteUrl,
      details:
        'Blocking the sitemap URL prevents search engines from discovering your sitemap through crawling.',
    });
  }

  // Check for Sitemap directive
  const sitemapDirectives = lines.filter((line) =>
    /^\s*sitemap\s*:/i.test(line)
  );

  if (sitemapDirectives.length > 0) {
    const sitemapUrls = sitemapDirectives
      .map((line) => {
        const match = line.match(/^\s*sitemap\s*:\s*(.+)/i);
        return match ? match[1].trim() : '';
      })
      .filter(Boolean);

    issues.push({
      check: 'robots',
      severity: 'pass',
      message: `Sitemap referenced in robots.txt: ${sitemapUrls.join(', ')}`,
      url: siteUrl,
    });
  } else {
    issues.push({
      check: 'robots',
      severity: 'warning',
      message: 'No Sitemap directive found in robots.txt',
      url: siteUrl,
      details:
        'Add a Sitemap directive (e.g., "Sitemap: https://example.com/sitemap.xml") to help search engines find your sitemap.',
    });
  }

  // Report useful rule summary
  const ruleCount = rules.reduce(
    (sum, r) => sum + r.allows.length + r.disallows.length,
    0
  );
  const userAgents = rules.map((r) => r.userAgent);

  issues.push({
    check: 'robots',
    severity: 'pass',
    message: `robots.txt parsed: ${ruleCount} rule(s) for ${userAgents.length} user-agent(s)`,
    url: siteUrl,
    details: `User-agents: ${userAgents.join(', ')}`,
  });

  // Check for AI crawler blocking
  const aiCrawlers = [
    'GPTBot',
    'ChatGPT-User',
    'Google-Extended',
    'Googlebot-Extended',
    'anthropic-ai',
    'Claude-Web',
    'CCBot',
    'PerplexityBot',
    'Bytespider',
    'Applebot-Extended',
  ];

  const blockedAiCrawlers: string[] = [];
  for (const crawler of aiCrawlers) {
    // Check if this crawler has an explicit user-agent section with Disallow: /
    const crawlerRule = rules.find(
      (r) => r.userAgent.toLowerCase() === crawler.toLowerCase()
    );
    if (crawlerRule && crawlerRule.disallows.includes('/')) {
      blockedAiCrawlers.push(crawler);
    }
  }

  if (blockedAiCrawlers.length > 0) {
    for (const userAgent of blockedAiCrawlers) {
      issues.push({
        check: 'ai-crawler-blocked',
        severity: 'notice',
        message: `AI crawler "${userAgent}" is blocked by robots.txt`,
        details:
          'Blocking AI crawlers may prevent your content from appearing in AI-generated answers and overviews. Review if this is intentional.',
      });
    }
  } else {
    issues.push({
      check: 'ai-crawlers-allowed',
      severity: 'pass',
      message: 'No AI crawlers are blocked in robots.txt',
    });
  }

  // Check for CSS/JS/static resource blocking
  const wildcardRule = rules.find((r) => r.userAgent === '*');
  if (wildcardRule) {
    const resourcePatterns: Array<{ patterns: string[]; resourceType: string }> = [
      { patterns: ['*.css', '*.css$'], resourceType: 'CSS' },
      { patterns: ['*.js', '*.js$'], resourceType: 'JavaScript' },
      { patterns: ['/_next/'], resourceType: 'Next.js asset' },
      { patterns: ['/static/'], resourceType: 'static' },
      { patterns: ['/assets/'], resourceType: 'asset' },
      { patterns: ['/public/'], resourceType: 'public' },
    ];

    for (const { patterns, resourceType } of resourcePatterns) {
      for (const pattern of patterns) {
        const matchingRule = wildcardRule.disallows.find(
          (disallow) => disallow === pattern
        );
        if (matchingRule) {
          issues.push({
            check: 'robots-blocks-resources',
            severity: 'warning',
            message: `robots.txt may block ${resourceType} resources: "${matchingRule}"`,
            details:
              'Blocking CSS and JS prevents search engines from rendering your pages properly, which can hurt rankings.',
          });
        }
      }
    }
  }

  return issues;
}

/**
 * Check if a URL is allowed by robots.txt rules.
 * Follows the standard robots.txt specification:
 * - Most specific rule wins (longest matching path)
 * - Allow overrides Disallow for same-length matches
 *
 * @param robotsContent - Raw robots.txt content
 * @param url - Full URL to check
 * @param userAgent - User-agent to check rules for (defaults to "*")
 */
export function isUrlAllowed(
  robotsContent: string,
  url: string,
  userAgent: string = '*'
): boolean {
  const rules = parseRobotsTxt(robotsContent);

  // Find the most specific user-agent match
  const ua = userAgent.toLowerCase();
  let applicableRules: RobotsRule | null = null;

  // First try exact user-agent match
  for (const rule of rules) {
    if (rule.userAgent.toLowerCase() === ua) {
      applicableRules = rule;
      break;
    }
  }

  // Fall back to wildcard
  if (!applicableRules) {
    for (const rule of rules) {
      if (rule.userAgent === '*') {
        applicableRules = rule;
        break;
      }
    }
  }

  // No rules found means allowed
  if (!applicableRules) return true;

  // Extract the path from the URL
  const urlPath = extractPath(url);

  // Find all matching rules and pick the most specific (longest match)
  let bestMatch = '';
  let bestMatchIsAllow = true;

  for (const pattern of applicableRules.disallows) {
    if (pattern === '') continue; // Disallow: (empty) means allow all
    if (matchesRobotsPattern(urlPath, pattern)) {
      if (pattern.length > bestMatch.length) {
        bestMatch = pattern;
        bestMatchIsAllow = false;
      } else if (pattern.length === bestMatch.length) {
        // For same-length, Disallow takes precedence only if no Allow matches
        bestMatchIsAllow = false;
      }
    }
  }

  for (const pattern of applicableRules.allows) {
    if (matchesRobotsPattern(urlPath, pattern)) {
      if (pattern.length > bestMatch.length) {
        bestMatch = pattern;
        bestMatchIsAllow = true;
      } else if (pattern.length === bestMatch.length) {
        // Allow overrides Disallow for same-length matches
        bestMatchIsAllow = true;
      }
    }
  }

  return bestMatch === '' ? true : bestMatchIsAllow;
}

/**
 * Parse robots.txt content into structured rules.
 */
function parseRobotsTxt(content: string): RobotsRule[] {
  const lines = content.split(/\r?\n/);
  const rules: RobotsRule[] = [];
  let currentRule: RobotsRule | null = null;

  for (const rawLine of lines) {
    // Remove comments and trim
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;

    const userAgentMatch = line.match(/^\s*user-agent\s*:\s*(.+)/i);
    if (userAgentMatch) {
      const ua = userAgentMatch[1].trim();
      // Check if this is a consecutive User-agent directive (group)
      if (
        currentRule &&
        currentRule.allows.length === 0 &&
        currentRule.disallows.length === 0
      ) {
        // This is another User-agent in the same group; create a separate rule with same refs
        currentRule = { userAgent: ua, allows: [], disallows: [] };
      } else {
        currentRule = { userAgent: ua, allows: [], disallows: [] };
      }
      rules.push(currentRule);
      continue;
    }

    if (!currentRule) continue;

    const disallowMatch = line.match(/^\s*disallow\s*:\s*(.*)/i);
    if (disallowMatch) {
      currentRule.disallows.push(disallowMatch[1].trim());
      continue;
    }

    const allowMatch = line.match(/^\s*allow\s*:\s*(.*)/i);
    if (allowMatch) {
      currentRule.allows.push(allowMatch[1].trim());
      continue;
    }
  }

  return rules;
}

/**
 * Check if a URL path matches a robots.txt pattern.
 * Supports:
 * - Simple prefix matching: /path
 * - Wildcard: /path/*
 * - End anchor: /path$
 */
function matchesRobotsPattern(urlPath: string, pattern: string): boolean {
  if (pattern === '') return false;

  // Handle end-of-string anchor ($)
  const hasEndAnchor = pattern.endsWith('$');
  let p = hasEndAnchor ? pattern.slice(0, -1) : pattern;

  // Escape regex special characters except * (which is a wildcard in robots.txt)
  const regexStr = p
    .replace(/[.+?^{}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');

  const regex = hasEndAnchor
    ? new RegExp('^' + regexStr + '$')
    : new RegExp('^' + regexStr);

  return regex.test(urlPath);
}

/**
 * Extract the path from a URL.
 */
function extractPath(urlStr: string): string {
  const match = urlStr.match(/^https?:\/\/[^/?#]+(\/[^?#]*)?/i);
  return match ? match[1] || '/' : '/';
}
