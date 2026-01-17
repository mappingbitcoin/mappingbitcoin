import path from "path";
import fs from "fs";
import {VenueSlugEntrySEO} from "@/models/VenueSlug";

type SlugsCache = Record<string, VenueSlugEntrySEO>;

let _cache: SlugsCache | null = null;

export function getSlugsCache() {
    if (_cache) return _cache

    const SLUGS_FILE = path.resolve(process.cwd(), "data", "venue_slug_map.json");
    const raw = fs.readFileSync(SLUGS_FILE, "utf8");
    _cache = JSON.parse(raw);
    return _cache
}

export function refreshSlugsCache(): void {
    _cache = null;
    getSlugsCache();
}

