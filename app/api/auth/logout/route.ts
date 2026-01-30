import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { publicEnv } from "@/lib/Environment";

export async function GET() {
    (await cookies()).set("session", "", { path: "/", maxAge: 0 });
    return NextResponse.redirect(publicEnv.siteUrl);
}
