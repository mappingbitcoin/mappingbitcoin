"use client";

import dynamic from "next/dynamic";
import { Metadata } from "next";

interface MapClientProps {
    metadata: Metadata;
}

// Lazy load MapWrapper - maps require browser APIs and are heavy
const MapWrapper = dynamic(() => import("./MapWrapper"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-screen bg-primary flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto mb-4"></div>
                <p className="text-text-light">Loading map...</p>
            </div>
        </div>
    ),
});

export default function MapClient({ metadata }: MapClientProps) {
    return <MapWrapper metadata={metadata} />;
}
