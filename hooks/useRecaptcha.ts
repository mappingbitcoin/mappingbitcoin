"use client";

import { useState, useCallback, useRef } from "react";
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
    /** Preload reCAPTCHA script (call on user interaction like focus) */
    preload: () => void;
}

/**
 * Load the reCAPTCHA script dynamically
 * Returns a promise that resolves when grecaptcha is ready
 */
function loadRecaptchaScript(): Promise<void> {
    return new Promise((resolve) => {
        // Already loaded
        if (window.grecaptcha) {
            resolve();
            return;
        }

        // Script already in DOM, wait for it
        if (document.querySelector(`script[src*="recaptcha"]`)) {
            const checkReady = setInterval(() => {
                if (window.grecaptcha) {
                    clearInterval(checkReady);
                    resolve();
                }
            }, 100);
            return;
        }

        // Load the script
        const script = document.createElement("script");
        script.src = `https://www.google.com/recaptcha/api.js?render=${publicEnv.recaptchaSiteKey}`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            const checkReady = setInterval(() => {
                if (window.grecaptcha) {
                    clearInterval(checkReady);
                    resolve();
                }
            }, 100);
        };
        document.head.appendChild(script);
    });
}

// Shared loading promise to prevent multiple loads
let loadingPromise: Promise<void> | null = null;

/**
 * Hook for using Google reCAPTCHA v3
 * Script is loaded lazily - only when preload() is called or getToken() is requested
 */
export function useRecaptcha({ action }: UseRecaptchaOptions): UseRecaptchaReturn {
    const [isReady, setIsReady] = useState(() => Boolean(window.grecaptcha));
    const isConfigured = Boolean(publicEnv.recaptchaSiteKey);
    const loadingRef = useRef(false);

    const ensureLoaded = useCallback(async (): Promise<boolean> => {
        if (!isConfigured) return false;
        if (window.grecaptcha) {
            setIsReady(true);
            return true;
        }

        if (loadingRef.current) {
            // Already loading, wait for it
            await loadingPromise;
            setIsReady(true);
            return true;
        }

        loadingRef.current = true;
        loadingPromise = loadRecaptchaScript();
        await loadingPromise;
        setIsReady(true);
        return true;
    }, [isConfigured]);

    const preload = useCallback(() => {
        if (isConfigured && !window.grecaptcha && !loadingRef.current) {
            ensureLoaded();
        }
    }, [isConfigured, ensureLoaded]);

    const getToken = useCallback(async (): Promise<string | null> => {
        if (!isConfigured) return null;

        // Ensure script is loaded
        const loaded = await ensureLoaded();
        if (!loaded || !window.grecaptcha) return null;

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
    }, [action, isConfigured, ensureLoaded]);

    return { isReady, getToken, isConfigured, preload };
}
