"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { MapRef } from "react-map-gl/maplibre";
import { Map as MapGL, MapMouseEvent } from "react-map-gl/maplibre";
import {AttributionControl, GeoJSONSource} from 'maplibre-gl';
import {useState, useMemo, useCallback, useRef, useEffect, useLayoutEffect} from "react";
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useDebouncedEffect } from "@/hooks/useDebouncedEffect";
import ClusterTooltip from "@/app/[locale]/map/ClusterTooltip";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { useGeolocation } from "@/hooks/useGeolocation";
import { PlaceSidebar } from "@/components/place";
import {Metadata} from "next";
import {useLocale, useTranslations} from "next-intl";
import {Locale} from "@/i18n/types";
import {getSubcategoryLabel, matchPlaceSubcategory} from "@/constants/PlaceCategories";
import {EnrichedVenue} from "@/models/Overpass";
import {PLACE_SUBTYPE_ICON} from "@/constants/CategoryIcons";
import {ViewState} from "react-map-gl";
import {AutocompleteResult} from "@/models/Search";
import type {Feature, Point} from 'geojson';
import { useSearchParams } from 'next/navigation';
import {TileCluster} from "@/models/TileCluster";
import {loadClustersFromCache, updateClusterCache} from "@/utils/ClusterCacheHelper";
import {getFormattedAddress} from "@/utils/AddressUtils";
import MapFAQ from "@/app/[locale]/map/MapFAQ";
import { SunIcon, MoonIcon } from "@/assets/icons/ui";
import Button from "@/components/ui/Button";

function tile2lon(x: number, z: number) {
    return (x / 2 ** z) * 360 - 180;
}
function tile2lat(y: number, z: number) {
    const n = Math.PI - (2 * Math.PI * y) / 2 ** z;
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

const DEFAULT_VIEW_STATE = {
    latitude: 0,
    longitude: 0,
    zoom: 4,
};

const RESET_CATEGORIES = {}

// Available map styles
type MapStyleKey = 'dark' | 'light';
const MAP_STYLES: Record<MapStyleKey, { url: string; label: string }> = {
    dark: {
        url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        label: 'Dark',
    },
    light: {
        url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        label: 'Light',
    },
};

const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;

const MapPage = ({metadata}: {metadata: Metadata}) => {
    const searchParams = useSearchParams();

    const initialViewState = useMemo(() => {
        const lat = parseFloat(searchParams.get('lat') ?? '');
        const lon = parseFloat(searchParams.get('lon') ?? '');
        const zoom = parseFloat(searchParams.get('zoom') ?? '');

        if (!isNaN(lat) && !isNaN(lon) && !isNaN(zoom)) {
            return {
                latitude: lat,
                longitude: lon,
                zoom: zoom >= 16 ? 15 : zoom,
            };
        }

        return DEFAULT_VIEW_STATE;
    }, [searchParams]);

    const hasInitialLocation = useMemo(() => {
        return searchParams.has('lat') && searchParams.has('lon') && searchParams.has('zoom');
    }, [searchParams]);

    const initialVenueSlug = useMemo(() => {
        return searchParams.get('venue') || null;
    }, [searchParams]);

    const t = useTranslations('map')
    const locale = useLocale() as Locale
    const categorySelectorRef = useRef(null);
    const categoryDropdownRef = useRef(null);
    const attributionControlRef = useRef<AttributionControl | null>(null);
    const [lastSyncTime, setLastSyncTime] = useState('')
    const [showDropdown, setShowDropdown] = useState(false)
    const [mapReady, setMapReady] = useState(false);
    const mapRef = useRef<MapRef>(null);
    const [locationDenied, setLocationDenied] = useState(false);
    const selectedVenueDivRef = useRef<HTMLDivElement>(null);
    const [isLocationFetch, setIsLocationFetch] = useState(false)
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [viewState, setViewState] = useState<ViewState>(initialViewState);
    const [geoViewState, setGeoViewState] = useState<ViewState>();
    const [clusters, setClusters] = useState<TileCluster[]>([]);
    const [filteredClusters, setFilteredClusters] = useState<TileCluster[]>([]);
    const [autocompleteResults, setAutocompleteResults] = useState<AutocompleteResult[]>([]);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; latitude: number; longitude: number; content: EnrichedVenue[] | Record<string, number> } | null>(null);
    const [selectedVenue, setSelectedVenue] = useState<EnrichedVenue | null>(null);
    const [query, setQuery] = useState("");
    const [filteredCategories, setFilteredCategories] = useState<Record<string, boolean>>(RESET_CATEGORIES);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [isHoveringTooltip, setIsHoveringTooltip] = useState(false);
    const [relevantSubcategories, setRelevantSubcategories] = useState<Record<string, number>>()
    const [mapStyle, setMapStyle] = useState<MapStyleKey>('dark');
    const [tooltipHeight, setTooltipHeight] = useState(0);

    // Clear attribution control ref when map style changes (map will remount)
    useEffect(() => {
        attributionControlRef.current = null;
    }, [mapStyle]);
    const [disableSearch, setDisableSearch] = useState(false);
    const [showHelpPopup, setShowHelpPopup] = useState(false);

    useLayoutEffect(() => {
        if (tooltipRef.current) {
            setTooltipHeight(tooltipRef.current.offsetHeight || 0);
        }
    }, [tooltip]);

    useEffect(() => {
        const stored = localStorage.getItem("locationDenied");
        if (stored === "true") {
            setLocationDenied(true);
        }
    }, []);

    // check resize event to prevent map from having scroll
    useEffect(() => {
        const setVh = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        setVh();
        window.addEventListener('resize', setVh);
        return () => window.removeEventListener('resize', setVh);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const map = mapRef.current?.getMap?.();
            if (map && map.isStyleLoaded()) {
                console.log("✅ Map is fully ready");
                setMapReady(true);
                clearInterval(interval);
            }
        }, 100);

        return () => clearInterval(interval);
    }, []);

    // Fetch and select venue from URL param when map is ready
    useEffect(() => {
        if (!mapReady || !initialVenueSlug || selectedVenue) return;

        const fetchVenue = async () => {
            try {
                const res = await fetch(`/api/places/${initialVenueSlug}`);
                if (res.ok) {
                    const venue: EnrichedVenue = await res.json();
                    setSelectedVenue(venue);
                }
            } catch (error) {
                console.error('Failed to fetch venue:', error);
            }
        };

        fetchVenue();
    }, [mapReady, initialVenueSlug, selectedVenue]);

    useEffect(() => {
        const navbar = document.querySelector('nav');
        if (!navbar) return;

        const prevent = (e: TouchEvent) => {
            e.preventDefault();
        };

        navbar.addEventListener('touchmove', prevent, { passive: false });

        return () => {
            navbar.removeEventListener('touchmove', prevent);
        };
    }, []);

    useEffect(() => {
        localStorage.setItem("locationDenied", String(locationDenied));
    }, [locationDenied]);

    const { loading: loadingLocation } = useGeolocation({
        handleLocation: useCallback((locationInfo) => {
            setIsLocationFetch(true)
            if (hasInitialLocation) {
                setGeoViewState(initialViewState)
            } else {
                setGeoViewState({latitude: locationInfo.lat, longitude: locationInfo.lon, zoom: 12});
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []),
        handleFallback: () => {
            setIsLocationFetch(true)
            if (hasInitialLocation) {
                setGeoViewState(initialViewState)
            } else {
                setGeoViewState(DEFAULT_VIEW_STATE);
            }
        },
    });

    useOnClickOutside([selectedVenueDivRef, mapContainerRef], () => setSelectedVenue(null));
    useOnClickOutside([categorySelectorRef, categoryDropdownRef], () => setShowDropdown(false));

    function getBoundsFromViewState(viewState: ViewState, width = 800, height = 600) {
        const TILE_SIZE = 512;
        const scale = (TILE_SIZE * Math.pow(2, viewState.zoom));

        const centerX = (viewState.longitude + 180) / 360 * scale;
        const centerY = (1 - Math.log(Math.tan((viewState.latitude * Math.PI) / 180) + 1 / Math.cos((viewState.latitude * Math.PI) / 180)) / Math.PI) / 2 * scale;

        const deltaX = (width / 2) / TILE_SIZE;
        const deltaY = (height / 2) / TILE_SIZE;

        const west = ((centerX - deltaX * TILE_SIZE) / scale) * 360 - 180;
        const east = ((centerX + deltaX * TILE_SIZE) / scale) * 360 - 180;

        const latRadN = Math.PI * (1 - 2 * (centerY - deltaY * TILE_SIZE) / scale);
        const latRadS = Math.PI * (1 - 2 * (centerY + deltaY * TILE_SIZE) / scale);

        const north = (180 / Math.PI) * (Math.atan(Math.sinh(latRadN)));
        const south = (180 / Math.PI) * (Math.atan(Math.sinh(latRadS)));

        return { west, south, east, north };
    }

    const fetchClusters = useCallback(async (newViewState?: ViewState) => {
        if (!mapReady) {
            const map = mapRef.current?.getMap?.();
            if (!map) return;
            if (!map.isStyleLoaded()) {
                return;
            } else {
                setMapReady(true)
            }
        }

        let workingViewState = viewState;
        if (newViewState) workingViewState = newViewState;

        setIsHoveringTooltip(false);

        let z = Math.floor(workingViewState.zoom) + 1;
        if (z > 16) return;

        if (z > 14)
            z = 16
        else z = z + 1 // max zoom is 15,but also I didn't like the things so cluttered

        const mapEl = mapContainerRef.current;
        const width = mapEl?.offsetWidth || 800;
        const height = mapEl?.offsetHeight || 600;

        const bounds = getBoundsFromViewState(workingViewState, width, height);
        if (!bounds) return;

        const bbox = `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`;

        // Phase 1: Load from IndexedDB cache
        const cached = await loadClustersFromCache(z, [
            bounds.west,
            bounds.south,
            bounds.east,
            bounds.north
        ]);

        setClusters(cached.clusters);
        setRelevantSubcategories(cached.relevantSubcategories);

        const url = `/api/places?zoom=${z}&bbox=${bbox}`;

        fetch(url)
            .then((r) => r.json())
            .then((data: { tiles: Record<string, TileCluster[]>, relevantSubcategories: Record<string, number>, updatedAt: string}) => {

                const clustersFromTiles = Object.values(data.tiles ?? {})
                    .flat()
                    .map((c): TileCluster => ({
                        ...c,
                        ids: c.ids.map(Number),
                    }));

                const filtered = clustersFromTiles.filter(
                    (c) =>
                        !Number.isNaN(c.x) &&
                        !Number.isNaN(c.y) &&
                        Number.isFinite(tile2lon(c.x + 0.5, z)) &&
                        Number.isFinite(tile2lat(c.y + 0.5, z))
                );

                if (filtered.length === 0 && z > 3 && (newViewState || isLocationFetch)) {
                    easeTo(workingViewState.longitude, workingViewState.latitude, workingViewState.zoom - 2);
                    return;
                } else {
                    if (isLocationFetch) setIsLocationFetch(false);
                }

                setClusters(filtered);
                setRelevantSubcategories(data.relevantSubcategories);
                setLastSyncTime(data.updatedAt);

                // Update IndexedDB cache
                updateClusterCache(data.tiles)
            })
            .catch(console.error);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapReady, isLocationFetch, viewState, filteredCategories]);

    useEffect(() => {
        if (query?.length < 2 || disableSearch) {
            setAutocompleteResults([]);
            return;
        }

        const controller = new AbortController();

        fetch(`/api/map/autocomplete?q=${encodeURIComponent(query)}&lat=${viewState.latitude}&lon=${viewState.longitude}`, { signal: controller.signal })
            .then(res => res.json())
            .then(setAutocompleteResults)
            .catch(err => {
                if (err.name !== 'AbortError') console.error(err);
            });

        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    useEffect(() => {
        if (!mapReady || !geoViewState) return;

        const map = mapRef.current?.getMap?.();
        if (!map) {
            setTimeout(() => {
                const mapRetry = mapRef.current?.getMap?.();
                if (mapRetry) {
                    easeTo(geoViewState.longitude, geoViewState.latitude, geoViewState.zoom);
                    fetchClusters(geoViewState);
                } else {
                    console.warn("❌ Still no map after retry.");
                }
            }, 100);
            return;
        } else {
            easeTo(geoViewState.longitude, geoViewState.latitude, geoViewState.zoom);
            fetchClusters(geoViewState);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapReady, geoViewState]);

    useDebouncedEffect(() => {
        if (!loadingLocation && viewState.latitude && viewState.longitude) {
            fetchClusters();
        }
    }, [viewState, loadingLocation], 300);

    useEffect(() => {
        if (!clusters) return;

        const activeSubcategories = Object.entries(filteredCategories)
            .filter(([, isActive]) => isActive)
            .map(([key]) => key);

        // No filters active: return all clusters
        if (activeSubcategories.length === 0) {
            setFilteredClusters(clusters);
            return;
        }

        // Filter and transform clusters
        const filtered = clusters
            .map((cluster) => {
                const newSubcategories: Record<string, number> = {};

                for (const [subcat, count] of Object.entries(cluster.subcategories)) {
                    const isOther = subcat === "null" || subcat === null;
                    if (
                        (isOther && activeSubcategories.includes("other")) ||
                        (!isOther && activeSubcategories.includes(subcat))
                    ) {
                        const key = isOther ? "other" : subcat;
                        newSubcategories[key] = count;
                    }
                }

                const newCount = Object.values(newSubcategories).reduce((sum, c) => sum + c, 0);

                return {
                    ...cluster,
                    subcategories: newSubcategories,
                    count: newCount,
                };
            })
            .filter(cluster => cluster.count > 0);

        // todo: check if this is fair to do!
        setFilteredClusters(filtered);

        // Fetch venues only if they are missing and count is 1
        const missingVenueIds = filtered
            .filter(c => c.count === 1 && (!c.venues || c.venues.length !== 1))
            .flatMap(c => c.ids || []);

        if (missingVenueIds.length > 0) {
            fetch('/api/places/by-ids', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ids: missingVenueIds,
                    subcategories: activeSubcategories,
                }),
            })
                .then((r) => r.json())
                .then(({ venues }: { venues: EnrichedVenue[] }) => {
                    const enrichedMap = new Map<string, TileCluster>();

                    for (const venue of venues) {
                        for (const cluster of filtered) {
                            if (cluster.ids.includes(venue.id)) {
                                const existing = enrichedMap.get(cluster.id) || {
                                    ...cluster,
                                    venues: [],
                                };
                                enrichedMap.set(cluster.id, {
                                    ...existing,
                                    latitude: venue.lat,
                                    longitude: venue.lon,
                                    venues: [...(existing.venues || []), venue],
                                });
                            }
                        }
                    }

                    setFilteredClusters((prev) =>
                        prev.map((c) => (enrichedMap.has(c.id) ? enrichedMap.get(c.id)! : c))
                    );
                });
        }
    }, [filteredCategories, clusters]);

    const getXOffset = (x: number) => {
        const screenWidth = window.innerWidth;
        return x < screenWidth * 0.4 ? "0%" : x > screenWidth * 0.6 ? "-100%" : "-50%";
    };

    const getYOffset = (y: number) => {
        const usableHeight = window.innerHeight - 96;
        const centerY = usableHeight / 2;
        return y < centerY ? -10 : -(tooltipHeight -10);
    };

    const updateQueryWithoutSearch = (val: string) => {
        setDisableSearch(true);
        setQuery(val);
        setAutocompleteResults([]);
        setTimeout(() => setDisableSearch(false), 100); // allow search again after short delay
    };

    const sideBar = useMemo(() => (
        <AnimatePresence mode="wait">
            {selectedVenue && <PlaceSidebar key={selectedVenue.id} venue={selectedVenue} />}
        </AnimatePresence>
    ), [selectedVenue])

    const handleMapLoad = useCallback(async () => {
        if (!mapRef.current) return;

        const map = mapRef.current.getMap?.();

        if (!map) return;

        if (map.getSource('clusters') && map.getLayer('venue-icons') && map.getLayer('cluster-circles')) {
            setMapReady(true)
            return;
        }

        const iconColor = '#ffffff'; // Always white icons for both themes

        // Load custom icons for venue types
        const iconNames = [...new Set(Object.values(PLACE_SUBTYPE_ICON))];
        const MAKI_BASE_URL = 'https://raw.githubusercontent.com/mapbox/maki/main/icons';

        await Promise.all(
            iconNames.map(async (iconName) => {
                if (map.hasImage(iconName)) return;
                try {
                    const response = await fetch(`${MAKI_BASE_URL}/${iconName}.svg`);
                    if (!response.ok) return;
                    const svgText = await response.text();
                    const coloredSvg = svgText.replace(/<path/g, `<path fill="${iconColor}"`);
                    const img = new Image(30, 30);
                    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(coloredSvg);
                    await new Promise<void>((resolve) => {
                        img.onload = () => {
                            if (!map.hasImage(iconName)) {
                                map.addImage(iconName, img, { sdf: false });
                            }
                            resolve();
                        };
                        img.onerror = () => resolve();
                    });
                } catch {
                    // Icon not available, will use fallback
                }
            })
        );

        // Add a default pin icon as fallback
        if (!map.hasImage('pin')) {
            const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${iconColor}"><path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg>`;
            const pinImg = new Image(24, 24);
            pinImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pinSvg);
            await new Promise<void>((resolve) => {
                pinImg.onload = () => {
                    if (!map.hasImage('pin')) map.addImage('pin', pinImg);
                    resolve();
                };
                pinImg.onerror = () => resolve();
            });
        }

        map.addSource('clusters', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
            promoteId: 'id'
        });

        map.addLayer({
            id: 'cluster-circles',
            type: 'circle',
            source: 'clusters',
            paint: {
                'circle-radius': [
                    'interpolate',
                    ['linear'],
                    ['get', 'count'],
                    1, 16,
                    10, 25,
                    50, 40
                ],
                'circle-color': [
                    'case',
                    ['boolean', ['get', 'isSelected'], false],
                    '#006eff', // 🎯 selected venue color (e.g., blue)
                    [
                        'step',
                        ['get', 'count'],
                        '#E96B00',   // base value (count < 10)
                        10, '#d7935a', // 10 <= count < 50
                        50, '#eac8ac', // count >= 50
                        200, '#a69a90', // count >= 50
                    ]
                ],
                'circle-opacity': 0.8,
            }
        });

        map.addLayer({
            id: 'venue-icons',
            type: 'symbol',
            source: 'clusters',
            layout: {
                'icon-image': ['get', 'icon'], // only venues have this set, clusters will skip
                'icon-size': [
                    'case',
                    ['boolean', ['get', 'isSelected'], false],
                    0.7,
                    0.5
                ],
                'icon-allow-overlap': true,
                'text-field': [
                    'to-string',
                    ['case',
                        ['>', ['get', 'count'], 1],
                        ['get', 'count'],
                        ''
                    ]
                ],
                'text-size': 16,
            },
            paint: {
                'icon-color': '#ffffff',
                'text-color': '#ffffff',
            }
        });

        setMapReady(true);
    }, [mapStyle]);

    useEffect(() => {
        if (!mapReady) return; // ⛔️ skip until ready

        if (!mapRef.current) return;

        const map = mapRef.current.getMap?.();
        if (!map) return;

        const source = map.getSource('clusters') as GeoJSONSource;
        if (!source) {
            console.warn("❌ Source not available yet");
            return;
        }

        const features = filteredClusters
            .map((c) => {
                const icon = c.count === 1 && c.venues?.[0] ? c.venues?.[0].subcategory ? PLACE_SUBTYPE_ICON[c.venues[0].subcategory] : 'pin' : undefined
                const venue = c.count === 1 && c.venues?.[0] ? c.venues?.[0] : undefined
                const isSelected = selectedVenue && venue?.id === selectedVenue.id

                return {
                    id: c.id,
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [c.longitude, c.latitude],
                    },
                    properties: {
                        id: c.id,
                        count: c.count,
                        subcategoriesList: c.subcategories,
                        venue,
                        icon: icon,
                        isSelected
                    }
                };
            })
            .filter((f) => f !== null)

        source.setData({
            type: 'FeatureCollection',
            features: features as Feature[],
        });

    }, [filteredClusters, mapReady, selectedVenue]);

    useEffect(() => {
        if (!mapReady || !mapRef.current) return;

        const map = mapRef.current.getMap?.();
        if (!map) return;

        const getProps = (e: MapMouseEvent) => {
            if (!map.getLayer('venue-icons') || !map.getLayer('cluster-circles')) {
                return;
            }
            const features = map.queryRenderedFeatures(e.point, {
                layers: ['venue-icons', 'cluster-circles'],
            });

            const feature = features[0] as Feature<Point>;

            if (!feature || !feature.properties) {
                return;
            }

            const props = feature.properties;

            const [lon, lat] = feature.geometry.coordinates

            return {
                id: feature.id,
                lon,
                lat,
                props
            }
        };

        const handleClick = (e: MapMouseEvent) => {
            const result = getProps(e);
            if (!result) {
                setSelectedVenue(null);
                setTooltip(null);
                return
            }

            const { lat, lon, props } = result;

            if (props.count > 1) {
                easeTo(lon, lat, Math.min(viewState.zoom + (viewState.zoom > 16 ? 0 : viewState.zoom < 10 ? 2 : 1), 20))
            } else {
                const parseVenue = JSON.parse(props.venue)
                setSelectedVenue(parseVenue);
                updateQueryWithoutSearch(parseVenue.tags.name)
            }
        };

        const handleMouseMove = (e: MapMouseEvent) => {
            if (isHoveringTooltip) return;

            const result = getProps(e);
            if (!result) {
                setTooltip(null);
                return
            }

            const { lat, lon, props } = result;

            setTooltip({
                x: e.point.x,
                y: e.point.y,
                latitude: lat,
                longitude: lon,
                content: props.count === 1 && props.venue ? [JSON.parse(props.venue)] : JSON.parse(props.subcategoriesList)
            });
        };

        map.on('click', handleClick);
        if (!isTouchDevice) map.on('mousemove', handleMouseMove);

        return () => {
            map.off('click', handleClick);
            if (!isTouchDevice)
                map.off('mousemove', handleMouseMove);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapReady, isHoveringTooltip, filteredClusters]);

    const easeTo = (lon: number, lat: number, zoom: number) => {
        const map = mapRef.current?.getMap?.();
        if (!map) return;

        map.easeTo({
            center: [lon, lat],
            zoom,
            duration: 800,
        });
    };

    // updates last sync information to the map
    useEffect(() => {
        const map = mapRef.current?.getMap?.();
        if (!map || !lastSyncTime) return;

        // Remove previous control if it exists and map is still valid
        if (attributionControlRef.current) {
            try {
                // Check if map has the control before removing
                if (map.hasControl && map.hasControl(attributionControlRef.current)) {
                    map.removeControl(attributionControlRef.current);
                }
            } catch {
                // Control may belong to a previous map instance, ignore
            }
            attributionControlRef.current = null;
        }

        const date = new Date(lastSyncTime);
        const formatted = date.toLocaleString(undefined, { hour: '2-digit', minute: '2-digit' });

        // Create and store new control
        const newControl = new AttributionControl({
            compact: isTouchDevice,
            customAttribution: `Synced at: ${formatted}`
        });

        map.addControl(newControl);
        attributionControlRef.current = newControl;

        // Cleanup when effect re-runs or component unmounts
        return () => {
            try {
                if (attributionControlRef.current && map.hasControl && map.hasControl(attributionControlRef.current)) {
                    map.removeControl(attributionControlRef.current);
                }
            } catch {
                // Map may be destroyed, ignore
            }
            attributionControlRef.current = null;
        };
    }, [lastSyncTime, mapStyle]);

    useEffect(() => {
        // Save original values
        const originalHtmlStyle = document.documentElement.style.cssText;
        const originalBodyStyle = document.body.style.cssText;

        // Apply custom styles
        document.documentElement.style.height = '100%';
        document.body.style.height = '100%';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.overflow = 'hidden';
        document.body.style.minHeight = '100vh';

        // Cleanup on unmount
        return () => {
            document.documentElement.style.cssText = originalHtmlStyle;
            document.body.style.cssText = originalBodyStyle;
        };
    }, []);

    if (loadingLocation) return <div>Loading map…</div>;

    return (
        <div className="h-[calc(var(--vh)-4rem)] mt-16 bg-primary">
            <div className="absolute w-px h-px -m-px p-0 overflow-hidden whitespace-nowrap border-0" style={{clip: 'rect(0 0 0 0)'}} aria-hidden="true">
                <h1 className="text-[0.01rem] text-transparent m-0 p-0 text-center">{String(metadata.title)}</h1>
                <p>{String(metadata.description)}</p>
                <p>Currently displaying venues, merchants, shops accepting Bitcoin around the world.</p>
            </div>
            <div className="h-[calc(var(--vh)-4rem)] relative">
                <main className="h-[calc(var(--vh,1vh)*100-4rem)] w-full relative" ref={mapContainerRef}>
                    <div className={`pointer-events-none absolute w-[90vw] max-w-container flex gap-4 flex-col md:flex-row top-4 z-999 left-4 max-md:h-22 max-md:w-[calc(100%-2rem)] ${selectedVenue ? '' : 'max-md:[&_.searchContainer]:min-w-full max-md:[&_.searchInputContainer]:min-w-full max-md:[&_.search]:min-w-full max-md:[&_.search]:max-w-full'}`}>
                        <div className="searchContainer w-full max-w-82 pointer-events-auto">
                            <div className="searchInputContainer relative">
                                <input type="search" className="search relative w-full min-w-[150px] bg-surface text-text py-2 pl-5 pr-10 h-10 rounded-btn shadow-[0_1px_3px_rgba(0,0,0,0.3)] mb-4 placeholder:text-text-light border border-border-light [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden" value={query ?? ''} onChange={(e) => setQuery(e.target.value ?? '')} placeholder={t("searchPlaceholder")} />
                                {query && <button onClick={() => {
                                    setSelectedVenue(null);
                                    setQuery("")
                                }} className="absolute top-0 right-2 h-10 flex items-center justify-center text-xl border-none bg-transparent cursor-pointer text-text-light hover:text-text transition-colors">×</button>}
                            </div>
                            {query?.length > 1 && autocompleteResults.length > 0 && (
                                <div className="autocomplete absolute top-full left-0 z-20 bg-surface text-text w-full min-w-[300px] md:min-w-[400px] max-h-[60vh] md:max-h-[50vh] overflow-y-auto border border-border-light rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.4)] mt-1">
                                    {autocompleteResults
                                        .filter(r => r.resultType === 'venue')
                                        .map((res, idx) => {
                                            return (
                                                <div
                                                    key={`venue-${idx}`}
                                                    className="py-3 px-4 text-sm cursor-pointer border-b border-border-light hover:bg-surface-light [&_span]:text-text-light"
                                                    onClick={() => {
                                                        if (!res.venue) return
                                                        setSelectedVenue(res.venue);
                                                        updateQueryWithoutSearch(res.venue?.tags.name)
                                                        easeTo(res.longitude, res.latitude, 15);
                                                    }}
                                                >
                                                    📍 {res.label}<span> - {getFormattedAddress(locale, res.venue!)}
                                                    {res.distance && ` · ${res.distance.toFixed(1)} km`}
                                                    </span>
                                                </div>
                                            )
                                        })}

                                    {autocompleteResults
                                        .filter(r => r.resultType !== 'venue')
                                        .map((res, idx) => (
                                            <div
                                                key={`place-${idx}`}
                                                className="py-3 px-4 text-sm cursor-pointer border-b border-border-light hover:bg-surface-light [&_span]:text-text-light"
                                                onClick={() => {
                                                    easeTo(res.longitude, res.latitude, res.resultType === 'country' ? 6 : 10);
                                                    setQuery('');
                                                    setSelectedVenue(null);
                                                    setAutocompleteResults([]);
                                                }}
                                            >
                                                🏙️ {res.label} ({res.resultType})
                                                {res.distance && <span>{` · ${res.distance.toFixed(1)} km`}</span>}
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                        {!selectedVenue &&
                            <div className="relative flex gap-4 justify-start items-start flex-row w-full pointer-events-auto">
                                <div className="bg-surface text-text py-2 px-3 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.3)] border border-border-light text-sm cursor-pointer w-fit select-none font-medium" onClick={() => setShowDropdown(!showDropdown)} ref={categorySelectorRef}>
                                    {t('filter.byCategory')} ▼
                                </div>

                                {showDropdown && (
                                    <div className="absolute top-[calc(100%-0.8rem)] max-md:top-[calc(100%+0.8rem)] left-0 z-[100] bg-surface text-text rounded-xl py-3 px-4 shadow-[0_6px_16px_rgba(0,0,0,0.4)] border border-border-light max-h-[280px] overflow-y-auto flex flex-col" ref={categoryDropdownRef}>
                                        {relevantSubcategories && Object.entries(relevantSubcategories).map(([key, count]) => {
                                            const match = matchPlaceSubcategory(key);
                                            const label = match
                                                ? getSubcategoryLabel(locale, match.category, match.subcategory)
                                                : "Other";

                                            return (
                                                <label key={key} className="flex items-center justify-start text-sm font-normal text-text p-0 cursor-pointer hover:bg-surface-light hover:rounded-md hover:pl-1 [&_input]:w-3.5 [&_input]:h-3.5 [&_input]:mr-3 [&_input]:accent-accent">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!filteredCategories[key]}
                                                        onChange={() =>
                                                            setFilteredCategories((prev) => ({
                                                                ...prev,
                                                                [key]: !prev[key]
                                                            }))
                                                        }
                                                    />
                                                    {label} ({count})
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(filteredCategories).map(([key, isActive]) => {
                                        if (!isActive) return null;
                                        const match = matchPlaceSubcategory(key);
                                        const label = match
                                            ? getSubcategoryLabel(locale, match.category, match.subcategory)
                                            : "Other";

                                        return (
                                            <button
                                                key={key}
                                                className="bg-accent text-white border-none rounded-[10px] py-1 px-2.5 text-[13px] font-medium cursor-pointer whitespace-nowrap hover:bg-accent-light"
                                                onClick={() =>
                                                    setFilteredCategories((prev) => ({
                                                        ...prev,
                                                        [key]: false
                                                    }))
                                                }
                                            >
                                                {label} ✕
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        }
                    </div>
                    <div className="absolute top-4 max-md:top-auto max-md:bottom-12 left-[calc(100%-2.5rem)] flex flex-col z-[100] gap-2">
                        <button className="bg-black/25 rounded-lg p-0 w-[30px] min-w-[30px] min-h-[30px] h-[30px] text-xl font-bold cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.15)] transition-colors duration-200 text-white text-center hover:bg-gray-500" onClick={() => easeTo(viewState.longitude, viewState.latitude, viewState.zoom + 1)}>＋</button>
                        <button className="bg-black/25 rounded-lg p-0 w-[30px] min-w-[30px] min-h-[30px] h-[30px] text-xl font-bold cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.15)] transition-colors duration-200 text-white text-center hover:bg-gray-500" onClick={() => easeTo(viewState.longitude, viewState.latitude, viewState.zoom - 1)}>－</button>
                        {/* Map Style Toggle */}
                        <button
                            className="bg-black/25 rounded-lg p-0 w-[30px] min-w-[30px] min-h-[30px] h-[30px] cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.15)] transition-colors duration-200 text-white flex items-center justify-center hover:bg-gray-500"
                            onClick={() => {
                                setMapStyle(mapStyle === 'dark' ? 'light' : 'dark');
                                setMapReady(false);
                            }}
                            title={`Switch to ${mapStyle === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            {mapStyle === 'dark' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
                        </button>
                    </div>
                    <MapGL
                        key={mapStyle}
                        onLoad={handleMapLoad}
                        ref={mapRef}
                        initialViewState={viewState}
                        onMove={(evt) => setViewState(evt.viewState)}
                        reuseMaps={false}
                        mapStyle={MAP_STYLES[mapStyle].url}
                        attributionControl={false}
                    />
                    {sideBar}
                    {!locationDenied && (
                        <div className="fixed left-auto bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[1000] w-80 max-w-[90vw] bg-surface/95 backdrop-blur-sm rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-border-light flex flex-col gap-4">
                            <button
                                className="absolute top-2 right-3 bg-transparent border-none text-lg text-text-light cursor-pointer hover:text-white"
                                onClick={() => setLocationDenied(true)}
                                aria-label="Close"
                            >
                                ✕
                            </button>

                            <div>
                                <h4 className="m-0 text-lg font-semibold text-white">📍 {t('locationPrompt.title')}</h4>
                                <p className="mt-2 text-[0.95rem] leading-snug text-text-light">{t('locationPrompt.description')}</p>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={() => {
                                        navigator.geolocation.getCurrentPosition(
                                            ({ coords }) => {
                                                easeTo(coords.longitude, coords.latitude, 12)
                                                setLocationDenied(true);
                                                setIsLocationFetch(true)
                                                fetchClusters({longitude: coords.longitude, latitude: coords.latitude, zoom: 12});
                                            },
                                            () => {
                                                toast.error("Location access was denied.");
                                                setLocationDenied(true);
                                            }
                                        );
                                    }}
                                >
                                    Share My Location
                                </Button>
                            </div>
                        </div>
                    )}

                    <button
                        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 w-12 h-12 rounded-full bg-black/80 text-white border-none text-2xl font-bold cursor-pointer z-[1001] flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-colors duration-200 hover:bg-black/90"
                        onClick={(e) => {
                            e.stopPropagation();
                            console.log('Help button clicked');
                            setShowHelpPopup(true);
                        }}
                        aria-label="Help and information"
                    >
                        ?
                    </button>

                </main>

                {tooltip && (
                    <div
                        ref={tooltipRef}
                        className="absolute pointer-events-none transition-all duration-200 z-[1000]"
                        style={{
                            left: tooltip.x,
                            top: tooltip.y + getYOffset(tooltip.y),
                            transform: `translate(${getXOffset(tooltip.x)}, 0%)`,
                            touchAction: 'none',
                            overscrollBehavior: 'none',
                        }}
                        onWheel={(e) => {
                            if (e.ctrlKey) e.preventDefault();
                        }}
                        onTouchStart={(e) => {
                            if (e.touches.length > 1) e.preventDefault();
                        }}
                        onMouseEnter={() => !isTouchDevice && setIsHoveringTooltip(true)}
                        onMouseLeave={() => !isTouchDevice && setIsHoveringTooltip(false)}
                        onClick={() => {
                            if (tooltip.content && tooltip.content.length !== 1) {
                                easeTo(tooltip?.longitude, tooltip?.latitude, Math.min(viewState.zoom + (viewState.zoom > 16 ? 0 : viewState.zoom < 10 ? 2: 1), 20));
                                setTooltip(null)
                                setIsHoveringTooltip(false)
                            } else if (tooltip.content) {
                                const venue = (tooltip.content as EnrichedVenue[])[0]
                                setSelectedVenue(venue);
                                updateQueryWithoutSearch(venue.tags.name)
                                setTooltip(null)
                                setIsHoveringTooltip(false)
                            }
                        }}
                    >
                        <ClusterTooltip content={tooltip.content} />
                    </div>
                )}

                {showHelpPopup && createPortal(
                    <div className="fixed z-[9999] w-80 max-w-[90vw] bg-surface/95 backdrop-blur-sm rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-border-light flex flex-col gap-4" style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                    }}>
                        <button
                            className="absolute top-2 right-3 bg-transparent border-none text-lg text-text-light cursor-pointer hover:text-white"
                            onClick={() => setShowHelpPopup(false)}
                            aria-label="Close"
                        >
                            ✕
                        </button>

                        <div>
                            <h1 className="m-0 mb-1 text-lg font-semibold leading-tight text-white">{t('helpPopup.title')}</h1>
                            <h2 className="m-0 mb-3 text-[0.95rem] font-medium text-text-light leading-snug">{t('helpPopup.subtitle')}</h2>
                            <p className="mt-2 text-[0.95rem] leading-snug text-text-light">{t('helpPopup.description')}</p>
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={() => setShowHelpPopup(false)}>
                                {t('helpPopup.closeButton')}
                            </Button>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
            <MapFAQ />
        </div>
    );
};

export default MapPage;
