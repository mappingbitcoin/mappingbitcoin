import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import prisma from "@/lib/db/prisma";
import { bech32ToHex } from "@/lib/nostr/crypto";

// Validate hex pubkey format
function isValidHexPubkey(pubkey: string): boolean {
    return /^[a-fA-F0-9]{64}$/.test(pubkey);
}

// Convert npub to hex if needed
function normalizePublicKey(input: string): string | null {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // If it's already hex format
    if (isValidHexPubkey(trimmed)) {
        return trimmed.toLowerCase();
    }

    // If it starts with npub, try to decode
    if (trimmed.startsWith("npub1")) {
        const decoded = bech32ToHex(trimmed);
        if (decoded && decoded.type === "npub" && isValidHexPubkey(decoded.hex)) {
            return decoded.hex;
        }
    }

    return null;
}

interface BulkBanRequest {
    pubkeys: string[]; // Array of pubkeys (hex or npub format)
    reason?: string;
    action: "ban" | "unban";
}

/**
 * POST /api/admin/users/bulk-ban
 * Ban or unban multiple users at once
 */
export async function POST(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (!authResult.success) return authResult.response;

    try {
        const body: BulkBanRequest = await request.json();
        const { pubkeys, reason, action } = body;

        if (!pubkeys || !Array.isArray(pubkeys) || pubkeys.length === 0) {
            return NextResponse.json(
                { error: "pubkeys array is required and must not be empty" },
                { status: 400 }
            );
        }

        if (!action || !["ban", "unban"].includes(action)) {
            return NextResponse.json(
                { error: "Invalid action. Must be 'ban' or 'unban'" },
                { status: 400 }
            );
        }

        // Limit bulk operations
        if (pubkeys.length > 100) {
            return NextResponse.json(
                { error: "Maximum 100 pubkeys per request" },
                { status: 400 }
            );
        }

        // Normalize all pubkeys
        const normalizedPubkeys: string[] = [];
        const invalidPubkeys: string[] = [];

        for (const pk of pubkeys) {
            const normalized = normalizePublicKey(pk);
            if (normalized) {
                normalizedPubkeys.push(normalized);
            } else {
                invalidPubkeys.push(pk);
            }
        }

        if (normalizedPubkeys.length === 0) {
            return NextResponse.json(
                { error: "No valid pubkeys provided", invalidPubkeys },
                { status: 400 }
            );
        }

        // Create users that don't exist (for pre-emptive banning)
        const existingUsers = await prisma.user.findMany({
            where: { pubkey: { in: normalizedPubkeys } },
            select: { pubkey: true },
        });
        const existingPubkeys = new Set(existingUsers.map((u) => u.pubkey));

        // Create new user records for pubkeys that don't exist
        const newPubkeys = normalizedPubkeys.filter((pk) => !existingPubkeys.has(pk));
        if (newPubkeys.length > 0 && action === "ban") {
            await prisma.user.createMany({
                data: newPubkeys.map((pubkey) => ({
                    pubkey,
                    bannedAt: new Date(),
                    bannedReason: reason || "Bulk banned by admin",
                    bannedBy: authResult.pubkey,
                })),
                skipDuplicates: true,
            });
        }

        // Update existing users
        let updatedCount = 0;
        if (action === "ban") {
            const result = await prisma.user.updateMany({
                where: {
                    pubkey: { in: normalizedPubkeys },
                    bannedAt: null, // Only ban users not already banned
                },
                data: {
                    bannedAt: new Date(),
                    bannedReason: reason || "Bulk banned by admin",
                    bannedBy: authResult.pubkey,
                },
            });
            updatedCount = result.count + newPubkeys.length;
        } else {
            const result = await prisma.user.updateMany({
                where: {
                    pubkey: { in: normalizedPubkeys },
                    bannedAt: { not: null }, // Only unban users that are banned
                },
                data: {
                    bannedAt: null,
                    bannedReason: null,
                    bannedBy: null,
                },
            });
            updatedCount = result.count;
        }

        return NextResponse.json({
            success: true,
            message: `${action === "ban" ? "Banned" : "Unbanned"} ${updatedCount} users`,
            processed: normalizedPubkeys.length,
            updated: updatedCount,
            newUsersCreated: action === "ban" ? newPubkeys.length : 0,
            invalidPubkeys: invalidPubkeys.length > 0 ? invalidPubkeys : undefined,
        });
    } catch (error) {
        console.error("Failed to bulk update users:", error);
        return NextResponse.json(
            { error: "Failed to process bulk operation" },
            { status: 500 }
        );
    }
}
