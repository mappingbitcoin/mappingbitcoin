import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/utils/SessionHelper";

export async function GET() {
    const user = await getSession();
    if (!user) {
        return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    // Only return non-sensitive fields; never expose access tokens
    const hasOsmAuth = !!(await cookies()).get("osm_token")?.value;

    return NextResponse.json({
        id: user.id,
        display_name: user.display_name,
        image_url: user.image_url,
        hasOsmAuth,
    }, { status: 200 });
}
