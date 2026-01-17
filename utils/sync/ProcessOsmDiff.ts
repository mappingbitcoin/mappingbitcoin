import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';
import { OsmChangeEntry, OverpassElement } from '@/models/Overpass';
import { readVenueCache, writeVenueCache } from '@/utils/sync/CacheBitcoinVenues';
import { processAllMissingDiffsSequentially } from './ReplicationFetcher';

function sanitizeTags(tags: Record<string, string>): Record<string, string> {
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(tags)) {
        clean[k] = v.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim(); // remove control chars
    }
    return clean;
}
export async function processOsmDiffs() {
    await processAllMissingDiffsSequentially(async (sequence, oscPath, timestamp) => {
        const changes = parseOsmDiffFile(oscPath);

        const existing = readVenueCache();
        const byId = new Map<number, OverpassElement>(existing.map(v => [v.id, v]));

        let createdCount = 0;
        let modifiedCount = 0;
        let removedCount = 0;

        const logEntries: string[] = [];
        const queueEntries: OverpassElement[] = [];

        [...changes.created, ...changes.modified].forEach(entry => {
            const id = Number(entry.id);
            const prev = byId.get(id);
            const existingTags = prev?.tags || {};
            const newTags = entry.tags;

            const hasChanged =
                !prev ||
                prev.lat !== entry.lat ||
                prev.lon !== entry.lon ||
                JSON.stringify(existingTags) !== JSON.stringify(newTags);

            if (hasChanged) {
                const enriched: OverpassElement = {
                    id,
                    type: 'node',
                    lat: entry.lat ?? prev?.lat ?? 0,
                    lon: entry.lon ?? prev?.lon ?? 0,
                    tags: sanitizeTags(entry.tags),
                };

                byId.set(id, enriched);
                queueEntries.push(enriched);

                if (!prev) {
                    createdCount++;
                    logEntries.push(`- CREATED - ${id}: ${JSON.stringify(entry.tags)}`);
                } else {
                    modifiedCount++;
                    logEntries.push(`- MODIFIED ${id}: ${JSON.stringify(entry.tags)}`);
                }
            }
        });

        [...changes.deleted, ...changes.unqualifiedModified].forEach(entry => {
            const id = Number(entry.id);
            if (byId.has(id)) {
                byId.delete(id);
                removedCount++;
                logEntries.push(`- REMOVED ${id}`);
            }
        });

        if (createdCount || modifiedCount || removedCount) {
            console.log(`🛰️  Diff #${sequence}`);
            if (createdCount > 0) console.log(`➕ Created in cache: ${createdCount}`);
            if (modifiedCount > 0) console.log(`🔁 Modified in cache: ${modifiedCount}`);
            if (removedCount > 0) console.log(`🗑️ Removed from cache: ${removedCount}`);
            await writeVenueCache(Array.from(byId.values()));

            // Append to enrichment queue
            await appendToGeoQueue(queueEntries, sequence);

            // Write logs to file
            const parsed = Date.parse(timestamp);
            const date = isNaN(parsed) ? new Date() : new Date(parsed);
            const year = String(date.getFullYear());
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const logPath = path.join('data', 'logs', `${year}`, `${month}`);
            const logFile = path.join(logPath, `${day}.log`);
            fs.mkdirSync(logPath, { recursive: true });
            fs.appendFileSync(logFile, `=== Diff #${sequence} ===\n${logEntries.join('\n')}\n`);
        }
    });
}

async function appendToGeoQueue(newEntries: OverpassElement[], sequence: number) {
    if (!newEntries.length) return;

    const filename = `geo-enrichment-${sequence}.json`;
    const filePath = path.resolve("data", "queues", filename);

    await fsp.mkdir(path.dirname(filePath), { recursive: true });
    await fsp.writeFile(filePath, JSON.stringify(newEntries, null, 2), "utf8");
    console.log(`📥 Created enrichment batch: ${filename} (${newEntries.length} entries)`);
}

function parseOsmDiffFile(filepath: string): {
    created: OsmChangeEntry[];
    modified: OsmChangeEntry[];
    deleted: OsmChangeEntry[];
    unqualifiedModified: OsmChangeEntry[];
} {
    const raw = fs.readFileSync(filepath, 'utf-8');
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(raw);

    const changes = {
        created: [] as OsmChangeEntry[],
        modified: [] as OsmChangeEntry[],
        deleted: [] as OsmChangeEntry[],
        unqualifiedModified: [] as OsmChangeEntry[],
    };

    if (!parsed.osmChange) return changes;

    for (const section of ['create', 'modify', 'delete'] as const) {
        let records = parsed.osmChange[section];
        if (!records) continue;

        if (!Array.isArray(records)) records = [records]

        for (const record of records) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let entries: any[] = []

            if (record.node) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (Array.isArray(record.node)) entries = entries.concat(record.node.map((el: any) => ({ ...el, type: 'node' })))
                else entries.push({ ...record.node, type: 'node' })
            }
            if (record.way) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (Array.isArray(record.way)) entries = entries.concat(record.way.map((el: any) => ({ ...el, type: 'way' })))
                else entries.push({ ...record.way, type: 'way' })
            }
            if (record.relation) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (Array.isArray(record.relation)) entries = entries.concat(record.relation.map((el: any) => ({ ...el, type: 'relation' })))
                else entries.push({ ...record.relation, type: 'relation' })
            }

            for (let i = 0; i < entries.length; i++) {
                const information = entries[i]

                const id = information['@_id'];
                const lat = information['@_lat'] ? parseFloat(information['@_lat']) : undefined;
                const lon = information['@_lon'] ? parseFloat(information['@_lon']) : undefined;
                if (section !== 'delete' && (!id || !lat || !lon)) continue;

                const tags: Record<string, string> = {};
                if (information.tag) {
                    const informationTags = Array.isArray(information.tag) ? information.tag : [information.tag]
                    for (const t of informationTags) {
                        if (t?.['@_k'] && t?.['@_v']) tags[t['@_k']] = t['@_v'];
                    }
                }

                const item: OsmChangeEntry = { id, lat, lon, tags, type: information.type };

                if (section === 'delete') {
                    changes.deleted.push(item);
                } else if (section === 'modify') {
                    if (isBitcoinTagged(tags)) {
                        changes.modified.push(item);
                    } else if (tags) {
                        changes.unqualifiedModified.push(item);
                    }
                } else if (section === 'create') {
                    if (isBitcoinTagged(tags)) {
                        changes.created.push(item);
                    }
                }
            }
        }
    }

    return changes;
}

function isBitcoinTagged(tags: Record<string, string>): boolean {
    return (
        tags['payment:bitcoin'] === 'yes' ||
        tags['payment:lightning'] === 'yes' ||
        tags['currency:XBT'] === 'yes' ||
        tags['bitcoin'] === 'yes'
    );
}
