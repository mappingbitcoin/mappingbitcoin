import { notFound } from "next/navigation";
import type { Metadata } from "next";

import {env} from "@/lib/Environment";
import PlaceEditForm from "./PlaceEditForm";
import {Localized} from "@/i18n/types";
import {EnrichedVenue} from "@/models/Overpass";
import {parseTags} from "@/utils/OsmHelpers";

async function getVenueBySlug(slug: string): Promise<EnrichedVenue | null> {
    const base = env.siteUrl || "http://localhost:3000";
    const url = `${base}/api/places/${slug}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
}

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps & Localized): Promise<Metadata> {
    const { slug } = await params;
    const venue = await getVenueBySlug(slug);
    if (!venue) return { title: "Place Not Found" };

    const { name } = parseTags(venue.tags);

    return {
        title: `Edit ${name} | MappingBitcoin`,
        description: `Suggest edits for ${name} on MappingBitcoin.com`,
    };
}

export default async function PlaceEditPage({ params }: PageProps & Localized) {
    const { slug } = await params;

    const venue = await getVenueBySlug(slug);

    if (!venue) return notFound();

    return <PlaceEditForm venue={venue} />;
}
