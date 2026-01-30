export const SOCIAL_NETWORKS = [
    "TWITTER",
    "INSTAGRAM",
    "LINKEDIN",
    "FACEBOOK",
    "TIKTOK",
    "YOUTUBE",
    "NOSTR",
] as const;

export const POST_TYPES = [
    "IMAGE",
    "VIDEO",
    "CAROUSEL",
    "STORY",
    "REEL",
    "TEXT",
    "INFOGRAPHIC",
] as const;

export const CONTENT_TOPICS = [
    "ANNOUNCEMENTS",
    "EDUCATION",
    "COMMUNITY",
    "PRODUCT",
    "NEWS",
    "EVENTS",
    "TIPS",
    "OTHER",
] as const;

export type SocialNetwork = typeof SOCIAL_NETWORKS[number];
export type PostType = typeof POST_TYPES[number];
export type ContentTopic = typeof CONTENT_TOPICS[number];

export interface MarketingGuidelines {
    id: string;
    voiceTone: string | null;
    doList: string[];
    dontList: string[];
    brandValues: string[];
    updatedAt: string;
    createdAt: string;
}

export interface MarketingLink {
    id: string;
    title: string;
    url: string;
    description: string | null;
    category: string;
    createdAt: string;
    updatedAt: string;
}

export interface MarketingAsset {
    id: string;
    filename: string;
    storageKey: string;
    mimeType: string;
    size: number;
    socialNetworks: SocialNetwork[];
    postTypes: PostType[];
    topic: ContentTopic | null;
    customTags: string[];
    altText: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface HashtagSet {
    id: string;
    name: string;
    hashtags: string[];
    socialNetworks: SocialNetwork[];
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ExamplePost {
    id: string;
    socialNetwork: SocialNetwork;
    content: string;
    hashtags: string[];
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface MarketingStat {
    id: string;
    label: string;
    value: string;
    source: string | null;
    category: string;
    expiresAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export const SOCIAL_NETWORK_LABELS: Record<SocialNetwork, string> = {
    TWITTER: "Twitter/X",
    INSTAGRAM: "Instagram",
    LINKEDIN: "LinkedIn",
    FACEBOOK: "Facebook",
    TIKTOK: "TikTok",
    YOUTUBE: "YouTube",
    NOSTR: "Nostr",
};

export const POST_TYPE_LABELS: Record<PostType, string> = {
    IMAGE: "Image",
    VIDEO: "Video",
    CAROUSEL: "Carousel",
    STORY: "Story",
    REEL: "Reel",
    TEXT: "Text",
    INFOGRAPHIC: "Infographic",
};

export const CONTENT_TOPIC_LABELS: Record<ContentTopic, string> = {
    ANNOUNCEMENTS: "Announcements",
    EDUCATION: "Education",
    COMMUNITY: "Community",
    PRODUCT: "Product",
    NEWS: "News",
    EVENTS: "Events",
    TIPS: "Tips",
    OTHER: "Other",
};
