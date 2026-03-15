import { AuditConfig, PageData } from '../types';

/**
 * Normalize a URL by removing fragments, removing trailing slashes (except root),
 * and lowercasing the hostname.
 */
function normalizeUrl(urlStr: string, baseOrigin: string): string | null {
  try {
    const parsed = new URL(urlStr, baseOrigin);

    // Only follow same-origin links
    if (parsed.origin !== baseOrigin) {
      return null;
    }

    // Remove fragment
    parsed.hash = '';

    // Remove trailing slash (but keep root "/")
    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    parsed.pathname = pathname;

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Extract all href values from anchor tags in raw HTML.
 * Uses regex rather than a DOM parser to avoid external dependencies.
 */
function extractLinks(html: string): string[] {
  const links: string[] = [];
  // Match <a ...href="..."...> — handles single and double quotes
  const regex = /<a\s[^>]*?href\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1] ?? match[2];
    if (href) {
      links.push(href);
    }
  }
  return links;
}

/**
 * Check whether a URL should be crawled based on file extension.
 * We skip non-HTML resources like images, PDFs, stylesheets, scripts, etc.
 */
function isCrawlable(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const pathname = parsed.pathname.toLowerCase();
    const skipExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.avif', '.ico',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.zip', '.tar', '.gz', '.rar', '.7z',
      '.css', '.js', '.mjs', '.cjs', '.map',
      '.woff', '.woff2', '.ttf', '.eot', '.otf',
      '.mp3', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm',
      '.xml', '.json', '.txt', '.csv',
    ];
    return !skipExtensions.some((ext) => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

/**
 * Fetch a single page, following redirects manually to capture the redirect chain.
 * Uses native fetch (Node 18+).
 */
async function fetchPage(
  url: string,
  config: AuditConfig,
): Promise<PageData> {
  const redirectChain: string[] = [];
  let currentUrl = url;
  let finalStatusCode = 0;
  let html = '';
  const startTime = Date.now();

  const maxRedirects = 10;
  let redirectCount = 0;

  while (redirectCount < maxRedirects) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': config.userAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'identity',
        },
        redirect: 'manual',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      finalStatusCode = response.status;

      // Handle redirects (3xx)
      if (finalStatusCode >= 300 && finalStatusCode < 400) {
        const location = response.headers.get('location');
        if (location) {
          redirectChain.push(currentUrl);
          // Resolve relative redirect URLs
          try {
            currentUrl = new URL(location, currentUrl).toString();
          } catch {
            // If the redirect location is malformed, stop
            break;
          }
          redirectCount++;
          continue;
        }
      }

      // Read body for successful and client/server error responses
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html') || contentType.includes('application/xhtml')) {
        html = await response.text();
      } else {
        // Consume the body even if not HTML to avoid leaking
        await response.text();
        html = '';
      }

      break;
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (errorMessage.includes('abort') || errorMessage.includes('AbortError')) {
        return {
          url,
          statusCode: 0,
          html: '',
          redirectChain,
          responseTime,
        };
      }

      return {
        url,
        statusCode: 0,
        html: '',
        redirectChain,
        responseTime,
      };
    }
  }

  const responseTime = Date.now() - startTime;

  return {
    url,
    statusCode: finalStatusCode,
    html,
    redirectChain,
    responseTime,
  };
}

interface QueueItem {
  url: string;
  depth: number;
}

/**
 * Crawl a website starting from the given URL.
 *
 * - Discovers internal links from HTML
 * - Respects maxPages, maxDepth, concurrency
 * - Returns PageData[] for all crawled pages
 */
export async function crawlSite(config: AuditConfig): Promise<PageData[]> {
  const baseUrl = new URL(config.url);
  const baseOrigin = baseUrl.origin;

  const visited = new Set<string>();
  const results: PageData[] = [];

  // Normalize the start URL
  const startUrl = normalizeUrl(config.url, baseOrigin);
  if (!startUrl) {
    throw new Error(`Invalid start URL: ${config.url}`);
  }

  const queue: QueueItem[] = [{ url: startUrl, depth: 0 }];
  visited.add(startUrl);

  /**
   * Process a batch of URLs from the queue with the given concurrency.
   */
  async function processBatch(): Promise<void> {
    while (queue.length > 0 && results.length < config.maxPages) {
      // Take up to `concurrency` items from the queue
      const batch: QueueItem[] = [];
      while (batch.length < config.concurrency && queue.length > 0 && results.length + batch.length < config.maxPages) {
        batch.push(queue.shift()!);
      }

      if (batch.length === 0) break;

      // Fetch all pages in this batch concurrently
      const pagePromises = batch.map(async (item) => {
        const pageData = await fetchPage(item.url, config);
        return { pageData, depth: item.depth };
      });

      const batchResults = await Promise.all(pagePromises);

      for (const { pageData, depth } of batchResults) {
        if (results.length >= config.maxPages) break;

        results.push(pageData);

        // Only extract and enqueue links if we haven't exceeded maxDepth
        if (depth < config.maxDepth && pageData.html) {
          const links = extractLinks(pageData.html);

          for (const href of links) {
            // Skip javascript:, mailto:, tel:, data: links
            if (/^(javascript|mailto|tel|data):/i.test(href.trim())) {
              continue;
            }

            const normalized = normalizeUrl(href, baseOrigin);
            if (normalized && !visited.has(normalized) && isCrawlable(normalized)) {
              visited.add(normalized);
              queue.push({ url: normalized, depth: depth + 1 });
            }
          }
        }
      }
    }
  }

  await processBatch();

  return results;
}

/**
 * Fetch the robots.txt file for a given origin.
 */
export async function fetchRobotsTxt(
  origin: string,
  config: AuditConfig,
): Promise<{ exists: boolean; content?: string }> {
  const robotsUrl = `${origin}/robots.txt`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    const response = await fetch(robotsUrl, {
      method: 'GET',
      headers: {
        'User-Agent': config.userAgent,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const content = await response.text();
      return { exists: true, content };
    }

    return { exists: false };
  } catch {
    return { exists: false };
  }
}

/**
 * Fetch and parse a sitemap.xml (or the sitemap referenced in robots.txt).
 * Returns the list of URLs found in the sitemap.
 */
export async function fetchSitemap(
  origin: string,
  config: AuditConfig,
  robotsTxtContent?: string,
): Promise<{ exists: boolean; urls: string[]; content?: string }> {
  // First check if robots.txt specifies a sitemap location
  let sitemapUrl = `${origin}/sitemap.xml`;

  if (robotsTxtContent) {
    const sitemapMatch = robotsTxtContent.match(/^Sitemap:\s*(.+)$/im);
    if (sitemapMatch) {
      sitemapUrl = sitemapMatch[1].trim();
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    const response = await fetch(sitemapUrl, {
      method: 'GET',
      headers: {
        'User-Agent': config.userAgent,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { exists: false, urls: [] };
    }

    const content = await response.text();

    // Check if this is a sitemap index (contains <sitemapindex>)
    const isSitemapIndex = content.includes('<sitemapindex');
    const urls: string[] = [];

    if (isSitemapIndex) {
      // Extract sub-sitemap URLs from the index
      const locRegex = /<loc>\s*(.*?)\s*<\/loc>/gi;
      let locMatch: RegExpExecArray | null;
      const subSitemapUrls: string[] = [];

      while ((locMatch = locRegex.exec(content)) !== null) {
        subSitemapUrls.push(locMatch[1]);
      }

      // Fetch each sub-sitemap (up to 5 to avoid excessive requests)
      const toFetch = subSitemapUrls.slice(0, 5);
      for (const subUrl of toFetch) {
        try {
          const subController = new AbortController();
          const subTimeoutId = setTimeout(() => subController.abort(), config.timeout);

          const subResponse = await fetch(subUrl, {
            method: 'GET',
            headers: { 'User-Agent': config.userAgent },
            signal: subController.signal,
          });

          clearTimeout(subTimeoutId);

          if (subResponse.ok) {
            const subContent = await subResponse.text();
            const subLocRegex = /<loc>\s*(.*?)\s*<\/loc>/gi;
            let subLocMatch: RegExpExecArray | null;
            while ((subLocMatch = subLocRegex.exec(subContent)) !== null) {
              urls.push(subLocMatch[1]);
            }
          }
        } catch {
          // Skip this sub-sitemap on error
        }
      }
    } else {
      // Regular sitemap — extract all <loc> entries
      const locRegex = /<loc>\s*(.*?)\s*<\/loc>/gi;
      let locMatch: RegExpExecArray | null;
      while ((locMatch = locRegex.exec(content)) !== null) {
        urls.push(locMatch[1]);
      }
    }

    return { exists: true, urls, content };
  } catch {
    return { exists: false, urls: [] };
  }
}
