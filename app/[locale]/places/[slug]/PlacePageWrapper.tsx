"use client";

import dynamic from "next/dynamic";
import { EnrichedVenue } from "@/models/Overpass";

// Dynamic import with ssr: false to fix maplibre-gl minification issues in production
const PlacePage = dynamic(() => import("./PlacePage"), {
    ssr: false,
    loading: () => (
        <div className="pt-16 bg-white flex items-center justify-center min-h-[400px]">
            <div className="text-text-light">Loading place...</div>
        </div>
    ),
});

export default function PlacePageWrapper({ venue, isPreview }: { venue: EnrichedVenue; isPreview: boolean }) {
    return <PlacePage venue={venue} isPreview={isPreview} />;
}
