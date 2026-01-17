import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const AUTH_URL = "https://www.openstreetmap.org/oauth2/authorize";

export async function GET(req: NextRequest) {
    const returnTo = req.nextUrl.searchParams.get("returnTo") || "/";

    // Store return path in a cookie before redirecting to OSM
    (await cookies()).set("returnTo", returnTo, {
        path: "/",
        maxAge: 300, // 5 minutes
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });

    const params = new URLSearchParams({
        client_id: process.env.OSM_CLIENT_ID!,
        redirect_uri: process.env.OSM_REDIRECT_URI!,
        response_type: "code",
        scope: "read_prefs write_api",
    });

    return NextResponse.redirect(`${AUTH_URL}?${params.toString()}`);
}
