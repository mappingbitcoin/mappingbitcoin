import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

const ENRICHED_FILE = path.resolve("data", "EnrichedVenues.json");
const SOURCE_FILE = path.resolve("data", "BitcoinVenues.json");

export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { searchParams } = new URL(request.url);
        const source = searchParams.get("source") || "enriched";

        const filePath = source === "raw" ? SOURCE_FILE : ENRICHED_FILE;
        const fileName = source === "raw" ? "BitcoinVenues.json" : "EnrichedVenues.json";

        if (!fsSync.existsSync(filePath)) {
            return NextResponse.json(
                { error: `File ${fileName} not found` },
                { status: 404 }
            );
        }

        const stat = await fs.stat(filePath);
        const raw = await fs.readFile(filePath, "utf8");
        const venues = JSON.parse(raw);

        return NextResponse.json({
            success: true,
            source: fileName,
            count: venues.length,
            lastModified: stat.mtime.toISOString(),
            venues,
        });
    } catch (error) {
        console.error("[Database API] Error:", error);
        return NextResponse.json(
            { error: "Failed to load venue data" },
            { status: 500 }
        );
    }
}
