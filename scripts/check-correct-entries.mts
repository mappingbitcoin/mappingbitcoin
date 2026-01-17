import fs from "fs/promises";
import path from "path";
import {TAG_CATEGORY_MAP} from "../constants/PlaceOsmDictionary";

const VENUES_FILE = path.resolve("data", "BitcoinVenues.json");


(async () => {
    const raw = await fs.readFile(VENUES_FILE, "utf8");
    const venues = JSON.parse(raw);

    const unmatchedTagCounts = new Map<string, number>();
    let unmatchedVenueCount = 0; // ← New counter for completely untagged venues

    for (const venue of venues) {
        if (!venue.tags) continue;

        let matched = false;
        for (const [key, value] of Object.entries(venue.tags)) {
            const tag = `${key}:${value}`;
            if (TAG_CATEGORY_MAP[tag]) {
                matched = true;
                break;
            }
        }

        if (!matched) {
            unmatchedVenueCount++; // ← Count venue as unmatched

            for (const [key, value] of Object.entries(venue.tags)) {
                const skip = [
                    "website", "wikidata", "wikipedia", "wikimedia", "was:", "url", "twitter", "unisex", "verified",
                    "waterway", "whatsapp", "wheelchair", "toilets", "survey", "winter_room", "start_date", "source",
                    "year_of_", "youtube", "unit", "telegram", "telecom", "takeaway", "surrey", "surface", "room",
                    "roof", "ref", "phone", "operator", "opening_hours", "payment", "name", "note", "mobile", "level",
                    "loc_name", "location", "internet_access", "instagram", "image", "fax", "facebook", "email", "contact",
                    "currency", "addr", "check_date"
                ];
                if (skip.some(prefix => key.startsWith(prefix))) continue;

                const tag = `${key}:${value}`;
                if (!TAG_CATEGORY_MAP[tag]) {
                    unmatchedTagCounts.set(tag, (unmatchedTagCounts.get(tag) || 0) + 1);
                }
            }
        }
    }

    const sorted = Array.from(unmatchedTagCounts.entries()).sort((a, b) => a[1] - b[1]);

    sorted.forEach(([tag, count]) => {
        console.log(`${tag} — ${count}`);
    });

    console.log(`\n🧩 Found ${sorted.length} unique uncategorized tags.`);
    console.log(`🚫 ${unmatchedVenueCount} venues have no matched category.\n`);
})();
