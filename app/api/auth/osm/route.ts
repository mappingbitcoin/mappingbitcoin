import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { serverEnv, isProduction } from "@/lib/Environment";

const AUTH_URL = "https://www.openstreetmap.org/oauth2/authorize";

export async function GET(req: NextRequest) {
    const returnTo = req.nextUrl.searchParams.get("returnTo") || "/";

    // Store return path in a cookie before redirecting to OSM
    (await cookies()).set("returnTo", returnTo, {
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
    });

    return NextResponse.redirect(`${AUTH_URL}?${params.toString()}`);
}
