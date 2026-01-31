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

// Generation Config types for n8n integration
export interface GenerationConfig {
    id: string;
    // Generation settings
    postsPerPlatform: Record<string, number>;
    contentMixWeights: Record<string, number>;
    generateImages: boolean;
    aiModel: "sonnet" | "opus";
    // Scheduling settings
    postsPerDay: Record<string, number>;
    activeHoursStart: string;
    activeHoursEnd: string;
    timezone: string;
    activeDays: string[];
    // Webhook
    webhookUrl: string | null;
    webhookSecret: string | null;
    lastTriggeredAt: string | null;
    // Timestamps
    updatedAt: string;
    createdAt: string;
}

export const PLATFORMS = ["x", "nostr", "instagram"] as const;
export type Platform = typeof PLATFORMS[number];

export const PLATFORM_LABELS: Record<Platform, string> = {
    x: "Twitter/X",
    nostr: "Nostr",
    instagram: "Instagram",
};

export const CONTENT_MIX_TYPES = [
    "venue_spotlight",
    "education",
    "stats",
    "community",
] as const;
export type ContentMixType = typeof CONTENT_MIX_TYPES[number];

export const CONTENT_MIX_LABELS: Record<ContentMixType, string> = {
    venue_spotlight: "Venue Spotlight",
    education: "Education",
    stats: "Stats & Facts",
    community: "Community",
};

export const DAYS_OF_WEEK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayOfWeek = typeof DAYS_OF_WEEK[number];

export const DAY_LABELS: Record<DayOfWeek, string> = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
};

export const AI_MODELS = ["sonnet", "opus"] as const;
export type AIModel = typeof AI_MODELS[number];

export const AI_MODEL_LABELS: Record<AIModel, string> = {
    sonnet: "Claude Sonnet (Faster)",
    opus: "Claude Opus (Better)",
};
