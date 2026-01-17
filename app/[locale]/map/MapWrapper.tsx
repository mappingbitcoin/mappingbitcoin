"use client";

import dynamic from "next/dynamic";
import type { Metadata } from "next";

// Dynamic import with ssr: false to fix maplibre-gl minification issues in production
const BtcMap = dynamic(() => import("@/app/[locale]/map/BtcMap"), {
    ssr: false,
    loading: () => (
        <div className="h-[calc(100vh-4rem)] mt-16 bg-white flex items-center justify-center">
            <div className="text-text-light">Loading map...</div>
        </div>
    ),
});

export default function MapWrapper({ metadata }: { metadata: Metadata }) {
    return <BtcMap metadata={metadata} />;
}
