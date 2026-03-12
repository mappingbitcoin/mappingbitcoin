/**
 * Shared reCAPTCHA verification utility
 */

import { serverEnv } from "@/lib/Environment";

const RECAPTCHA_THRESHOLD = 0.5;

export interface RecaptchaResult {
    success: boolean;
    score?: number;
    error?: string;
}

/**
 * Verify a reCAPTCHA token with Google's API
 *
 * If RECAPTCHA_SECRET_KEY is not configured:
 * - In development: returns success (skips verification)
 * - In production: returns an error
 *
 * @param token - The reCAPTCHA token from the client
 * @param options.skipIfUnconfigured - If true, return success when secret key is missing (default: false)
 * @returns RecaptchaResult with success status, optional score, and optional error
 */
export async function verifyRecaptcha(
    token: string,
    options: { skipIfUnconfigured?: boolean } = {}
): Promise<RecaptchaResult> {
    const recaptchaSecretKey = serverEnv.recaptchaSecretKey;

    if (!recaptchaSecretKey) {
        if (options.skipIfUnconfigured || process.env.NODE_ENV === "development") {
            console.warn("RECAPTCHA_SECRET_KEY not configured, skipping verification");
            return { success: true };
        }
        return { success: false, error: "Server configuration error" };
    }

    try {
        const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                secret: recaptchaSecretKey,
                response: token,
            }),
        });

        const data = await response.json();

        if (!data.success) {
            return { success: false, error: "reCAPTCHA verification failed" };
        }

        if (data.score < RECAPTCHA_THRESHOLD) {
            return { success: false, score: data.score, error: "Request flagged as suspicious" };
        }

        return { success: true, score: data.score };
    } catch (error) {
        console.error("reCAPTCHA verification error:", error);
        return { success: false, error: "Failed to verify reCAPTCHA" };
    }
}
