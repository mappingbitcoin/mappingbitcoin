import { NextRequest, NextResponse } from "next/server";
import { getSubscriberByToken, unsubscribeByToken } from "@/lib/db";

/**
 * GET /api/unsubscribe?token=xxx
 * Get subscriber info and their active subscriptions
 */
export async function GET(request: NextRequest) {
    try {
        const token = request.nextUrl.searchParams.get("token");

        if (!token) {
            return NextResponse.json(
                { error: "Missing unsubscribe token" },
                { status: 400 }
            );
        }

        const subscriber = await getSubscriberByToken(token);

        if (!subscriber) {
            return NextResponse.json(
                { error: "Invalid or expired unsubscribe token" },
                { status: 404 }
            );
        }

        // Return subscriber info with active lists
        return NextResponse.json({
            email: subscriber.email,
            lists: subscriber.lists.map((sl) => ({
                slug: sl.list.slug,
                name: sl.list.name,
                subscribedAt: sl.subscribedAt,
            })),
        });
    } catch (error) {
        console.error("Get subscriber error:", error);
        return NextResponse.json(
            { error: "Failed to get subscription info" },
            { status: 500 }
        );
    }
}

interface UnsubscribeRequest {
    token: string;
    list?: string; // Optional: specific list to unsubscribe from. If not provided, unsubscribe from all.
}

/**
 * POST /api/unsubscribe
 * Unsubscribe from a specific list or all lists
 */
export async function POST(request: NextRequest) {
    try {
        const body: UnsubscribeRequest = await request.json();
        const { token, list } = body;

        if (!token) {
            return NextResponse.json(
                { error: "Missing unsubscribe token" },
                { status: 400 }
            );
        }

        const result = await unsubscribeByToken(token, list);

        if (!result) {
            return NextResponse.json(
                { error: "Invalid token or list not found" },
                { status: 404 }
            );
        }

        // Get remaining active subscriptions
        const activeSubscriptions = result.lists.filter((sl) => !sl.unsubscribedAt);

        return NextResponse.json({
            success: true,
            message: list
                ? `Successfully unsubscribed from ${list}`
                : "Successfully unsubscribed from all lists",
            remainingLists: activeSubscriptions.map((sl) => ({
                slug: sl.list.slug,
                name: sl.list.name,
            })),
        });
    } catch (error) {
        console.error("Unsubscribe error:", error);
        return NextResponse.json(
            { error: "Failed to unsubscribe. Please try again." },
            { status: 500 }
        );
    }
}
