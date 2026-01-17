import path from 'path';
import fs from 'fs/promises';
import { mkdirSync, existsSync } from 'fs';
import zlib from 'zlib';
import { uploadToSpaces, downloadFromSpaces } from '@/utils/DigitalOceanSpacesHelper';

const DATA_DIR = path.resolve('data');
const STATE_FILE = path.join(DATA_DIR, 'osm-replication.state');
const REMOTE_STATE_URL = 'https://planet.openstreetmap.org/replication/minute/state.txt';
const DEFAULT_TIMEOUT_MS = 30000;

mkdirSync(DATA_DIR, { recursive: true });

// Helper: Fetch with timeout
async function fetchWithTimeout(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, { signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
}

export async function initOsmReplicationState() {
    if (!existsSync(STATE_FILE)) {
        try {
            console.log('📦 osm-replication.state not found. Downloading from Spaces...');
            await downloadFromSpaces('osm-replication.state', STATE_FILE);
        } catch (err) {
            console.warn('⚠️ Could not download osm-replication.state from Spaces:', err);
        }
    }
}

export async function getLastState(): Promise<number> {
    try {
        const raw = await fs.readFile(STATE_FILE, 'utf-8');
        const { sequenceNumber } = JSON.parse(raw);
        return sequenceNumber;
    } catch {
        return 0;
    }
}

export async function updateState(sequenceNumber: number): Promise<void> {
    const timestamp = new Date().toISOString();
    const content = JSON.stringify({ sequenceNumber, timestamp }, null, 2);
    await fs.writeFile(STATE_FILE, content);

    try {
        await uploadToSpaces(STATE_FILE, 'osm-replication.state');
    } catch (err) {
        console.warn('⚠️ Failed to upload osm-replication.state to Spaces:', err);
    }
}

export async function downloadOscFile(sequence: number): Promise<{ path: string; gzPath: string; timestamp: string; sequence: number }> {
    const padded = String(sequence).padStart(9, '0');
    const pathParts = [padded.slice(0, 3), padded.slice(3, 6), padded.slice(6)];
    const url = `https://planet.openstreetmap.org/replication/minute/${pathParts.join('/')}.osc.gz`;
    const stateUrl = `https://planet.openstreetmap.org/replication/minute/${pathParts.join('/')}.state.txt`;

    try {
        // 1. Fetch the .osc.gz diff file first
        const res = await fetchWithTimeout(url);
        if (!res.ok) throw new Error(`Failed to fetch .osc.gz: ${res.statusText}`);

        const buffer = await res.arrayBuffer();
        const gzPath = path.join(DATA_DIR, `diff-${sequence}.osc.gz`);
        const oscPath = gzPath.replace(/\.gz$/, '');

        await fs.writeFile(gzPath, Buffer.from(buffer));
        const gzData = await fs.readFile(gzPath);
        const decompressed = zlib.gunzipSync(gzData);
        await fs.writeFile(oscPath, decompressed);

        // 2. Optional small delay before fetching state
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

        // 3. Fetch the .state.txt metadata
        const stateRes = await fetchWithTimeout(stateUrl);
        if (!stateRes.ok) throw new Error(`Failed to fetch .state.txt: ${stateRes.statusText}`);

        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

        const timestampLine = (await stateRes.text()).split('\n').find(line => line.startsWith('timestamp='));
        const timestamp = timestampLine ? timestampLine.replace('timestamp=', '') : new Date().toISOString();

        return { path: oscPath, gzPath, timestamp, sequence };
    } catch (err) {
        console.warn(`[${new Date().toISOString()}] ❌ Failed to fetch sequence #${sequence}:`, err);
        throw err;
    }
}

export async function getRemoteState(): Promise<number> {
    const url = `${REMOTE_STATE_URL}?_=${Date.now()}`;
    const res = await fetchWithTimeout(url);

    if (!res.ok) throw new Error(`Failed to fetch remote state: ${res.statusText}`);

    const text = await res.text();
    const match = text.match(/sequenceNumber=(\d+)/);
    if (!match) throw new Error('sequenceNumber not found in remote state');

    return parseInt(match[1], 10);
}

export async function getMissingSequences(): Promise<number[]> {
    const local = await getLastState();
    const remote = await getRemoteState();
    console.log(`🔎 Local sequence: ${local}, Remote sequence: ${remote}`);

    const missing: number[] = [];
    for (let seq = local + 1; seq <= remote; seq++) {
        missing.push(seq);
    }
    return missing;
}

export async function processAllMissingDiffsSequentially(
    handler: (sequence: number, oscPath: string, timestamp: string) => Promise<void>
): Promise<void> {
    const missing = (await getMissingSequences()).slice(0, 40);

    for (const seq of missing) {
        let gzPath: string | undefined;
        let oscPath: string | undefined;
        try {
            const { path: filePath, gzPath: gz, timestamp, sequence } = await downloadOscFile(seq);
            gzPath = gz;
            oscPath = filePath;
            console.log(`✅ [${new Date().toISOString()}] Processed and decompressed diff #${sequence}`);
            await handler(sequence, oscPath, timestamp);
            await updateState(sequence);
        } catch (err) {
            console.error(`❌ [${new Date().toISOString()}] Failed to process diff #${seq}:`, err);
            throw err;
        } finally {
            for (const file of [gzPath, oscPath]) {
                if (file) {
                    try {
                        await fs.unlink(file);
                    } catch {
                        console.warn(`⚠️ Could not delete temp file: ${file}`);
                    }
                }
            }
        }
    }
}
