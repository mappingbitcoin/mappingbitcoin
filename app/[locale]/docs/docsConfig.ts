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
                description: "Introduction to Mapping Bitcoin",
            },
        ],
    },
    {
        title: "Core Systems",
        items: [
            {
                slug: "osm-sync",
                title: "OSM Sync",
                description: "OpenStreetMap synchronization",
            },
            {
                slug: "data-enrichment",
                title: "Data Enrichment",
                description: "Geographic and category enrichment",
            },
            {
                slug: "nostr-integration",
                title: "Nostr Integration",
                description: "Decentralized social features and announcements",
            },
        ],
    },
    {
        title: "Features",
        items: [
            {
                slug: "venue-creation",
                title: "Creating Venues",
                description: "Submit new Bitcoin venues",
            },
            {
                slug: "blossom-images",
                title: "Image Uploads",
                description: "Blossom protocol for images",
            },
            {
                slug: "verification",
                title: "Verification",
                description: "Verify business ownership",
            },
        ],
    },
    {
        title: "Community",
        items: [
            {
                slug: "contributing",
                title: "Contributing",
                description: "How to contribute to the platform",
            },
        ],
    },
    {
        title: "Reference",
        items: [
            {
                slug: "api-reference",
                title: "API Reference",
                description: "REST API documentation (coming soon)",
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
