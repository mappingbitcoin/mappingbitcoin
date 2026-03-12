import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { serverEnv, isProduction } from "@/lib/Environment";

const AUTH_URL = "https://www.openstreetmap.org/oauth2/authorize";

export async function GET(req: NextRequest) {
    const returnTo = req.nextUrl.searchParams.get("returnTo") || "/";

    // Generate a random state parameter to prevent CSRF attacks
    const state = crypto.randomUUID();

    // Store return path in a cookie before redirecting to OSM
    (await cookies()).set("returnTo", returnTo, {
        path: "/",
        maxAge: 300, // 5 minutes
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
    });

    // Store state in an httpOnly cookie for validation in the callback
    (await cookies()).set("oauth_state", state, {
        path: "/",
        maxAge: 300, // 5 minutes
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
    });

    const params = new URLSearchParams({
        client_id: serverEnv.osm.clientId,
        redirect_uri: serverEnv.osm.redirectUri,
        response_type: "code",
        scope: "read_prefs write_api",
        state,
    });

    return NextResponse.redirect(`${AUTH_URL}?${params.toString()}`);
}
