/**
 * Simple in-memory rate limiter for API routes
 * For production at scale, consider using Redis
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
        if (entry.resetAt < now) {
            rateLimitStore.delete(key);
        }
    }
}, 60000); // Clean up every minute

export interface RateLimitConfig {
    /** Maximum number of requests allowed in the window */
    maxRequests: number;
    /** Window size in milliseconds */
    windowMs: number;
}

export interface RateLimitResult {
    /** Whether the request is allowed */
    allowed: boolean;
    /** Number of remaining requests in the window */
    remaining: number;
    /** When the rate limit resets (Unix timestamp in ms) */
    resetAt: number;
    /** Total limit for this window */
    limit: number;
}

/**
 * Check rate limit for a given identifier (e.g., IP address)
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now();
    const key = identifier;

    let entry = rateLimitStore.get(key);

    // If no entry or window has expired, create new entry
    if (!entry || entry.resetAt < now) {
        entry = {
            count: 0,
            resetAt: now + config.windowMs,
        };
        rateLimitStore.set(key, entry);
    }

    // Increment count
    entry.count++;

    const allowed = entry.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - entry.count);

    return {
        allowed,
        remaining,
        resetAt: entry.resetAt,
        limit: config.maxRequests,
    };
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
    // Check various headers for the real IP
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return forwardedFor.split(",")[0].trim();
    }

    const realIP = request.headers.get("x-real-ip");
    if (realIP) {
        return realIP;
    }

    // Fallback - in production behind a proxy, this should not be reached
    return "unknown";
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
    /** Strict limit for auth endpoints: 10 requests per minute */
    auth: { maxRequests: 10, windowMs: 60000 },

    /** Standard API limit: 60 requests per minute */
    api: { maxRequests: 60, windowMs: 60000 },

    /** Relaxed limit for read endpoints: 120 requests per minute */
    read: { maxRequests: 120, windowMs: 60000 },

    /** Very strict limit for sensitive operations: 5 requests per minute */
    sensitive: { maxRequests: 5, windowMs: 60000 },
};
