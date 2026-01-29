import { NextRequest, NextResponse } from "next/server";
import { validateAuthToken } from "@/lib/db/services/auth";
import { isAdmin } from "@/lib/db/services/admin";

export interface AdminAuthResult {
    success: true;
    pubkey: string;
}

export interface AdminAuthError {
    success: false;
    response: NextResponse;
}

/**
 * Extract auth token from request headers
 */
function getAuthToken(request: NextRequest): string | null {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }
    return null;
}

/**
 * Require admin authentication for API routes
 * Returns the admin's pubkey if authenticated, or an error response
 */
export async function requireAdmin(
    request: NextRequest
): Promise<AdminAuthResult | AdminAuthError> {
    // Extract token
    const token = getAuthToken(request);
    if (!token) {
        return {
            success: false,
            response: NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            ),
        };
    }

    // Validate token
    const pubkey = await validateAuthToken(token);
    if (!pubkey) {
        return {
            success: false,
            response: NextResponse.json(
                { error: "Invalid or expired token" },
                { status: 401 }
            ),
        };
    }

    // Check admin status
    const adminStatus = await isAdmin(pubkey);
    if (!adminStatus) {
        return {
            success: false,
            response: NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            ),
        };
    }

    return { success: true, pubkey };
}

/**
 * Require authentication (but not admin) for API routes
 * Returns the user's pubkey if authenticated, or an error response
 */
export async function requireAuth(
    request: NextRequest
): Promise<AdminAuthResult | AdminAuthError> {
    // Extract token
    const token = getAuthToken(request);
    if (!token) {
        return {
            success: false,
            response: NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            ),
        };
    }

    // Validate token
    const pubkey = await validateAuthToken(token);
    if (!pubkey) {
        return {
            success: false,
            response: NextResponse.json(
                { error: "Invalid or expired token" },
                { status: 401 }
            ),
        };
    }

    return { success: true, pubkey };
}
