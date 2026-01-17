import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createSession(user: any) {
    const secret = process.env.SESSION_SECRET;
    if (!secret) throw new Error("Missing SESSION_SECRET");

    const token = await new SignJWT({ user })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(new TextEncoder().encode(secret));

    (await cookies()).set("session", token, {
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });
}

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");
    if (!code) return NextResponse.redirect(`${BASE_URL}/login?error=missing_code`);

    const tokenRes = await fetch("https://www.openstreetmap.org/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            client_id: process.env.OSM_CLIENT_ID!,
            client_secret: process.env.OSM_CLIENT_SECRET!,
            redirect_uri: process.env.OSM_REDIRECT_URI!,
        }),
    });

    const { access_token } = await tokenRes.json();
    if (!access_token) return NextResponse.redirect(`${BASE_URL}/login?error=invalid_token`);

    const userRes = await fetch("https://api.openstreetmap.org/api/0.6/user/details.json", {
        headers: { Authorization: `Bearer ${access_token}` },
    });

    const data = await userRes.json();
    const user = {
        id: data.user.id,
        display_name: data.user.display_name,
        image_url: data.user.img?.href,
        access_token: access_token,
    };

    await createSession(user);

    const returnTo = (await cookies()).get("returnTo")?.value || "/";
    (await cookies()).delete("returnTo");

    return NextResponse.redirect(`${BASE_URL}${returnTo}`);
}
