/**
 * Internal Link Checker for mappingbitcoin.com
 *
 * Crawls seed pages across all 3 locales, extracts internal links,
 * and validates each unique link returns HTTP 200.
 *
 * Usage: npx tsx scripts/check-internal-links.ts
 */

const BASE_URL = "https://mappingbitcoin.com";

const SEED_PATHS: string[] = [
  // English
  "/",
  "/bitcoin-shops-in-australia",
  "/categories/cafes",
  // Spanish
  "/es/",
  "/es/lugares-bitcoin-en-australia",
  "/es/categories/cafeterias",
  // Portuguese
  "/pt/",
  "/pt/locais-bitcoin-em-australia",
  "/pt/categories/cafeterias",
];

const MAX_CONCURRENCY = 5;
const DELAY_MS = 200;

// ── Helpers ──────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run an array of async tasks with a concurrency limit and a small
 * delay between each task launch.
 */
async function pooled<T>(
  items: T[],
  concurrency: number,
  delayMs: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let index = 0;

  async function worker(): Promise<void> {
    while (true) {
      const i = index++;
      if (i >= items.length) return;
      if (i > 0) await sleep(delayMs);
      await fn(items[i]);
    }
  }

  const workers: Promise<void>[] = [];
  for (let w = 0; w < Math.min(concurrency, items.length); w++) {
    workers.push(worker());
  }
  await Promise.all(workers);
}

/**
 * Fetch page HTML and extract all internal hrefs.
 */
async function extractLinks(pageUrl: string): Promise<string[]> {
  const res = await fetch(pageUrl, {
    headers: { "User-Agent": "MappingBitcoin-LinkChecker/1.0" },
    redirect: "follow",
  });

  if (!res.ok) {
    console.error(`  [WARN] Could not fetch seed page ${pageUrl} — status ${res.status}`);
    return [];
  }

  const html = await res.text();

  // Match href="..." attributes. Handles both single and double quotes.
  const hrefRegex = /href=["']([^"']+)["']/g;
  const links: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1];

    // Internal link: starts with /
    if (href.startsWith("/")) {
      // Skip anchors-only, mailto, tel, javascript
      if (href === "#" || href.startsWith("/#")) continue;
      links.push(href);
      continue;
    }

    // Internal link: full URL
    if (href.startsWith(BASE_URL)) {
      // Convert to path
      try {
        const url = new URL(href);
        links.push(url.pathname + url.search + url.hash);
      } catch {
        // Malformed URL, skip
      }
    }
  }

  return links;
}

/**
 * Check a single URL with a HEAD request. Falls back to GET if HEAD
 * returns 405.
 */
async function checkUrl(
  url: string,
): Promise<{ url: string; status: number; ok: boolean; redirectedTo?: string }> {
  try {
    let res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": "MappingBitcoin-LinkChecker/1.0" },
      redirect: "follow",
    });

    // Some servers reject HEAD — fall back to GET
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": "MappingBitcoin-LinkChecker/1.0" },
        redirect: "follow",
      });
      // Consume the body so the connection is released
      await res.text();
    }

    return {
      url,
      status: res.status,
      ok: res.ok, // 200-299
      redirectedTo: res.redirected ? res.url : undefined,
    };
  } catch (err: any) {
    return {
      url,
      status: 0,
      ok: false,
    };
  }
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log("=== MappingBitcoin Internal Link Checker ===\n");

  // Map: unique path -> set of seed pages where it was found
  const linkSources = new Map<string, Set<string>>();

  // Step 1: Crawl seed pages and collect links
  console.log("Step 1: Crawling seed pages...\n");

  for (const path of SEED_PATHS) {
    const pageUrl = BASE_URL + path;
    process.stdout.write(`  Crawling ${pageUrl} ... `);

    const links = await extractLinks(pageUrl);
    console.log(`found ${links.length} internal links`);

    for (const link of links) {
      // Normalize: strip trailing hash fragments for dedup, keep query params
      const normalized = link.replace(/#.*$/, "") || "/";
      if (!linkSources.has(normalized)) {
        linkSources.set(normalized, new Set());
      }
      linkSources.get(normalized)!.add(path);
    }

    // Small delay between seed page fetches
    await sleep(300);
  }

  const uniquePaths = Array.from(linkSources.keys()).sort();

  console.log(`\nFound ${uniquePaths.length} unique internal link paths.\n`);

  // Step 2: Check each unique link
  console.log("Step 2: Checking links (max concurrency: " + MAX_CONCURRENCY + ")...\n");

  interface LinkResult {
    path: string;
    status: number;
    ok: boolean;
    redirectedTo?: string;
    sources: string[];
  }

  const results: LinkResult[] = [];
  let checked = 0;

  await pooled(uniquePaths, MAX_CONCURRENCY, DELAY_MS, async (path) => {
    const fullUrl = BASE_URL + path;
    const result = await checkUrl(fullUrl);
    checked++;

    const sources = Array.from(linkSources.get(path)!);
    results.push({
      path,
      status: result.status,
      ok: result.ok,
      redirectedTo: result.redirectedTo,
      sources,
    });

    // Progress indicator every 25 links
    if (checked % 25 === 0 || checked === uniquePaths.length) {
      process.stdout.write(`  Checked ${checked}/${uniquePaths.length}\r`);
    }
  });

  console.log(`  Checked ${checked}/${uniquePaths.length}\n`);

  // Step 3: Report
  console.log("=== RESULTS ===\n");

  const broken = results.filter((r) => !r.ok);
  const redirected = results.filter((r) => r.ok && r.redirectedTo);
  const successful = results.filter((r) => r.ok && !r.redirectedTo);

  console.log(`  Total unique links checked: ${results.length}`);
  console.log(`  Successful (200):           ${successful.length}`);
  console.log(`  Redirected (followed):       ${redirected.length}`);
  console.log(`  Broken / errors:             ${broken.length}`);
  console.log();

  if (redirected.length > 0) {
    console.log("--- Redirected Links ---\n");
    for (const r of redirected.sort((a, b) => a.path.localeCompare(b.path))) {
      console.log(`  ${r.path}`);
      console.log(`    -> ${r.redirectedTo}`);
      console.log(`    Found on: ${r.sources.join(", ")}`);
      console.log();
    }
  }

  if (broken.length > 0) {
    console.log("--- Broken Links ---\n");
    for (const b of broken.sort((a, b) => a.path.localeCompare(b.path))) {
      console.log(`  ${b.path}`);
      console.log(`    Status: ${b.status === 0 ? "NETWORK ERROR" : b.status}`);
      console.log(`    Found on: ${b.sources.join(", ")}`);
      console.log();
    }
  }

  // Summary
  console.log("=== SUMMARY ===\n");

  if (broken.length === 0) {
    console.log("  All internal links are valid!\n");
  } else {
    console.log(`  ${broken.length} broken link(s) found. See details above.\n`);
  }

  // Exit with error code if there are broken links
  process.exit(broken.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(2);
});
