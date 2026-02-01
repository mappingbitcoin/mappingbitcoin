import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { getVenueCache, getVenueIndexMap } from "@/app/api/cache/VenueCache";
import prisma from "@/lib/db/prisma";
import type { ClaimMethod } from "@prisma/client";

interface ManualVerifyRequest {
    venueId: number; // The numeric OSM ID
    pubkey: string; // The verifier's pubkey (hex format)
    method: ClaimMethod;
    notes?: string;
}

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
        try {
            // Use bech32 decoding for npub
            const { bech32 } = require("bech32");
            const decoded = bech32.decode(input);
            const pubkeyBytes = bech32.fromWords(decoded.words);
            const hex = Buffer.from(pubkeyBytes).toString("hex");
            if (isValidHexPubkey(hex)) {
                return hex;
            }
        } catch {
            return null;
        }
    }

    return null;
}

/**
 * POST /api/admin/places/verify
 * Manually verify a place
 */
export async function POST(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (!authResult.success) return authResult.response;

    try {
        const body: ManualVerifyRequest = await request.json();
        const { venueId, pubkey, method, notes } = body;

        // Validate required fields
        if (!venueId || typeof venueId !== "number") {
            return NextResponse.json(
                { error: "Valid venue ID is required" },
                { status: 400 }
            );
        }

        if (!pubkey || typeof pubkey !== "string") {
            return NextResponse.json(
                { error: "Pubkey is required" },
                { status: 400 }
            );
        }

        // Normalize and validate pubkey
        const normalizedPubkey = normalizePublicKey(pubkey.trim());
        if (!normalizedPubkey) {
            return NextResponse.json(
                { error: "Invalid pubkey format. Use hex (64 chars) or npub format." },
                { status: 400 }
            );
        }

        // Validate method
        const validMethods: ClaimMethod[] = ["PHYSICAL", "PHONE", "EMAIL", "DOMAIN", "MANUAL"];
        if (!method || !validMethods.includes(method)) {
            return NextResponse.json(
                { error: `Invalid method. Must be one of: ${validMethods.join(", ")}` },
                { status: 400 }
            );
        }

        // Verify venue exists in cache
        const venues = await getVenueCache();
        const venueIndexMap = await getVenueIndexMap();
        const venueIndex = venueIndexMap[venueId];

        if (venueIndex === undefined) {
            return NextResponse.json(
                { error: "Venue not found" },
                { status: 404 }
            );
        }

        const venue = venues[venueIndex];
        if (!venue) {
            return NextResponse.json(
                { error: "Venue data not available" },
                { status: 404 }
            );
        }

        // Create the normalized osmId
        const osmId = `${venue.type}/${venue.id}`;

        // Check if venue is already verified
        const existingVerified = await prisma.claim.findFirst({
            where: {
                venue: { osmId },
                status: "VERIFIED",
                revokedAt: null,
            },
        });

        if (existingVerified) {
            return NextResponse.json(
                { error: "This venue is already verified. Revoke the existing verification first." },
                { status: 409 }
            );
        }

        // Create the verification in a transaction
        const claim = await prisma.$transaction(async (tx) => {
            // Upsert venue record
            const venueRecord = await tx.venue.upsert({
                where: { osmId },
                update: {},
                create: { osmId },
            });

            // Upsert user record
            await tx.user.upsert({
                where: { pubkey: normalizedPubkey },
                update: {},
                create: { pubkey: normalizedPubkey },
            });

            // Create verified claim
            return tx.claim.create({
                data: {
                    venueId: venueRecord.id,
                    claimerPubkey: normalizedPubkey,
                    method,
                    status: "VERIFIED",
                    verifiedAt: new Date(),
                    // Store notes in revokedReason field (repurposing for admin notes)
                    // Or we could add a notes field to the schema later
                },
                include: {
                    venue: true,
                    claimer: true,
                },
            });
        });

        return NextResponse.json({
            success: true,
            message: "Venue verified successfully",
            claim: {
                id: claim.id,
                osmId: claim.venue.osmId,
                method: claim.method,
                status: claim.status,
                verifiedAt: claim.verifiedAt?.toISOString(),
                claimerPubkey: claim.claimerPubkey,
            },
        });
    } catch (error) {
        console.error("Failed to create manual verification:", error);
        return NextResponse.json(
            { error: "Failed to create verification" },
            { status: 500 }
        );
    }
}
