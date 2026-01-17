"use client";

import { useEffect, useState } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

function hasAnalyticsConsent(): boolean {
    // Check Do Not Track
    if (navigator.doNotTrack === "1") return false;

    // Check new consent system
    const consent = localStorage.getItem("cookieConsent");
    if (consent) {
        try {
            const parsed = JSON.parse(consent);
            return parsed.analytics === true;
        } catch {
            return false;
        }
    }

    // Fallback to legacy gaDisabled flag
    return localStorage.getItem("gaDisabled") !== "true";
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

    if (!shouldLoad || !GA_TRACKING_ID) return null;

    return <GoogleAnalytics gaId={GA_TRACKING_ID} />;
}
