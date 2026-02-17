import { NextRequest, NextResponse } from "next/server";
import { indexReview, indexReviewReply } from "@/lib/db/services/reviews";

interface IndexReviewBody {
    type: "review" | "reply";
    eventId: string;
    osmId: string;
    authorPubkey: string;
    rating?: number | null;
    content?: string | null;
    eventCreatedAt: number; // Unix timestamp
    // For replies
    reviewEventId?: string;
    isOwnerReply?: boolean;
    // Optional author profile
    authorProfile?: {
        name?: string | null;
        picture?: string | null;
        nip05?: string | null;
    };
    // Image support (multiple images)
    imageUrls?: string[];
}

interface ProcessedImage {
    imageUrl: string;
    thumbnailUrl: string;
    thumbnailKey: string;
}

/**
 * Process a single image - create thumbnail
 */
async function processImage(
    imageUrl: string,
    eventId: string,
    baseUrl: string
): Promise<ProcessedImage | null> {
    try {
        const processResponse = await fetch(
            new URL("/api/reviews/process-image", baseUrl).toString(),
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageUrl,
                    reviewEventId: eventId,
                }),
            }
        );

        if (processResponse.ok) {
            const result = await processResponse.json();
            return {
                imageUrl,
                thumbnailUrl: result.thumbnailUrl,
                thumbnailKey: result.thumbnailKey,
            };
        } else {
            console.warn(`[IndexReview] Failed to create thumbnail for ${imageUrl}: ${processResponse.status}`);
            return null;
        }
    } catch (error) {
        console.warn(`[IndexReview] Error processing image ${imageUrl}:`, error);
        return null;
    }
}

/**
 * POST /api/reviews/index
 * Index a review or reply after client publishes to relays
 * This allows immediate display without waiting for relay listener
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as IndexReviewBody;

        // Validate required fields
        if (!body.eventId || !body.authorPubkey || !body.eventCreatedAt) {
            return NextResponse.json(
                { error: "Missing required fields: eventId, authorPubkey, eventCreatedAt" },
                { status: 400 }
            );
        }

        const eventCreatedAt = new Date(body.eventCreatedAt * 1000);

        if (body.type === "reply") {
            // Index a reply
            if (!body.reviewEventId || !body.content) {
                return NextResponse.json(
                    { error: "Reply requires reviewEventId and content" },
                    { status: 400 }
                );
            }

            const reply = await indexReviewReply({
                eventId: body.eventId,
                reviewEventId: body.reviewEventId,
                authorPubkey: body.authorPubkey,
                content: body.content,
                isOwnerReply: body.isOwnerReply,
                eventCreatedAt,
                authorProfile: body.authorProfile,
            });

            return NextResponse.json({
                success: true,
                type: "reply",
                replyId: reply.id,
            });
        } else {
            // Index a review
            if (!body.osmId) {
                return NextResponse.json(
                    { error: "Review requires osmId" },
                    { status: 400 }
                );
            }

            // Validate rating if provided
            if (body.rating !== undefined && body.rating !== null) {
                if (body.rating < 1 || body.rating > 5) {
                    return NextResponse.json(
                        { error: "Rating must be between 1 and 5" },
                        { status: 400 }
                    );
                }
            }

            // Process all images in parallel - create thumbnails
            const imageUrls: string[] = [];
            const thumbnailUrls: string[] = [];
            const thumbnailKeys: string[] = [];

            if (body.imageUrls && body.imageUrls.length > 0) {
                console.log(`[IndexReview] Processing ${body.imageUrls.length} images...`);

                const processPromises = body.imageUrls.map(url =>
                    processImage(url, body.eventId, request.url)
                );

                const results = await Promise.all(processPromises);

                for (let i = 0; i < body.imageUrls.length; i++) {
                    const result = results[i];
                    if (result) {
                        imageUrls.push(result.imageUrl);
                        thumbnailUrls.push(result.thumbnailUrl);
                        thumbnailKeys.push(result.thumbnailKey);
                    } else {
                        // Keep original image even if thumbnail failed
                        imageUrls.push(body.imageUrls[i]);
                    }
                }

                console.log(`[IndexReview] Created ${thumbnailUrls.length} thumbnails`);
            }

            const result = await indexReview({
                eventId: body.eventId,
                osmId: body.osmId,
                authorPubkey: body.authorPubkey,
                rating: body.rating,
                content: body.content,
                eventCreatedAt,
                authorProfile: body.authorProfile,
                imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
                thumbnailUrls: thumbnailUrls.length > 0 ? thumbnailUrls : undefined,
                thumbnailKeys: thumbnailKeys.length > 0 ? thumbnailKeys : undefined,
            });

            if (result.wasBlocked) {
                return NextResponse.json({
                    success: false,
                    blocked: true,
                    spamReasons: result.spamCheck?.reasons || [],
                }, { status: 403 });
            }

            return NextResponse.json({
                success: true,
                type: "review",
                reviewId: result.review.id,
                spamStatus: result.review.spamStatus,
                spamReasons: result.spamCheck?.reasons || [],
                thumbnailUrls,
            });
        }
    } catch (error) {
        console.error("Error indexing review:", error);

        // Check for known error types
        if (error instanceof Error) {
            if (error.message.includes("Parent review not found")) {
                return NextResponse.json(
                    { error: "Parent review not found" },
                    { status: 404 }
                );
            }
        }

        return NextResponse.json(
            { error: "Failed to index review" },
            { status: 500 }
        );
    }
}
