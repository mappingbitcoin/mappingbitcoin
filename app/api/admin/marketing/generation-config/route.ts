import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import prisma from "@/lib/db/prisma";

/**
 * GET /api/admin/marketing/generation-config
 * Get the generation config (creates default if not exists)
 */
export async function GET(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (!authResult.success) return authResult.response;

    try {
        let config = await prisma.generationConfig.findFirst();

        if (!config) {
            // Create default config
            config = await prisma.generationConfig.create({
                data: {
                    postsPerPlatform: { x: 20, nostr: 15, instagram: 10 },
                    contentMixWeights: { venue_spotlight: 40, education: 30, stats: 20, community: 10 },
                    generateImages: false,
                    aiModel: "sonnet",
                    postsPerDay: { x: 2, nostr: 1, instagram: 1 },
                    activeHoursStart: "12:00",
                    activeHoursEnd: "22:00",
                    timezone: "UTC",
                    activeDays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
                },
            });
        }

        return NextResponse.json({ config });
    } catch (error) {
        console.error("Failed to get generation config:", error);
        return NextResponse.json(
            { error: "Failed to get generation config" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/marketing/generation-config
 * Update the generation config
 */
export async function PUT(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (!authResult.success) return authResult.response;

    try {
        const body = await request.json();

        // Validate AI model
        if (body.aiModel && !["sonnet", "opus"].includes(body.aiModel)) {
            return NextResponse.json(
                { error: "Invalid AI model. Must be 'sonnet' or 'opus'" },
                { status: 400 }
            );
        }

        // Get or create config
        let config = await prisma.generationConfig.findFirst();

        if (!config) {
            config = await prisma.generationConfig.create({
                data: {
                    postsPerPlatform: body.postsPerPlatform || { x: 20, nostr: 15, instagram: 10 },
                    contentMixWeights: body.contentMixWeights || { venue_spotlight: 40, education: 30, stats: 20, community: 10 },
                    generateImages: body.generateImages ?? false,
                    aiModel: body.aiModel || "sonnet",
                    postsPerDay: body.postsPerDay || { x: 2, nostr: 1, instagram: 1 },
                    activeHoursStart: body.activeHoursStart || "12:00",
                    activeHoursEnd: body.activeHoursEnd || "22:00",
                    timezone: body.timezone || "UTC",
                    activeDays: body.activeDays || ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
                    webhookUrl: body.webhookUrl || null,
                    webhookSecret: body.webhookSecret || null,
                },
            });
        } else {
            config = await prisma.generationConfig.update({
                where: { id: config.id },
                data: {
                    postsPerPlatform: body.postsPerPlatform ?? config.postsPerPlatform,
                    contentMixWeights: body.contentMixWeights ?? config.contentMixWeights,
                    generateImages: body.generateImages ?? config.generateImages,
                    aiModel: body.aiModel ?? config.aiModel,
                    postsPerDay: body.postsPerDay ?? config.postsPerDay,
                    activeHoursStart: body.activeHoursStart ?? config.activeHoursStart,
                    activeHoursEnd: body.activeHoursEnd ?? config.activeHoursEnd,
                    timezone: body.timezone ?? config.timezone,
                    activeDays: body.activeDays ?? config.activeDays,
                    webhookUrl: body.webhookUrl !== undefined ? body.webhookUrl : config.webhookUrl,
                    webhookSecret: body.webhookSecret !== undefined ? body.webhookSecret : config.webhookSecret,
                },
            });
        }

        return NextResponse.json({ config });
    } catch (error) {
        console.error("Failed to update generation config:", error);
        return NextResponse.json(
            { error: "Failed to update generation config" },
            { status: 500 }
        );
    }
}
