import { notFound } from "next/navigation";
import type { Metadata } from "next";

import {env} from "@/lib/Environment";
import VenueSubmissionForm from "@/app/[locale]/places/create/PlaceSubmissionForm";
import {Localized} from "@/i18n/types";
import {EnrichedVenue} from "@/models/Overpass";
import {parseTags} from "@/utils/OsmHelpers";
import {OsmAuthProvider} from "@/providers/OsmAuth";

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
        title: `Edit ${name} | Mapping Bitcoin`,
        description: `Suggest edits for ${name} on Mapping Bitcoin`,
    };
}

export default async function PlaceEditPage({ params }: PageProps & Localized) {
    const { slug } = await params;

    const venue = await getVenueBySlug(slug);

    if (!venue) return notFound();

    return (
        <OsmAuthProvider>
            <VenueSubmissionForm venue={venue} />
        </OsmAuthProvider>
    );
}
