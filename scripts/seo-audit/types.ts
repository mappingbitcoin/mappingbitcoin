export type Severity = 'error' | 'warning' | 'notice' | 'pass';

export interface Issue {
  check: string;
  severity: Severity;
  message: string;
  url?: string;
  details?: string;
}

export interface PageData {
  url: string;
  statusCode: number;
  html: string;
  redirectChain: string[];
  responseTime: number;
}

export interface PageAudit {
  url: string;
  statusCode: number;
  responseTime: number;
  issues: Issue[];
  meta: {
    title?: string;
    titleLength: number;
    description?: string;
    descriptionLength: number;
    canonical?: string;
    robots?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    ogUrl?: string;
    ogType?: string;
    twitterCard?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    h1s: string[];
    h2s: string[];
    headingOrder: string[];
    hreflangTags: { lang: string; href: string }[];
    jsonLd: object[];
    wordCount: number;
    imageCount: number;
    imagesWithoutAlt: string[];
    internalLinks: { href: string; text: string }[];
    externalLinks: { href: string; text: string }[];
  };
}

export interface SiteAudit {
  url: string;
  timestamp: string;
  pages: PageAudit[];
  siteWideIssues: Issue[];
  robotsTxt: { exists: boolean; content?: string; issues: Issue[] };
  sitemap: { exists: boolean; urls: string[]; issues: Issue[] };
  summary: {
    totalPages: number;
    totalIssues: number;
    errors: number;
    warnings: number;
    notices: number;
    passes: number;
    healthScore: number;
  };
}

export interface AuditConfig {
  url: string;
  maxPages: number;
  maxDepth: number;
  checkExternalLinks: boolean;
  timeout: number;
  concurrency: number;
  userAgent: string;
}

export const DEFAULT_CONFIG: Omit<AuditConfig, 'url'> = {
  maxPages: 50,
  maxDepth: 3,
  checkExternalLinks: false,
  timeout: 15000,
  concurrency: 5,
  userAgent: 'MappingBitcoin-SEO-Audit/1.0',
};
