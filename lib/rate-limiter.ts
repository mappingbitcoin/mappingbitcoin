/**
 * In-memory rate limiter for abuse prevention
 * Tracks requests by IP and email to prevent spam
 */

interface RateLimitEntry {
    count: number;
    firstRequest: number;
    lastRequest: number;
}

interface RateLimiterConfig {
    windowMs: number;        // Time window in milliseconds
    maxRequests: number;     // Max requests per window
    blockDurationMs: number; // How long to block after exceeding limit
}

const DEFAULT_CONFIG: RateLimiterConfig = {
    windowMs: 60 * 60 * 1000,        // 1 hour
    maxRequests: 5,                   // 5 requests per hour
    blockDurationMs: 24 * 60 * 60 * 1000, // 24 hour block
};

class RateLimiter {
    private ipLimits: Map<string, RateLimitEntry> = new Map();
    private emailLimits: Map<string, RateLimitEntry> = new Map();
    private blockedIps: Map<string, number> = new Map(); // IP -> unblock timestamp
    private blockedEmails: Map<string, number> = new Map();
    private config: RateLimiterConfig;

    constructor(config: Partial<RateLimiterConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        // Clean up old entries every 10 minutes
        setInterval(() => this.cleanup(), 10 * 60 * 1000);
    }

    private cleanup(): void {
        const now = Date.now();
        const windowStart = now - this.config.windowMs;

        // Clean rate limit entries
        const ipKeys = Array.from(this.ipLimits.keys());
        ipKeys.forEach((key) => {
            const entry = this.ipLimits.get(key);
            if (entry && entry.lastRequest < windowStart) {
                this.ipLimits.delete(key);
            }
        });

        const emailKeys = Array.from(this.emailLimits.keys());
        emailKeys.forEach((key) => {
            const entry = this.emailLimits.get(key);
            if (entry && entry.lastRequest < windowStart) {
                this.emailLimits.delete(key);
            }
        });

        // Clean expired blocks
        const blockedIpKeys = Array.from(this.blockedIps.keys());
        blockedIpKeys.forEach((ip) => {
            const unblockTime = this.blockedIps.get(ip);
            if (unblockTime && now >= unblockTime) {
                this.blockedIps.delete(ip);
            }
        });

        const blockedEmailKeys = Array.from(this.blockedEmails.keys());
        blockedEmailKeys.forEach((email) => {
            const unblockTime = this.blockedEmails.get(email);
            if (unblockTime && now >= unblockTime) {
                this.blockedEmails.delete(email);
            }
        });
    }

    private checkAndUpdate(
        map: Map<string, RateLimitEntry>,
        blockedMap: Map<string, number>,
        key: string
    ): { allowed: boolean; remaining: number; resetIn: number } {
        const now = Date.now();
        const windowStart = now - this.config.windowMs;

        // Check if blocked
        const unblockTime = blockedMap.get(key);
        if (unblockTime && now < unblockTime) {
            return {
                allowed: false,
                remaining: 0,
                resetIn: unblockTime - now,
            };
        } else if (unblockTime) {
            blockedMap.delete(key);
        }

        const entry = map.get(key);

        if (!entry || entry.firstRequest < windowStart) {
            // New window
            map.set(key, {
                count: 1,
                firstRequest: now,
                lastRequest: now,
            });
            return {
                allowed: true,
                remaining: this.config.maxRequests - 1,
                resetIn: this.config.windowMs,
            };
        }

        // Within existing window
        entry.count++;
        entry.lastRequest = now;

        if (entry.count > this.config.maxRequests) {
            // Block this key
            blockedMap.set(key, now + this.config.blockDurationMs);
            return {
                allowed: false,
                remaining: 0,
                resetIn: this.config.blockDurationMs,
            };
        }

        return {
            allowed: true,
            remaining: this.config.maxRequests - entry.count,
            resetIn: entry.firstRequest + this.config.windowMs - now,
        };
    }

    checkIp(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
        return this.checkAndUpdate(this.ipLimits, this.blockedIps, ip);
    }

    checkEmail(email: string): { allowed: boolean; remaining: number; resetIn: number } {
        const normalizedEmail = email.toLowerCase().trim();
        return this.checkAndUpdate(this.emailLimits, this.blockedEmails, normalizedEmail);
    }

    check(ip: string, email: string): { allowed: boolean; reason?: string; resetIn: number } {
        const ipCheck = this.checkIp(ip);
        if (!ipCheck.allowed) {
            return {
                allowed: false,
                reason: "Too many requests from your IP address",
                resetIn: ipCheck.resetIn,
            };
        }

        const emailCheck = this.checkEmail(email);
        if (!emailCheck.allowed) {
            return {
                allowed: false,
                reason: "Too many requests with this email address",
                resetIn: emailCheck.resetIn,
            };
        }

        return { allowed: true, resetIn: Math.min(ipCheck.resetIn, emailCheck.resetIn) };
    }

    getStats(): { ipEntries: number; emailEntries: number; blockedIps: number; blockedEmails: number } {
        return {
            ipEntries: this.ipLimits.size,
            emailEntries: this.emailLimits.size,
            blockedIps: this.blockedIps.size,
            blockedEmails: this.blockedEmails.size,
        };
    }
}

// Singleton instance for contact form
export const contactFormLimiter = new RateLimiter({
    windowMs: 60 * 60 * 1000,        // 1 hour window
    maxRequests: 3,                   // 3 submissions per hour
    blockDurationMs: 24 * 60 * 60 * 1000, // 24 hour block for abuse
});

export default RateLimiter;
