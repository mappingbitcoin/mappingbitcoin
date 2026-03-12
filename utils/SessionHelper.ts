import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { serverEnv } from "@/lib/Environment";

const secret = new TextEncoder().encode(serverEnv.sessionSecret);

export async function getSession(): Promise<null | {
    id: string;
    display_name: string;
    image_url?: string;
}> {
    const sessionCookie = (await cookies()).get("session")?.value;
    if (!sessionCookie) return null;

    try {
        const { payload } = await jwtVerify(sessionCookie, secret);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return payload.user as any;
    } catch {
        return null;
    }
}

/**
 * Read the OSM access token from the dedicated httpOnly cookie.
 * This token is stored separately from the JWT session to avoid exposure.
 */
export async function getOsmToken(): Promise<string | null> {
    const token = (await cookies()).get("osm_token")?.value;
    return token || null;
}
