import { BBox } from "geojson";
import { TileCluster } from "@/models/TileCluster";

const DB_NAME = 'ClusterCacheDB';
const DB_STORE = 'tiles';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(DB_STORE)) {
                db.createObjectStore(DB_STORE);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getTileKey(z: number, x: number, y: number): string {
    return `${z}/${x}/${y}`;
}

function getTileKeysInBBox(z: number, bbox: BBox): string[] {
    const [minLng, minLat, maxLng, maxLat] = bbox;
    const tileKeys: string[] = [];

    const xStart = Math.floor(((minLng + 180) / 360) * Math.pow(2, z));
    const xEnd = Math.floor(((maxLng + 180) / 360) * Math.pow(2, z));
    const yStart = Math.floor(
        ((1 - Math.log(Math.tan((maxLat * Math.PI) / 180) + 1 / Math.cos((maxLat * Math.PI) / 180)) / Math.PI) / 2) * Math.pow(2, z)
    );
    const yEnd = Math.floor(
        ((1 - Math.log(Math.tan((minLat * Math.PI) / 180) + 1 / Math.cos((minLat * Math.PI) / 180)) / Math.PI) / 2) * Math.pow(2, z)
    );

    for (let x = xStart; x <= xEnd; x++) {
        for (let y = yStart; y <= yEnd; y++) {
            tileKeys.push(getTileKey(z, x, y));
        }
    }

    return tileKeys;
}

async function readTileFromDB(tileKey: string): Promise<TileCluster[] | null> {
    const db = await openDB();
    return new Promise((resolve) => {
        const tx = db.transaction(DB_STORE, 'readonly');
        const store = tx.objectStore(DB_STORE);
        const req = store.get(tileKey);

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
    });
}

export async function loadClustersFromCache(z: number, bbox: BBox) {
    const tileKeys = getTileKeysInBBox(z, bbox);
    const seenIds = new Set<number>();
    const clusters: TileCluster[] = [];
    const relevantCategories: Record<string, number> = {};
    const relevantSubcategories: Record<string, number> = {};

    for (const tileKey of tileKeys) {
        const cached = await readTileFromDB(tileKey);
        if (!cached) continue;

        for (const cluster of cached) {
            const newVenues = cluster.venues.filter(v => !seenIds.has(v.id));
            newVenues.forEach(v => seenIds.add(v.id));

            const adjustedCluster = {
                ...cluster,
                venues: newVenues.length > 0 ? newVenues : cluster.venues
            };

            clusters.push(adjustedCluster);

            for (const [cat, count] of Object.entries(cluster.categories)) {
                relevantCategories[cat] = (relevantCategories[cat] || 0) + count;
            }
            for (const [subcat, count] of Object.entries(cluster.subcategories)) {
                relevantSubcategories[subcat] = (relevantSubcategories[subcat] || 0) + count;
            }
        }
    }

    return {
        clusters,
        relevantCategories,
        relevantSubcategories,
    };
}

export async function updateClusterCache(grouped: Record<string, TileCluster[]>) {
    const db = await openDB();
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);

    for (const [tileKey, clusterList] of Object.entries(grouped)) {
        store.put(clusterList, tileKey);
    }

    return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}
