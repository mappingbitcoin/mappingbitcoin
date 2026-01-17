import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET);

export async function getSession(): Promise<null | {
    id: string;
    display_name: string;
    image_url?: string;
    access_token: string;
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
