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
                description: "Learn how Mapping Bitcoin works - an open-source directory of Bitcoin-accepting businesses worldwide, built on OpenStreetMap and the Nostr protocol.", // 155
            },
        ],
    },
    {
        title: "Core Systems",
        items: [
            {
                slug: "osm-sync",
                title: "OSM Sync",
                description: "Discover how Mapping Bitcoin continuously syncs with OpenStreetMap to keep Bitcoin merchant data accurate, verified, and up-to-date across the globe.", // 152
            },
            {
                slug: "data-enrichment",
                title: "Data Enrichment",
                description: "Learn how we enrich raw venue data with geographic coordinates, standardized categories, and business details to improve merchant discovery.", // 144
            },
            {
                slug: "nostr-integration",
                title: "Nostr Integration",
                description: "Explore how Mapping Bitcoin leverages Nostr for decentralized identity, censorship-resistant social features, and real-time venue announcements.", // 150
            },
        ],
    },
    {
        title: "Reviews & Trust",
        items: [
            {
                slug: "reviews",
                title: "Reviews",
                description: "Learn how to submit reviews for Bitcoin venues using Nostr. Understand our decentralized, censorship-resistant review system and rating methodology.", // 156
            },
            {
                slug: "web-of-trust",
                title: "Web of Trust",
                description: "Understand how trust scoring works on Mapping Bitcoin - Web of Trust badges, reputation metrics, and community-driven merchant verification.", // 148
            },
        ],
    },
    {
        title: "Features",
        items: [
            {
                slug: "venue-creation",
                title: "Creating Venues",
                description: "Step-by-step guide to adding new Bitcoin-accepting businesses to Mapping Bitcoin. Your submissions sync directly with OpenStreetMap worldwide.", // 151
            },
            {
                slug: "blossom-images",
                title: "Image Uploads",
                description: "Learn how to upload venue photos using the Blossom protocol - a decentralized, censorship-resistant image hosting solution built for Bitcoin merchants.", // 157
            },
            {
                slug: "verification",
                title: "Verification",
                description: "Discover how business owners can verify their venue listing on Mapping Bitcoin using Nostr, proving ownership and building customer trust.", // 145
            },
        ],
    },
    {
        title: "Community",
        items: [
            {
                slug: "contributing",
                title: "Contributing",
                description: "Join the Mapping Bitcoin community and help grow the Bitcoin economy. Contribute code, add venues, improve data quality, or become a local ambassador.", // 154
            },
        ],
    },
    {
        title: "Reference",
        items: [
            {
                slug: "api-reference",
                title: "API Reference",
                description: "Complete REST API documentation for Mapping Bitcoin. Access venue data, search Bitcoin merchants by location, and integrate with your applications.", // 154
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
