import { Issue, Severity, SiteAudit } from '../types';

// ─── ANSI color helpers (no external dependencies) ───────────────────────────

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const UNDERLINE = '\x1b[4m';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const MAGENTA = '\x1b[35m';
const CYAN = '\x1b[36m';
const WHITE = '\x1b[37m';
const GRAY = '\x1b[90m';

const BG_RED = '\x1b[41m';
const BG_GREEN = '\x1b[42m';
const BG_YELLOW = '\x1b[43m';
const BG_BLUE = '\x1b[44m';

function colorize(text: string, ...codes: string[]): string {
  return `${codes.join('')}${text}${RESET}`;
}

function severityColor(severity: Severity): string {
  switch (severity) {
    case 'error':
      return RED;
    case 'warning':
      return YELLOW;
    case 'notice':
      return BLUE;
    case 'pass':
      return GREEN;
  }
}

function severityBg(severity: Severity): string {
  switch (severity) {
    case 'error':
      return BG_RED;
    case 'warning':
      return BG_YELLOW;
    case 'notice':
      return BG_BLUE;
    case 'pass':
      return BG_GREEN;
  }
}

function severityIcon(severity: Severity): string {
  switch (severity) {
    case 'error':
      return 'X';
    case 'warning':
      return '!';
    case 'notice':
      return 'i';
    case 'pass':
      return '*';
  }
}

function healthScoreColor(score: number): string {
  if (score > 80) return GREEN;
  if (score > 60) return YELLOW;
  return RED;
}

function padRight(str: string, len: number): string {
  return str.length >= len ? str : str + ' '.repeat(len - str.length);
}

function padLeft(str: string, len: number): string {
  return str.length >= len ? str : ' '.repeat(len - str.length) + str;
}

// ─── Horizontal line ─────────────────────────────────────────────────────────

function hr(char = '-', len = 72): string {
  return colorize(char.repeat(len), DIM);
}

// ─── Reporter ────────────────────────────────────────────────────────────────

export function printReport(audit: SiteAudit): void {
  const lines: string[] = [];
  const w = (line = '') => lines.push(line);

  // ── Header ──
  w();
  w(hr('='));
  w(colorize('  SEO AUDIT REPORT', BOLD, WHITE));
  w(hr('='));
  w();
  w(`  ${colorize('Site:', BOLD)} ${colorize(audit.url, CYAN, UNDERLINE)}`);
  w(`  ${colorize('Date:', BOLD)} ${audit.timestamp}`);
  w(`  ${colorize('Pages Crawled:', BOLD)} ${audit.summary.totalPages}`);
  w();

  // ── Health Score ──
  const score = audit.summary.healthScore;
  const scoreStr = `${score}%`;
  const scoreBarFilled = Math.round(score / 2);
  const scoreBarEmpty = 50 - scoreBarFilled;
  const scoreColor = healthScoreColor(score);

  w(`  ${colorize('Health Score:', BOLD)} ${colorize(scoreStr, BOLD, scoreColor)}`);
  w(`  ${colorize('[', DIM)}${colorize('#'.repeat(scoreBarFilled), scoreColor)}${colorize('.'.repeat(scoreBarEmpty), DIM)}${colorize(']', DIM)}`);
  w();

  // ── Summary Stats ──
  w(hr());
  w(colorize('  SUMMARY', BOLD, WHITE));
  w(hr());
  w();

  const summaryItems = [
    { label: 'Errors', count: audit.summary.errors, color: RED },
    { label: 'Warnings', count: audit.summary.warnings, color: YELLOW },
    { label: 'Notices', count: audit.summary.notices, color: BLUE },
    { label: 'Passes', count: audit.summary.passes, color: GREEN },
  ];

  for (const item of summaryItems) {
    const countStr = padLeft(String(item.count), 5);
    w(`  ${colorize(countStr, BOLD, item.color)}  ${item.label}`);
  }

  w(`  ${colorize(padLeft(String(audit.summary.totalIssues), 5), BOLD, WHITE)}  Total Issues`);
  w();

  // ── robots.txt ──
  w(hr());
  w(colorize('  ROBOTS.TXT', BOLD, WHITE));
  w(hr());
  w();

  if (audit.robotsTxt.exists) {
    w(`  ${colorize('*', GREEN)} robots.txt found`);
  } else {
    w(`  ${colorize('X', RED)} robots.txt not found`);
  }

  for (const issue of audit.robotsTxt.issues) {
    w(`  ${colorize(severityIcon(issue.severity), severityColor(issue.severity))} ${issue.message}`);
  }
  w();

  // ── Sitemap ──
  w(hr());
  w(colorize('  SITEMAP', BOLD, WHITE));
  w(hr());
  w();

  if (audit.sitemap.exists) {
    w(`  ${colorize('*', GREEN)} Sitemap found (${audit.sitemap.urls.length} URLs)`);
  } else {
    w(`  ${colorize('X', RED)} Sitemap not found`);
  }

  for (const issue of audit.sitemap.issues) {
    w(`  ${colorize(severityIcon(issue.severity), severityColor(issue.severity))} ${issue.message}`);
  }
  w();

  // ── Site-Wide Issues ──
  if (audit.siteWideIssues.length > 0) {
    w(hr());
    w(colorize('  SITE-WIDE ISSUES', BOLD, WHITE));
    w(hr());
    w();

    for (const issue of audit.siteWideIssues) {
      const icon = severityIcon(issue.severity);
      const color = severityColor(issue.severity);
      w(`  ${colorize(icon, BOLD, color)} ${colorize(`[${issue.severity.toUpperCase()}]`, color)} ${issue.message}`);
      if (issue.details) {
        w(`    ${colorize(issue.details, DIM)}`);
      }
    }
    w();
  }

  // ── Per-Page Issues ──
  w(hr());
  w(colorize('  PER-PAGE ISSUES', BOLD, WHITE));
  w(hr());

  for (const page of audit.pages) {
    const pageIssues = page.issues.filter((i) => i.severity !== 'pass');
    if (pageIssues.length === 0) continue;

    w();
    w(`  ${colorize(page.url, CYAN, UNDERLINE)}`);
    w(`  ${colorize(`Status: ${page.statusCode}`, DIM)}  ${colorize(`Time: ${page.responseTime}ms`, DIM)}`);

    // Group by severity, ordered: error > warning > notice
    const severityOrder: Severity[] = ['error', 'warning', 'notice'];

    for (const sev of severityOrder) {
      const sevIssues = pageIssues.filter((i) => i.severity === sev);
      if (sevIssues.length === 0) continue;

      for (const issue of sevIssues) {
        const icon = severityIcon(issue.severity);
        const color = severityColor(issue.severity);
        const tag = padRight(`[${issue.severity.toUpperCase()}]`, 10);
        w(`    ${colorize(icon, BOLD, color)} ${colorize(tag, color)} ${issue.message}`);
        if (issue.details) {
          w(`      ${colorize(issue.details, DIM)}`);
        }
      }
    }
  }

  // Check if any pages had zero non-pass issues
  const cleanPages = audit.pages.filter((p) => p.issues.filter((i) => i.severity !== 'pass').length === 0);
  if (cleanPages.length > 0) {
    w();
    w(`  ${colorize('*', GREEN)} ${cleanPages.length} page(s) with no issues`);
  }
  w();

  // ── Top Issues ──
  w(hr());
  w(colorize('  TOP ISSUES (most common)', BOLD, WHITE));
  w(hr());
  w();

  const issueCounts = new Map<string, { count: number; severity: Severity; message: string }>();

  for (const page of audit.pages) {
    for (const issue of page.issues) {
      if (issue.severity === 'pass') continue;
      const key = `${issue.check}::${issue.severity}`;
      const existing = issueCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        issueCounts.set(key, { count: 1, severity: issue.severity, message: issue.message });
      }
    }
  }

  // Also count site-wide issues
  for (const issue of audit.siteWideIssues) {
    if (issue.severity === 'pass') continue;
    const key = `site::${issue.check}::${issue.severity}`;
    const existing = issueCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      issueCounts.set(key, { count: 1, severity: issue.severity, message: issue.message });
    }
  }

  const sortedIssues = Array.from(issueCounts.entries())
    .sort((a, b) => {
      // Sort by severity weight first (errors first), then by count descending
      const severityWeight: Record<Severity, number> = { error: 0, warning: 1, notice: 2, pass: 3 };
      const sevDiff = severityWeight[a[1].severity] - severityWeight[b[1].severity];
      if (sevDiff !== 0) return sevDiff;
      return b[1].count - a[1].count;
    })
    .slice(0, 15);

  if (sortedIssues.length === 0) {
    w(`  ${colorize('No issues found — excellent!', GREEN, BOLD)}`);
  } else {
    for (const [, data] of sortedIssues) {
      const icon = severityIcon(data.severity);
      const color = severityColor(data.severity);
      const countStr = padLeft(String(data.count), 4);
      w(`  ${colorize(countStr, BOLD)} x ${colorize(icon, BOLD, color)} ${colorize(`[${data.severity.toUpperCase()}]`, color)} ${data.message}`);
    }
  }

  w();
  w(hr('='));
  w(colorize('  End of Report', DIM));
  w(hr('='));
  w();

  // Print all lines to stdout
  console.log(lines.join('\n'));
}

// ─── JSON export ─────────────────────────────────────────────────────────────

export function toJSON(audit: SiteAudit): string {
  return JSON.stringify(audit, null, 2);
}

// ─── CSV export ──────────────────────────────────────────────────────────────

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCSV(audit: SiteAudit): string {
  const rows: string[] = [];

  // Header row
  rows.push('URL,Check,Severity,Message,Details');

  // Site-wide issues (URL = site root)
  for (const issue of audit.siteWideIssues) {
    rows.push([
      escapeCSV(audit.url),
      escapeCSV(issue.check),
      escapeCSV(issue.severity),
      escapeCSV(issue.message),
      escapeCSV(issue.details || ''),
    ].join(','));
  }

  // robots.txt issues
  for (const issue of audit.robotsTxt.issues) {
    rows.push([
      escapeCSV(`${audit.url}/robots.txt`),
      escapeCSV(issue.check),
      escapeCSV(issue.severity),
      escapeCSV(issue.message),
      escapeCSV(issue.details || ''),
    ].join(','));
  }

  // Sitemap issues
  for (const issue of audit.sitemap.issues) {
    rows.push([
      escapeCSV(`${audit.url}/sitemap.xml`),
      escapeCSV(issue.check),
      escapeCSV(issue.severity),
      escapeCSV(issue.message),
      escapeCSV(issue.details || ''),
    ].join(','));
  }

  // Per-page issues
  for (const page of audit.pages) {
    for (const issue of page.issues) {
      rows.push([
        escapeCSV(page.url),
        escapeCSV(issue.check),
        escapeCSV(issue.severity),
        escapeCSV(issue.message),
        escapeCSV(issue.details || ''),
      ].join(','));
    }
  }

  return rows.join('\n');
}
