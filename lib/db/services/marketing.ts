import prisma from "../prisma";
import { SocialNetwork, PostType, ContentTopic, Prisma } from "@prisma/client";

// ============================================
// Marketing Guidelines
// ============================================

export async function getGuidelines() {
    // Get the first (and only) guidelines row
    return prisma.marketingGuidelines.findFirst();
}

export interface UpsertGuidelinesInput {
    voiceTone?: string | null;
    doList?: string[];
    dontList?: string[];
    brandValues?: string[];
}

export async function upsertGuidelines(input: UpsertGuidelinesInput) {
    const existing = await prisma.marketingGuidelines.findFirst();

    if (existing) {
        return prisma.marketingGuidelines.update({
            where: { id: existing.id },
            data: input,
        });
    }

    return prisma.marketingGuidelines.create({
        data: {
            voiceTone: input.voiceTone,
            doList: input.doList || [],
            dontList: input.dontList || [],
            brandValues: input.brandValues || [],
        },
    });
}

// ============================================
// Marketing Links
// ============================================

export interface ListLinksOptions {
    category?: string;
}

export async function listMarketingLinks(options: ListLinksOptions = {}) {
    return prisma.marketingLink.findMany({
        where: options.category ? { category: options.category } : undefined,
        orderBy: { createdAt: "desc" },
    });
}

export async function getMarketingLink(id: string) {
    return prisma.marketingLink.findUnique({ where: { id } });
}

export interface CreateLinkInput {
    title: string;
    url: string;
    description?: string | null;
    category: string;
}

export async function createMarketingLink(input: CreateLinkInput) {
    return prisma.marketingLink.create({
        data: input,
    });
}

export interface UpdateLinkInput {
    title?: string;
    url?: string;
    description?: string | null;
    category?: string;
}

export async function updateMarketingLink(id: string, input: UpdateLinkInput) {
    return prisma.marketingLink.update({
        where: { id },
        data: input,
    });
}

export async function deleteMarketingLink(id: string) {
    return prisma.marketingLink.delete({ where: { id } });
}

export async function listLinkCategories(): Promise<string[]> {
    const result = await prisma.marketingLink.findMany({
        select: { category: true },
        distinct: ["category"],
    });
    return result.map((r) => r.category);
}

// ============================================
// Marketing Assets
// ============================================

export interface ListAssetsOptions {
    socialNetwork?: SocialNetwork;
    postType?: PostType;
    topic?: ContentTopic;
    customTag?: string;
}

export async function listMarketingAssets(options: ListAssetsOptions = {}) {
    const where: Prisma.MarketingAssetWhereInput = {};

    if (options.socialNetwork) {
        where.socialNetworks = { has: options.socialNetwork };
    }
    if (options.postType) {
        where.postTypes = { has: options.postType };
    }
    if (options.topic) {
        where.topic = options.topic;
    }
    if (options.customTag) {
        where.customTags = { has: options.customTag };
    }

    return prisma.marketingAsset.findMany({
        where,
        orderBy: { createdAt: "desc" },
    });
}

export async function getMarketingAsset(id: string) {
    return prisma.marketingAsset.findUnique({ where: { id } });
}

export interface CreateAssetInput {
    filename: string;
    storageKey: string;
    mimeType: string;
    size: number;
    socialNetworks?: SocialNetwork[];
    postTypes?: PostType[];
    topic?: ContentTopic | null;
    customTags?: string[];
    altText?: string | null;
}

export async function createMarketingAsset(input: CreateAssetInput) {
    return prisma.marketingAsset.create({
        data: {
            filename: input.filename,
            storageKey: input.storageKey,
            mimeType: input.mimeType,
            size: input.size,
            socialNetworks: input.socialNetworks || [],
            postTypes: input.postTypes || [],
            topic: input.topic,
            customTags: input.customTags || [],
            altText: input.altText,
        },
    });
}

export interface UpdateAssetInput {
    socialNetworks?: SocialNetwork[];
    postTypes?: PostType[];
    topic?: ContentTopic | null;
    customTags?: string[];
    altText?: string | null;
}

export async function updateMarketingAsset(id: string, input: UpdateAssetInput) {
    return prisma.marketingAsset.update({
        where: { id },
        data: input,
    });
}

export async function deleteMarketingAsset(id: string) {
    return prisma.marketingAsset.delete({ where: { id } });
}

// ============================================
// Hashtag Sets
// ============================================

export async function listHashtagSets() {
    return prisma.hashtagSet.findMany({
        orderBy: { name: "asc" },
    });
}

export async function getHashtagSet(id: string) {
    return prisma.hashtagSet.findUnique({ where: { id } });
}

export interface CreateHashtagSetInput {
    name: string;
    hashtags: string[];
    socialNetworks?: SocialNetwork[];
    description?: string | null;
}

export async function createHashtagSet(input: CreateHashtagSetInput) {
    return prisma.hashtagSet.create({
        data: {
            name: input.name,
            hashtags: input.hashtags,
            socialNetworks: input.socialNetworks || [],
            description: input.description,
        },
    });
}

export interface UpdateHashtagSetInput {
    name?: string;
    hashtags?: string[];
    socialNetworks?: SocialNetwork[];
    description?: string | null;
}

export async function updateHashtagSet(id: string, input: UpdateHashtagSetInput) {
    return prisma.hashtagSet.update({
        where: { id },
        data: input,
    });
}

export async function deleteHashtagSet(id: string) {
    return prisma.hashtagSet.delete({ where: { id } });
}

// ============================================
// Example Posts
// ============================================

export interface ListExamplePostsOptions {
    socialNetwork?: SocialNetwork;
}

export async function listExamplePosts(options: ListExamplePostsOptions = {}) {
    return prisma.examplePost.findMany({
        where: options.socialNetwork ? { socialNetwork: options.socialNetwork } : undefined,
        orderBy: { createdAt: "desc" },
    });
}

export async function getExamplePost(id: string) {
    return prisma.examplePost.findUnique({ where: { id } });
}

export interface CreateExamplePostInput {
    socialNetwork: SocialNetwork;
    content: string;
    hashtags?: string[];
    notes?: string | null;
}

export async function createExamplePost(input: CreateExamplePostInput) {
    return prisma.examplePost.create({
        data: {
            socialNetwork: input.socialNetwork,
            content: input.content,
            hashtags: input.hashtags || [],
            notes: input.notes,
        },
    });
}

export interface UpdateExamplePostInput {
    socialNetwork?: SocialNetwork;
    content?: string;
    hashtags?: string[];
    notes?: string | null;
}

export async function updateExamplePost(id: string, input: UpdateExamplePostInput) {
    return prisma.examplePost.update({
        where: { id },
        data: input,
    });
}

export async function deleteExamplePost(id: string) {
    return prisma.examplePost.delete({ where: { id } });
}

// ============================================
// Marketing Stats
// ============================================

export interface ListStatsOptions {
    category?: string;
    includeExpired?: boolean;
}

export async function listMarketingStats(options: ListStatsOptions = {}) {
    const where: Prisma.MarketingStatWhereInput = {};

    if (options.category) {
        where.category = options.category;
    }

    if (!options.includeExpired) {
        where.OR = [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
        ];
    }

    return prisma.marketingStat.findMany({
        where,
        orderBy: { createdAt: "desc" },
    });
}

export async function getMarketingStat(id: string) {
    return prisma.marketingStat.findUnique({ where: { id } });
}

export interface CreateStatInput {
    label: string;
    value: string;
    source?: string | null;
    category: string;
    expiresAt?: Date | null;
}

export async function createMarketingStat(input: CreateStatInput) {
    return prisma.marketingStat.create({
        data: input,
    });
}

export interface UpdateStatInput {
    label?: string;
    value?: string;
    source?: string | null;
    category?: string;
    expiresAt?: Date | null;
}

export async function updateMarketingStat(id: string, input: UpdateStatInput) {
    return prisma.marketingStat.update({
        where: { id },
        data: input,
    });
}

export async function deleteMarketingStat(id: string) {
    return prisma.marketingStat.delete({ where: { id } });
}

export async function listStatCategories(): Promise<string[]> {
    const result = await prisma.marketingStat.findMany({
        select: { category: true },
        distinct: ["category"],
    });
    return result.map((r) => r.category);
}
