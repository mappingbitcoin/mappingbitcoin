export interface Coordinate {
    lon: number;
    lat: number;
}

export function computeMapView(
    coords: Coordinate[],
    width: number,
    height: number,
    paddingRatio = 0.40 // ← 15% padding around
): { longitude: number; latitude: number; zoom: number } {
    if (coords.length === 0) return { longitude: 0, latitude: 0, zoom: 1 };

    const lons = coords.map(c => c.lon);
    const lats = coords.map(c => c.lat);

    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const centerLon = (minLon + maxLon) / 2;
    const centerLat = (minLat + maxLat) / 2;

    const effectiveWidth = width * (1 - paddingRatio);
    const effectiveHeight = height * (1 - paddingRatio);

    const WORLD_DIM = { width: 256, height: 256 };
    const ZOOM_MAX = 15;

    const latFraction = (maxLat - minLat) / 180;
    const lonFraction = (maxLon - minLon) / 360;

    const latZoom = Math.log2(effectiveHeight / WORLD_DIM.height / latFraction);
    const lonZoom = Math.log2(effectiveWidth / WORLD_DIM.width / lonFraction);
    const zoom = Math.min(latZoom, lonZoom, ZOOM_MAX);

    return {
        longitude: centerLon,
        latitude: centerLat,
        zoom: Math.max(zoom, 1),
    };
}

