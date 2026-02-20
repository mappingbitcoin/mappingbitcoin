export interface DocItem {
    slug: string;
    title: string;
    description: string;
}

export interface DocSection {
    title: string;
    items: DocItem[];
}

export const docsConfig: DocSection[] = [
    {
        title: "Getting Started",
        items: [
            {
                slug: "overview",
                title: "Overview",
                description: "Learn how Mapping Bitcoin works - an open-source directory of Bitcoin-accepting businesses built on OpenStreetMap and Nostr.",
            },
        ],
    },
    {
        title: "Core Systems",
        items: [
            {
                slug: "osm-sync",
                title: "OSM Sync",
                description: "How Mapping Bitcoin syncs with OpenStreetMap to keep Bitcoin venue data accurate and up-to-date worldwide.",
            },
            {
                slug: "data-enrichment",
                title: "Data Enrichment",
                description: "How we enrich venue data with geographic coordinates, categories, and business details for better discovery.",
            },
            {
                slug: "nostr-integration",
                title: "Nostr Integration",
                description: "How Mapping Bitcoin uses Nostr for decentralized identity, social features, and censorship-resistant announcements.",
            },
        ],
    },
    {
        title: "Reviews & Trust",
        items: [
            {
                slug: "reviews",
                title: "Reviews",
                description: "How to submit reviews for Bitcoin venues and understand our decentralized review system powered by Nostr.",
            },
            {
                slug: "web-of-trust",
                title: "Web of Trust",
                description: "How trust scoring works on Mapping Bitcoin - WoT badges, reputation, and community-driven verification.",
            },
        ],
    },
    {
        title: "Features",
        items: [
            {
                slug: "venue-creation",
                title: "Creating Venues",
                description: "Step-by-step guide to adding new Bitcoin-accepting businesses to Mapping Bitcoin and OpenStreetMap.",
            },
            {
                slug: "blossom-images",
                title: "Image Uploads",
                description: "How to upload venue images using the Blossom protocol for decentralized, censorship-resistant image hosting.",
            },
            {
                slug: "verification",
                title: "Verification",
                description: "How business owners can verify their venue listing on Mapping Bitcoin using Nostr for proof of ownership.",
            },
        ],
    },
    {
        title: "Community",
        items: [
            {
                slug: "contributing",
                title: "Contributing",
                description: "Join the Mapping Bitcoin community - contribute code, add venues, improve data, or become a local ambassador.",
            },
        ],
    },
    {
        title: "Reference",
        items: [
            {
                slug: "api-reference",
                title: "API Reference",
                description: "REST API documentation for Mapping Bitcoin - access venue data, search locations, and integrate with your app.",
            },
        ],
    },
];

export const allDocs = docsConfig.flatMap((section) => section.items);

export function getDocBySlug(slug: string): DocItem | undefined {
    return allDocs.find((doc) => doc.slug === slug);
}

export function getAdjacentDocs(slug: string): { prev?: DocItem; next?: DocItem } {
    const index = allDocs.findIndex((doc) => doc.slug === slug);
    return {
        prev: index > 0 ? allDocs[index - 1] : undefined,
        next: index < allDocs.length - 1 ? allDocs[index + 1] : undefined,
    };
}
