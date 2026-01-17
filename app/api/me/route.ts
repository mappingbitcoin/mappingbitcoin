import { NextResponse } from "next/server";
import { getSession } from "@/utils/SessionHelper";

export async function GET() {
    const user = await getSession();
    return NextResponse.json(user ?? { error: "Not logged in" }, { status: user?.access_token ? 200 : 401 });
}
