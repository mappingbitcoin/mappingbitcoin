import path from "path";
import fs from "fs/promises";
import {VenueSlugEntrySEO} from "@/models/VenueSlug";

type SlugsCache = Record<string, VenueSlugEntrySEO>;

let _cache: SlugsCache | null = null;

export async function getSlugsCache(): Promise<SlugsCache | null> {
    if (_cache) return _cache

    const SLUGS_FILE = path.resolve(process.cwd(), "data", "venue_slug_map.json");
    const raw = await fs.readFile(SLUGS_FILE, "utf8");
    _cache = JSON.parse(raw);
    return _cache
}

export async function refreshSlugsCache(): Promise<void> {
    _cache = null;
    await getSlugsCache();
}

