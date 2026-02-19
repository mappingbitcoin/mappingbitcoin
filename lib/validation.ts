/**
 * Shared validation utilities for API endpoints
 */

/**
 * Validate email address with security-conscious checks
 * - Max length limit to prevent abuse
 * - Basic format validation (intentionally simple to avoid ReDoS)
 * - Checks for common injection patterns
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
    // Check for null/undefined
    if (!email || typeof email !== "string") {
        return { valid: false, error: "Email is required" };
    }

    // Trim whitespace
    const trimmed = email.trim();

    // Length limits (RFC 5321)
    if (trimmed.length > 254) {
        return { valid: false, error: "Email address too long" };
    }

    // Check for control characters and null bytes
    if (/[\x00-\x1f\x7f]/.test(trimmed)) {
        return { valid: false, error: "Email contains invalid characters" };
    }

    // Check for common injection patterns
    if (/[<>"\n\r]/.test(trimmed)) {
        return { valid: false, error: "Email contains invalid characters" };
    }

    // Basic format validation (intentionally simple to avoid ReDoS)
    // This checks: local-part @ domain . tld
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
        return { valid: false, error: "Invalid email format" };
    }

    // Check local part length (max 64 chars per RFC 5321)
    const [localPart] = trimmed.split("@");
    if (localPart && localPart.length > 64) {
        return { valid: false, error: "Email local part too long" };
    }

    return { valid: true };
}

/**
 * Sanitize a string by removing HTML tags and limiting length
 */
export function sanitizeString(input: string, maxLength = 5000): string {
    if (!input || typeof input !== "string") {
        return "";
    }

    return input
        .trim()
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "") // Remove control chars (keep newlines, tabs)
        .substring(0, maxLength);
}

/**
 * Validate that a string meets length requirements
 */
export function validateLength(
    value: string,
    minLength: number,
    maxLength: number,
    fieldName = "Field"
): { valid: boolean; error?: string } {
    if (!value || typeof value !== "string") {
        return { valid: false, error: `${fieldName} is required` };
    }

    const trimmed = value.trim();

    if (trimmed.length < minLength) {
        return { valid: false, error: `${fieldName} is too short` };
    }

    if (trimmed.length > maxLength) {
        return { valid: false, error: `${fieldName} is too long` };
    }

    return { valid: true };
}

/**
 * Check if request body size exceeds the limit
 * @param request - The incoming request
 * @param maxSizeBytes - Maximum allowed body size in bytes (default 100KB)
 * @returns Object with allowed boolean and error message if exceeded
 */
export function checkBodySize(
    request: Request,
    maxSizeBytes = 100 * 1024
): { allowed: boolean; error?: string } {
    const contentLength = request.headers.get("content-length");

    if (contentLength) {
        const size = parseInt(contentLength, 10);
        if (!isNaN(size) && size > maxSizeBytes) {
            return {
                allowed: false,
                error: `Request body too large (max ${Math.round(maxSizeBytes / 1024)}KB)`,
            };
        }
    }

    return { allowed: true };
}
