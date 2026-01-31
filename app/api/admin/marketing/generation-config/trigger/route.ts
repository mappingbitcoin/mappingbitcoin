import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import prisma from "@/lib/db/prisma";

/**
 * POST /api/admin/marketing/generation-config/trigger
 * Trigger the n8n webhook with full seed content
 */
export async function POST(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (!authResult.success) return authResult.response;

    try {
        // Get the generation config
        const config = await prisma.generationConfig.findFirst();

        if (!config) {
            return NextResponse.json(
                { error: "Generation config not found. Please save config first." },
                { status: 404 }
            );
        }

        if (!config.webhookUrl) {
            return NextResponse.json(
                { error: "Webhook URL not configured" },
                { status: 400 }
            );
        }

        // Fetch all seed content
        const [guidelines, links, assets, hashtagSets, examplePosts, stats] = await Promise.all([
            prisma.marketingGuidelines.findFirst(),
            prisma.marketingLink.findMany({ orderBy: { createdAt: "desc" } }),
            prisma.marketingAsset.findMany({ orderBy: { createdAt: "desc" } }),
            prisma.hashtagSet.findMany({ orderBy: { createdAt: "desc" } }),
            prisma.examplePost.findMany({ orderBy: { createdAt: "desc" } }),
            prisma.marketingStat.findMany({
                where: {
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: new Date() } },
                    ],
                },
                orderBy: { createdAt: "desc" },
            }),
        ]);

        // Build the payload
        const payload = {
            timestamp: new Date().toISOString(),

            // Generation Config
            generation: {
                postsPerPlatform: config.postsPerPlatform,
                contentMixWeights: config.contentMixWeights,
                generateImages: config.generateImages,
                aiModel: config.aiModel,
            },

            // Scheduling Config
            scheduling: {
                postsPerDay: config.postsPerDay,
                activeHours: {
                    start: config.activeHoursStart,
                    end: config.activeHoursEnd,
                    timezone: config.timezone,
                },
                days: config.activeDays,
            },

            // Seed Content
            seedContent: {
                voiceGuidelines: guidelines?.voiceTone || "",
                doList: guidelines?.doList || [],
                dontList: guidelines?.dontList || [],
                brandValues: guidelines?.brandValues || [],

                links: links.map((link) => ({
                    title: link.title,
                    url: link.url,
                    description: link.description,
                    category: link.category,
                })),

                assets: assets.map((asset) => ({
                    filename: asset.filename,
                    storageKey: asset.storageKey,
                    mimeType: asset.mimeType,
                    socialNetworks: asset.socialNetworks,
                    postTypes: asset.postTypes,
                    topic: asset.topic,
                    customTags: asset.customTags,
                    altText: asset.altText,
                })),

                hashtagSets: hashtagSets.map((set) => ({
                    name: set.name,
                    hashtags: set.hashtags,
                    socialNetworks: set.socialNetworks,
                    description: set.description,
                })),

                examplePosts: examplePosts.map((post) => ({
                    socialNetwork: post.socialNetwork,
                    content: post.content,
                    hashtags: post.hashtags,
                    notes: post.notes,
                })),

                stats: stats.map((stat) => ({
                    label: stat.label,
                    value: stat.value,
                    source: stat.source,
                    category: stat.category,
                })),
            },
        };

        // Build headers
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        if (config.webhookSecret) {
            headers["X-Webhook-Secret"] = config.webhookSecret;
        }

        // Trigger the webhook
        const webhookResponse = await fetch(config.webhookUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        });

        // Update last triggered timestamp
        await prisma.generationConfig.update({
            where: { id: config.id },
            data: { lastTriggeredAt: new Date() },
        });

        if (!webhookResponse.ok) {
            const errorText = await webhookResponse.text();
            return NextResponse.json(
                {
                    error: "Webhook call failed",
                    status: webhookResponse.status,
                    details: errorText,
                },
                { status: 502 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Webhook triggered successfully",
            webhookStatus: webhookResponse.status,
            payloadSummary: {
                links: links.length,
                assets: assets.length,
                hashtagSets: hashtagSets.length,
                examplePosts: examplePosts.length,
                stats: stats.length,
            },
        });
    } catch (error) {
        console.error("Failed to trigger webhook:", error);
        return NextResponse.json(
            { error: "Failed to trigger webhook" },
            { status: 500 }
        );
    }
}
