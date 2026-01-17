import fs from 'fs/promises';
import { Ollama } from 'ollama';
import { CATEGORY_TYPE_MAP } from './categories.js';

let liveResults = null;   // will point to the in-memory results array

process.on('SIGINT', async () => {        // handles ⌃C or kill -INT
    if (liveResults) {
        try {
            await fs.writeFile('./classified_tags.json',
                JSON.stringify(liveResults, null, 2),
                'utf-8');
            console.log('\n💾 Backup written before exit.');
        } catch (e) {
            console.error('⚠️  Failed final backup:', e);
        }
    }
    process.exit();
});


const VALID_CATEGORIES = Object.values(CATEGORY_TYPE_MAP).flat();
const ollama = new Ollama({ host: 'http://100.89.78.64:11434' });

const SYSTEM_PROMPT = `I will provide JSON data describing a venue.
Your task is to analyze the information and return the most accurate category from the following list:

[
    ${VALID_CATEGORIES.map(p => `'${p}'`).join(', ')}
]

Respond strictly in this format:
{category: "matched_category"}

If there is no clear or relevant match, respond with:
{category: null}

Do not explain. Do not ask questions. Just return the result.`;

const classifyVenue = async (venue) => {
    const osmTags = venue?.osm_json?.tags || {};
    // ⏱️ START TIMER  ───────────────────────────────────────────
    const t0 = Date.now();
    const internalTags = venue?.tags || {};

    const userPrompt = `OSM tags:\n${JSON.stringify(osmTags, null, 2)}\n\nInternal tags:\n${JSON.stringify(internalTags, null, 2)}`;

    const res = await ollama.chat({
        model: 'gemma3:12b',
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
        ]
    });
    // ⏱️ STOP TIMER & REPORT  ──────────────────────────────────
    const elapsed = Date.now() - t0;          // milliseconds
    console.log(`⏱️  ${venue.id} took ${elapsed} ms`);
    let category = null;

    try {
        const raw = res.message.content.trim();
        // Make sure it's valid JSON (wrap keys and use double quotes)
        const fixedJson = raw
            .replace(/^{\s*(\w+):/, '{"$1":')   // First key
            .replace(/,\s*(\w+):/g, ',"$1":')   // Any subsequent keys
            .replace(/'/g, '"');                // Replace single quotes with double

        const parsed = JSON.parse(fixedJson);

        if (parsed && typeof parsed === 'object' && 'category' in parsed) {
            if (VALID_CATEGORIES.includes(parsed.category)) {
                category = parsed.category;
            }
        }
    } catch (err) {
        console.error("⚠️ Failed to parse LLM output:", res.message.content);
        console.error("Error:", err);
    }

    if (!category) return null;
    const categoryGroup = Object.keys(CATEGORY_TYPE_MAP).find(g => CATEGORY_TYPE_MAP[g].includes(category));
    return { id: venue.id, category, type: categoryGroup };

};

const loadBackup = async (path) => {
    try {
        const data = await fs.readFile(path, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
};

const saveBackup = async (data, path) => {
    await fs.writeFile(path, JSON.stringify(data, null, 2), 'utf-8');
};

const main = async () => {
    const inputPath = './map/venues.json';
    const outputPath = './classified_tags.json';

    const allVenues = JSON.parse(await fs.readFile(inputPath, 'utf-8'));
    const existing = await loadBackup(outputPath);
    const deduped = Array.from(existing.reduce((m, r) => m.set(r.id, r), new Map()).values());
    if (deduped.length !== existing.length) await saveBackup(deduped, outputPath);
    const processedIds = new Set(deduped.map(r => r.id));

    const venuesToProcess = allVenues.filter(v => !processedIds.has(v.id)).slice(0, 10);
    const results = [...existing];
    liveResults = results;   // expose to the SIGINT handler
    for (const venue of venuesToProcess) {
        console.log(`Classifying ${venue.id}...`);
        const result = await classifyVenue(venue);
        if (!result) {console.warn(`⚠️  ${venue.id} not classified — will retry next run.`);continue;}
        processedIds.add(result.id);
        results.push(result);
        await saveBackup(results, outputPath);  // Auto-save after each
    }
    console.log(`✅ Done. Total processed: ${results.length}`);
};

main();
