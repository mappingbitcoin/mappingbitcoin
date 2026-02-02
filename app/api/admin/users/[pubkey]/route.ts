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
    // If it's already hex format
    if (isValidHexPubkey(input)) {
        return input.toLowerCase();
    }

    // If it starts with npub, try to decode
    if (input.startsWith("npub1")) {
        const decoded = bech32ToHex(input);
        if (decoded && decoded.type === "npub" && isValidHexPubkey(decoded.hex)) {
            return decoded.hex;
        }
    }

    return null;
}

/**
 * GET /api/admin/users/[pubkey]
 * Get a single user's details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ pubkey: string }> }
) {
    const authResult = await requireAdmin(request);
    if (!authResult.success) return authResult.response;

    const { pubkey: rawPubkey } = await params;
    const pubkey = normalizePublicKey(rawPubkey);

    if (!pubkey) {
        return NextResponse.json(
            { error: "Invalid pubkey format" },
            { status: 400 }
        );
    }

    try {
        const user = await prisma.user.findUnique({
            where: { pubkey },
            include: {
                _count: {
                    select: {
                        reviews: true,
                        claims: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            id: user.id,
            pubkey: user.pubkey,
            name: user.name,
            displayName: user.displayName,
            picture: user.picture,
            nip05: user.nip05,
            createdAt: user.createdAt.toISOString(),
            bannedAt: user.bannedAt?.toISOString() || null,
            bannedReason: user.bannedReason,
            bannedBy: user.bannedBy,
            reviewCount: user._count.reviews,
            claimCount: user._count.claims,
        });
    } catch (error) {
        console.error("Failed to fetch user:", error);
        return NextResponse.json(
            { error: "Failed to fetch user" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/users/[pubkey]
 * Ban or unban a user
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ pubkey: string }> }
) {
    const authResult = await requireAdmin(request);
    if (!authResult.success) return authResult.response;

    const { pubkey: rawPubkey } = await params;
    const pubkey = normalizePublicKey(rawPubkey);

    if (!pubkey) {
        return NextResponse.json(
            { error: "Invalid pubkey format" },
            { status: 400 }
        );
    }

    try {
        const body = await request.json();
        const { action, reason } = body;

        if (!action || !["ban", "unban"].includes(action)) {
            return NextResponse.json(
                { error: "Invalid action. Must be 'ban' or 'unban'" },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { pubkey },
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        if (action === "ban") {
            if (existingUser.bannedAt) {
                return NextResponse.json(
                    { error: "User is already banned" },
                    { status: 400 }
                );
            }

            const updatedUser = await prisma.user.update({
                where: { pubkey },
                data: {
                    bannedAt: new Date(),
                    bannedReason: reason || "Banned by admin",
                    bannedBy: authResult.pubkey,
                },
            });

            return NextResponse.json({
                success: true,
                message: "User banned successfully",
                user: {
                    pubkey: updatedUser.pubkey,
                    bannedAt: updatedUser.bannedAt?.toISOString(),
                    bannedReason: updatedUser.bannedReason,
                },
            });
        } else {
            // Unban
            if (!existingUser.bannedAt) {
                return NextResponse.json(
                    { error: "User is not banned" },
                    { status: 400 }
                );
            }

            const updatedUser = await prisma.user.update({
                where: { pubkey },
                data: {
                    bannedAt: null,
                    bannedReason: null,
                    bannedBy: null,
                },
            });

            return NextResponse.json({
                success: true,
                message: "User unbanned successfully",
                user: {
                    pubkey: updatedUser.pubkey,
                    bannedAt: null,
                },
            });
        }
    } catch (error) {
        console.error("Failed to update user:", error);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}
