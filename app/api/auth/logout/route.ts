import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function GET() {
    (await cookies()).set("session", "", { path: "/", maxAge: 0 });
    return NextResponse.redirect(`${BASE_URL}`);
}
