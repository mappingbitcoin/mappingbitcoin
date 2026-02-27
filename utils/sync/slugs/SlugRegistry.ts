import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { uploadToStorage, downloadFromStorage, AssetType } from '@/lib/storage';

const REGISTRY_FILE = path.resolve('data', 'slug-registry.json');
const REMOTE_FILENAME = 'slug-registry.json';

export interface SlugRegistryEntry {
    osmId: string;       // e.g. "node/11906646819"
    slug: string;        // e.g. "bitcoin-cafe-paris"
    name: string;        // venue name at time of assignment
    city?: string;
    country?: string;
    assignedAt: string;  // ISO timestamp
}

let _registry: Map<string, SlugRegistryEntry> | null = null;

/**
 * Load the slug registry from local file, downloading from Hetzner if missing locally
 */
export async function loadSlugRegistry(): Promise<Map<string, SlugRegistryEntry>> {
    if (_registry) return _registry;

    if (!fsSync.existsSync(REGISTRY_FILE)) {
        // Try downloading from Hetzner
        try {
            await downloadFromStorage(REMOTE_FILENAME, REGISTRY_FILE, AssetType.VENUES);
            console.log('[SlugRegistry] Downloaded registry from Hetzner storage');
        } catch {
            console.log('[SlugRegistry] No existing registry found, starting fresh');
            _registry = new Map();
            return _registry;
        }
    }

    try {
        const raw = await fs.readFile(REGISTRY_FILE, 'utf8');
        const entries: SlugRegistryEntry[] = JSON.parse(raw);
        _registry = new Map(entries.map(e => [e.osmId, e]));
        console.log(`[SlugRegistry] Loaded ${_registry.size} entries`);
    } catch {
        console.log('[SlugRegistry] Failed to parse registry, starting fresh');
        _registry = new Map();
    }

    return _registry;
}

/**
 * Save the slug registry to local file and upload to Hetzner
 */
export async function saveSlugRegistry(): Promise<void> {
    if (!_registry) return;

    const entries = Array.from(_registry.values());

    // Ensure data directory exists
    const dir = path.dirname(REGISTRY_FILE);
    if (!fsSync.existsSync(dir)) {
        fsSync.mkdirSync(dir, { recursive: true });
    }

    await fs.writeFile(REGISTRY_FILE, JSON.stringify(entries, null, 2), 'utf8');

    try {
        await uploadToStorage(REGISTRY_FILE, REMOTE_FILENAME, AssetType.VENUES);
        console.log(`[SlugRegistry] Saved and uploaded ${entries.length} entries`);
    } catch (err) {
        console.error('[SlugRegistry] Failed to upload to Hetzner:', err);
    }
}

/**
 * Register a slug mapping for an osmId
 */
export async function registerSlug(
    osmId: string,
    slug: string,
    name: string,
    city?: string,
    country?: string
): Promise<void> {
    const registry = await loadSlugRegistry();
    registry.set(osmId, {
        osmId,
        slug,
        name,
        city,
        country,
        assignedAt: new Date().toISOString(),
    });
}

/**
 * Register multiple slugs without saving (for batch operations)
 * Call saveSlugRegistry() after the batch is complete
 */
export async function registerSlugBatch(
    osmId: string,
    slug: string,
    name: string,
    city?: string,
    country?: string
): Promise<void> {
    const registry = await loadSlugRegistry();
    registry.set(osmId, {
        osmId,
        slug,
        name,
        city,
        country,
        assignedAt: new Date().toISOString(),
    });
}

/**
 * Look up a slug for a given osmId
 */
export async function getSlugForOsmId(osmId: string): Promise<string | undefined> {
    const registry = await loadSlugRegistry();
    return registry.get(osmId)?.slug;
}
