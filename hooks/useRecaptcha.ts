"use client";

import { useState, useEffect, useCallback } from "react";
import { publicEnv } from "@/lib/Environment";

interface UseRecaptchaOptions {
    /** reCAPTCHA action name for analytics */
    action: string;
}

interface UseRecaptchaReturn {
    /** Whether reCAPTCHA is ready to use */
    isReady: boolean;
    /** Get a reCAPTCHA token for form submission */
    getToken: () => Promise<string | null>;
    /** Whether reCAPTCHA is configured (site key exists) */
    isConfigured: boolean;
}

/**
 * Hook for using Google reCAPTCHA v3
 * Handles script loading and token generation
 */
export function useRecaptcha({ action }: UseRecaptchaOptions): UseRecaptchaReturn {
    const [isReady, setIsReady] = useState(false);
    const isConfigured = Boolean(publicEnv.recaptchaSiteKey);

    useEffect(() => {
        if (!isConfigured) {
            return;
        }

        // Check if already loaded
        if (window.grecaptcha) {
            setIsReady(true);
            return;
        }

        // Check if script is already in DOM
        if (document.querySelector(`script[src*="recaptcha"]`)) {
            // Wait for it to load
            const checkReady = setInterval(() => {
                if (window.grecaptcha) {
                    setIsReady(true);
                    clearInterval(checkReady);
                }
            }, 100);
            return () => clearInterval(checkReady);
        }

        // Load the script
        const script = document.createElement("script");
        script.src = `https://www.google.com/recaptcha/api.js?render=${publicEnv.recaptchaSiteKey}`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            // grecaptcha.ready may still need time
            const checkReady = setInterval(() => {
                if (window.grecaptcha) {
                    setIsReady(true);
                    clearInterval(checkReady);
                }
            }, 100);
        };
        document.head.appendChild(script);
    }, [isConfigured]);

    const getToken = useCallback(async (): Promise<string | null> => {
        if (!isConfigured || !isReady || !window.grecaptcha) {
            return null;
        }

        return new Promise((resolve) => {
            window.grecaptcha!.ready(async () => {
                try {
                    const token = await window.grecaptcha!.execute(
                        publicEnv.recaptchaSiteKey!,
                        { action }
                    );
                    resolve(token);
                } catch (error) {
                    console.error("reCAPTCHA error:", error);
                    resolve(null);
                }
            });
        });
    }, [action, isConfigured, isReady]);

    return { isReady, getToken, isConfigured };
}
