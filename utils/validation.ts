/**
 * Common validation utilities
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Sanitize string input by trimming and removing HTML tags
 */
export function sanitizeString(input: string, maxLength: number = 5000): string {
    return input
        .trim()
        .replace(/<[^>]*>/g, "")
        .substring(0, maxLength);
}
