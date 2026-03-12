"use client";

import dynamic from "next/dynamic";
import { Metadata } from "next";

interface MapClientProps {
    metadata: Metadata;
}

// Dynamic import with ssr: false to fix maplibre-gl minification issues in production
const BtcMap = dynamic(() => import("@/app/[locale]/map/BtcMap"), {
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
    return <BtcMap metadata={metadata} />;
}
