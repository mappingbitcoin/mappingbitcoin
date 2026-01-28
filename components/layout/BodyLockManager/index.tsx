"use client";

import { usePathname } from "@/i18n/navigation";
import { useEffect } from "react";

function lockBody() {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
}

function unlockBody() {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
}

/**
 * Central controller for body scroll lock.
 * Locks on /map, unlocks on all other pages.
 */
export default function BodyLockManager() {
    const pathname = usePathname();
    const isMapPage = pathname === "/map";

    useEffect(() => {
        if (isMapPage) {
            lockBody();
        } else {
            unlockBody();
        }

        // Always unlock on unmount as safety
        return () => {
            unlockBody();
        };
    }, [isMapPage]);

    return null;
}
