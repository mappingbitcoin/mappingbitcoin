/**
 * Utility functions for domain verification
 */

// Common email providers that should NOT be used for domain verification
const BLOCKED_EMAIL_DOMAINS = new Set([
    // Google
    'gmail.com', 'googlemail.com',
    // Microsoft
    'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.de', 'hotmail.es', 'hotmail.it',
    // Yahoo
    'yahoo.com', 'yahoo.co.uk', 'yahoo.fr', 'yahoo.de', 'yahoo.es', 'yahoo.it', 'yahoo.com.br', 'yahoo.co.jp', 'ymail.com', 'rocketmail.com',
    // Apple
    'icloud.com', 'me.com', 'mac.com',
    // AOL
    'aol.com', 'aim.com',
    // ProtonMail
    'protonmail.com', 'protonmail.ch', 'proton.me', 'pm.me',
    // Tutanota
    'tutanota.com', 'tutanota.de', 'tutamail.com', 'tuta.io',
    // Zoho
    'zoho.com', 'zohomail.com',
    // Mail.com
    'mail.com', 'email.com',
    // GMX
    'gmx.com', 'gmx.net', 'gmx.de', 'gmx.at', 'gmx.ch',
    // Yandex
    'yandex.com', 'yandex.ru', 'ya.ru',
    // Mail.ru
    'mail.ru', 'inbox.ru', 'list.ru', 'bk.ru',
    // Other common providers
    'fastmail.com', 'fastmail.fm', 'hushmail.com', 'runbox.com', 'mailbox.org',
    'posteo.de', 'posteo.net', 'disroot.org', 'riseup.net', 'autistici.org',
    // ISP emails
    'comcast.net', 'verizon.net', 'att.net', 'sbcglobal.net', 'bellsouth.net',
    'cox.net', 'charter.net', 'earthlink.net', 'juno.com', 'netzero.net',
    // Country-specific
    'web.de', 'freenet.de', 't-online.de', 'libero.it', 'virgilio.it',
    'laposte.net', 'orange.fr', 'free.fr', 'sfr.fr', 'wanadoo.fr',
    'terra.com.br', 'uol.com.br', 'bol.com.br',
    // Temp/disposable
    'tempmail.com', 'guerrillamail.com', 'mailinator.com', '10minutemail.com',
]);

/**
 * Extract domain from URL
 */
export function extractDomainFromUrl(website: string): string | null {
    try {
        let url = website.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        const parsed = new URL(url);
        return parsed.hostname.replace(/^www\./, '');
    } catch {
        return null;
    }
}

/**
 * Extract domain from email (excluding common providers)
 */
export function extractDomainFromEmail(email: string): string | null {
    try {
        const trimmed = email.trim().toLowerCase();
        const atIndex = trimmed.lastIndexOf('@');
        if (atIndex === -1 || atIndex === trimmed.length - 1) {
            return null;
        }
        const domain = trimmed.substring(atIndex + 1);

        // Don't allow common email providers
        if (BLOCKED_EMAIL_DOMAINS.has(domain)) {
            return null;
        }

        return domain;
    } catch {
        return null;
    }
}

/**
 * Check if an email domain is a blocked provider
 */
export function isBlockedEmailDomain(email: string): boolean {
    try {
        const trimmed = email.trim().toLowerCase();
        const atIndex = trimmed.lastIndexOf('@');
        if (atIndex === -1 || atIndex === trimmed.length - 1) {
            return true;
        }
        const domain = trimmed.substring(atIndex + 1);
        return BLOCKED_EMAIL_DOMAINS.has(domain);
    } catch {
        return true;
    }
}

export interface VerifiableDomain {
    domain: string;
    source: 'website' | 'email';
}

/**
 * Get all verifiable domains from venue tags
 */
export function getVerifiableDomains(tags: Record<string, string> | undefined): VerifiableDomain[] {
    if (!tags) return [];

    const domains: VerifiableDomain[] = [];
    const website = tags.website || tags['contact:website'];
    const email = tags.email || tags['contact:email'];

    if (website) {
        const websiteDomain = extractDomainFromUrl(website);
        if (websiteDomain) {
            domains.push({ domain: websiteDomain, source: 'website' });
        }
    }

    if (email) {
        const emailDomain = extractDomainFromEmail(email);
        if (emailDomain && !domains.some(d => d.domain === emailDomain)) {
            domains.push({ domain: emailDomain, source: 'email' });
        }
    }

    return domains;
}

/**
 * Check if a venue has any verifiable domains
 */
export function hasVerifiableDomain(tags: Record<string, string> | undefined): boolean {
    return getVerifiableDomains(tags).length > 0;
}

/**
 * Check if a venue can be verified (has email OR verifiable domain)
 */
export function canVerifyVenue(tags: Record<string, string> | undefined): boolean {
    if (!tags) return false;

    // Check for email (for email code verification)
    const email = tags.email || tags['contact:email'];
    if (email) return true;

    // Check for verifiable domains (website or custom email domain)
    return getVerifiableDomains(tags).length > 0;
}
