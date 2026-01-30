"use client";

import dynamic from "next/dynamic";
import { EnrichedVenue } from "@/models/Overpass";
import { PlaceSubcategory } from "@/constants/PlaceCategories";
import { CategoryAndSubcategory } from "@/constants/PlaceOsmDictionary";

// Dynamic import with ssr: false to fix maplibre-gl minification issues in production
const PlacesDirectory = dynamic(() => import("@/app/[locale]/[slug]/PlacesDirectory"), {
    ssr: false,
    loading: () => (
        <div className="pt-16 bg-white flex items-center justify-center min-h-[400px]">
            <div className="text-text-light">Loading map...</div>
        </div>
    ),
});

export type CityWithCount = {
    name: string;
    count: number;
};

type PlacesDirectoryWrapperProps = {
    places: EnrichedVenue[];
    exactMatch: boolean;
    city?: string;
    country: string;
    availableCities?: CityWithCount[];
    availableSubcategories?: PlaceSubcategory[];
    categoryAndSubcategory?: CategoryAndSubcategory;
};

export default function PlacesDirectoryWrapper(props: PlacesDirectoryWrapperProps) {
    return <PlacesDirectory {...props} />;
}
