"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const AHREFS_KEY = "VaxFMy0znBPSWmIVe+HxGw";

function hasAnalyticsConsent(): boolean {
    // Check Do Not Track browser setting
    if (navigator.doNotTrack === "1") return false;

    // Check if user has explicitly made a choice
    const consent = localStorage.getItem("cookieConsent");
    if (consent) {
        try {
            const parsed = JSON.parse(consent);
            // Only disable if user explicitly set analytics to false
            return parsed.analytics !== false;
        } catch {
            // If consent data is corrupted, allow analytics by default
            return true;
        }
    }

    // No consent stored yet - allow analytics by default
    // Analytics will only be disabled when user explicitly rejects cookies
    return true;
}

export default function ClientOnlyAnalytics() {
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
        if (!hasAnalyticsConsent() || !GA_TRACKING_ID) return;

        // Defer loading until after user interaction or idle time
        const events = ["scroll", "click", "touchstart", "keydown"];
        let loaded = false;

        const load = () => {
            if (loaded) return;
            loaded = true;
            events.forEach((e) => window.removeEventListener(e, load, { capture: true }));
            setShouldLoad(true);
        };

        // Load on first user interaction
        events.forEach((e) => window.addEventListener(e, load, { capture: true, passive: true }));

        // Fallback: load after 4s or when browser is idle
        const fallback = "requestIdleCallback" in window
            ? window.requestIdleCallback(() => load(), { timeout: 4000 })
            : setTimeout(load, 4000);

        return () => {
            events.forEach((e) => window.removeEventListener(e, load, { capture: true }));
            if ("requestIdleCallback" in window) {
                window.cancelIdleCallback(fallback as number);
            } else {
                clearTimeout(fallback as number);
            }
        };
    }, []);

    if (!shouldLoad) return null;

    return (
        <>
            {GA_TRACKING_ID && <GoogleAnalytics gaId={GA_TRACKING_ID} />}
            <Script
                src="https://analytics.ahrefs.com/analytics.js"
                data-key={AHREFS_KEY}
                strategy="lazyOnload"
            />
        </>
    );
}
