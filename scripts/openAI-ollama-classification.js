// classify.js
// -----------------------------------------------------------------------------
// Classify Bitcoin venues into a predefined category set using either an
// Ollama-served local model or the OpenAI API. Results are appended to
// classified_tags.json and checkpointed on Ctrl-C.
//
// Usage: LLM_PROVIDER=openai node classify.js
//        # or just: node classify.js  (defaults to ollama)
//
// Prereqs: npm i ollama openai
// -----------------------------------------------------------------------------


import fs from 'fs/promises';
import path from 'path';
import { Ollama } from 'ollama';
import OpenAI from 'openai';
import { CATEGORY_TYPE_MAP } from './categories.js';      // your own map


// ── Config ────────────────────────────────────────────────────────────────────
const VENUES_FILE = path.resolve('..', 'data', 'BitcoinVenues.json');  // if it's outside scripts/
const OUTPUT_FILE = path.resolve('classified_tags.json');         // output
const MODEL_PROVIDER = process.env.LLM_PROVIDER || 'ollama';      // 'ollama' | 'openai'
const MAX_VENUES   = 10;  // batch size per run
const OLLAMA_HOST  = 'http://100.89.78.64:11434';                    // adjust if needed

// Show banner early and perform provider-specific sanity checks
console.log(`▶️  LLM provider: ${MODEL_PROVIDER}`);
if (MODEL_PROVIDER === 'openai' && !process.env.OPENAI_API_KEY) {
    throw new Error(
        'OPENAI_API_KEY environment variable is required when LLM_PROVIDER="openai".'
    );
}

// ── LLM clients ───────────────────────────────────────────────────────────────
const ollama = new Ollama({ host: OLLAMA_HOST });
let   openai;  // lazily instantiated only if needed


// ── Prompt scaffolding ────────────────────────────────────────────────────────
const VALID_CATEGORIES = Object.values(CATEGORY_TYPE_MAP).flat();

const SYSTEM_PROMPT = `I will provide JSON data describing a venue.
Your task is to analyze the information and return the most accurate category from the following list:

[
  ${VALID_CATEGORIES.map((p) => `'${p}'`).join(', ')}
]

Respond strictly in this format:
{category: "matched_category"}

If there is no clear or relevant match, respond with:
{category: null}

Do not explain. Do not ask questions. Just return the result.`;

// ── Graceful SIGINT backup ────────────────────────────────────────────────────
let liveResults = null;   // pointer to in-memory results
process.on('SIGINT', async () => {
    if (liveResults) {
        try {
            await fs.writeFile(OUTPUT_FILE, JSON.stringify(liveResults, null, 2), 'utf-8');
            console.log('\n💾 Backup written before exit.');
        } catch (e) {
            console.error('⚠️  Failed final backup:', e);
        }
    }
    process.exit();
});

// ── Helper: LLM call + response parsing ──────────────────────────────────────
async function classifyVenue(venue) {
    const osmTags      = venue?.osm_json?.tags ?? {};
    const internalTags = venue?.tags ?? {};

    const userPrompt = `OSM tags:\n${JSON.stringify(osmTags,    null, 2)}\n\n` +
        `Internal tags:\n${JSON.stringify(internalTags, null, 2)}`;

    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userPrompt  }
    ];

    const t0 = Date.now();
    let res;
    try {
        if (MODEL_PROVIDER === 'openai') {
            if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            res = await openai.chat.completions.create({
                model: 'gpt-4o-mini',        // cheaper + JSON-ish output is fine
                messages,
                temperature: 0
            });
        } else {
            res = await ollama.chat({
                model: 'gemma3:12b',
                messages
            });
        }
    } catch (e) {
        console.error(`❌ Error querying ${MODEL_PROVIDER}:`, e.message);
        return null;  // let caller retry next run
    }
    console.log(`⏱️  ${venue.id} took ${Date.now() - t0} ms`);

    // Extract the raw string content
    const raw = MODEL_PROVIDER === 'openai'
        ? res.choices[0].message.content.trim()
        : res.message.content.trim();

    // Repair common JSON quirks (unquoted keys, single quotes, etc.)
    try {
        const fixedJson = raw
            .trim()
            .replace(/^{\s*([a-zA-Z0-9_]+)\s*:/, '{"$1":')
            .replace(/,\s*([a-zA-Z0-9_]+)\s*:/g, ',"$1":')
            .replace(/'/g, '"');

        const parsed = JSON.parse(fixedJson);

        // Accept null OR any valid category
        if (
            parsed &&
            typeof parsed === 'object' &&
            'category' in parsed &&
            (parsed.category === null || VALID_CATEGORIES.includes(parsed.category))
        ) {
            const group = Object.keys(CATEGORY_TYPE_MAP)
                .find((g) => CATEGORY_TYPE_MAP[g].includes(parsed.category));
            return { id: venue.id, category: parsed.category, type: group };
        }

        console.warn(`⚠️  Invalid category received: ${parsed.category}`);
    } catch (err) {
        console.error('⚠️  Failed to parse LLM output:', raw);
        console.error('Error:', err);
    }
    return null; // classifyVenue failed
}

// ── Helpers: load / save backup files ─────────────────────────────────────────
async function loadBackup(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

async function saveBackup(data, filePath) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ── Main pipeline ────────────────────────────────────────────────────────────
async function main() {
    // 1. Read full venue list + prior classifications
    const allVenues = JSON.parse(await fs.readFile(VENUES_FILE, 'utf-8'));
    const existing  = await loadBackup(OUTPUT_FILE);

    // 2. De-dupe any accidental repeats in the backup
    const deduped = Array.from(
        existing.reduce((m, r) => m.set(r.id, r), new Map()).values()
    );
    if (deduped.length !== existing.length) await saveBackup(deduped, OUTPUT_FILE);

    const processedIds   = new Set(deduped.map((r) => r.id));
    const venuesToProcess = allVenues
        .filter((v) => !processedIds.has(v.id))
        .slice(0, MAX_VENUES);

    const results = [...deduped];
    liveResults   = results;   // for SIGINT backup

    // 3. Classify serially, checkpointing after each success
    for (const venue of venuesToProcess) {
        console.log(`🔍 Classifying ${venue.id} ...`);
        const result = await classifyVenue(venue);

        if (!result) {
            console.warn(`⚠️  ${venue.id} not classified — will retry next run.`);
            continue;
        }
        processedIds.add(result.id);
        results.push(result);
        await saveBackup(results, OUTPUT_FILE);  // incremental backup
    }

    console.log(`✅ Done. Total processed: ${results.length}`);
}

main().catch((e) => {
    console.error('Unhandled error:', e);
    process.exit(1);
});
