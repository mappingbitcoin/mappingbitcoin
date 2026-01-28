import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Venue search result from Photon API
 */
export interface VenueSuggestion {
    id: string;
    name: string;
    label: string;
    lat: number;
    lon: number;
    address: {
        housenumber?: string;
        street?: string;
        district?: string;
        city?: string;
        state?: string;
        postcode?: string;
        country?: string;
        countryCode?: string;
    };
    category?: string;
    type: string;
    osmId: number;
    osmType: string;
}

interface PhotonFeature {
    type: "Feature";
    geometry: {
        type: "Point";
        coordinates: [number, number];
    };
    properties: {
        osm_id: number;
        osm_type: string;
        osm_key: string;
        osm_value: string;
        name?: string;
        housenumber?: string;
        street?: string;
        district?: string;
        city?: string;
        state?: string;
        postcode?: string;
        country?: string;
        countrycode?: string;
        type?: string;
    };
}

interface UseVenueSearchOptions {
    debounceMs?: number;
    limit?: number;
    lang?: string;
    locationBias?: { lat: number; lon: number };
}

interface UseVenueSearchReturn {
    value: string;
    setValue: (value: string, shouldFetch?: boolean) => void;
    suggestions: VenueSuggestion[];
    isLoading: boolean;
    error: string | null;
    clearSuggestions: () => void;
    selectSuggestion: (suggestion: VenueSuggestion) => void;
    selectedVenue: VenueSuggestion | null;
}

const PHOTON_API = "https://photon.komoot.io/api/";

// OSM keys that typically represent establishments/venues
const ESTABLISHMENT_KEYS = [
    "amenity",
    "shop",
    "tourism",
    "leisure",
    "office",
    "craft",
    "healthcare",
    "club",
];

/**
 * Custom hook for venue/establishment search using Photon
 *
 * Filters results to show only establishments (shops, restaurants, etc.)
 * rather than addresses or streets.
 */
export function useVenueSearch(
    options: UseVenueSearchOptions = {}
): UseVenueSearchReturn {
    const { debounceMs = 300, limit = 8, lang = "en", locationBias } = options;

    const [value, setValueState] = useState("");
    const [suggestions, setSuggestions] = useState<VenueSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedVenue, setSelectedVenue] = useState<VenueSuggestion | null>(null);

    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchSuggestions = useCallback(
        async (query: string) => {
            if (query.length < 2) {
                setSuggestions([]);
                return;
            }

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            abortControllerRef.current = new AbortController();
            setIsLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({
                    q: query,
                    limit: (limit * 3).toString(), // Fetch more to filter
                    lang,
                });

                if (locationBias) {
                    params.set("lat", locationBias.lat.toString());
                    params.set("lon", locationBias.lon.toString());
                }

                const response = await fetch(`${PHOTON_API}?${params}`, {
                    signal: abortControllerRef.current.signal,
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch suggestions");
                }

                const data = await response.json();

                // Filter to establishments only, deduplicate, and limit results
                const seenIds = new Set<string>();
                const establishments = (data.features as PhotonFeature[])
                    .filter((feature) => {
                        const props = feature.properties;
                        // Must have a name to be considered a venue
                        if (!props.name) return false;
                        // Check if it's an establishment type
                        if (!ESTABLISHMENT_KEYS.includes(props.osm_key)) return false;
                        // Deduplicate by OSM ID
                        const id = `${props.osm_type}-${props.osm_id}`;
                        if (seenIds.has(id)) return false;
                        seenIds.add(id);
                        return true;
                    })
                    .slice(0, limit)
                    .map((feature, index): VenueSuggestion => {
                        const props = feature.properties;
                        const [lon, lat] = feature.geometry.coordinates;

                        // Build label with name and location
                        const locationParts: string[] = [];
                        if (props.street) locationParts.push(props.street);
                        if (props.city) locationParts.push(props.city);
                        if (props.country) locationParts.push(props.country);

                        const label = locationParts.length > 0
                            ? `${props.name}, ${locationParts.join(", ")}`
                            : props.name || "Unknown";

                        return {
                            id: `${props.osm_type}-${props.osm_id}-${index}`,
                            name: props.name || "Unknown",
                            label,
                            lat,
                            lon,
                            address: {
                                housenumber: props.housenumber,
                                street: props.street,
                                district: props.district,
                                city: props.city,
                                state: props.state,
                                postcode: props.postcode,
                                country: props.country,
                                countryCode: props.countrycode?.toUpperCase(),
                            },
                            category: props.osm_value,
                            type: props.osm_key,
                            osmId: props.osm_id,
                            osmType: props.osm_type,
                        };
                    });

                setSuggestions(establishments);
            } catch (err) {
                if (err instanceof Error && err.name === "AbortError") {
                    return;
                }
                setError(err instanceof Error ? err.message : "Unknown error");
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        },
        [limit, lang, locationBias]
    );

    const setValue = useCallback(
        (newValue: string, shouldFetch = true) => {
            setValueState(newValue);
            setSelectedVenue(null);

            if (!shouldFetch) {
                setSuggestions([]);
                return;
            }

            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }

            debounceRef.current = setTimeout(() => {
                fetchSuggestions(newValue);
            }, debounceMs);
        },
        [fetchSuggestions, debounceMs]
    );

    const clearSuggestions = useCallback(() => {
        setSuggestions([]);
    }, []);

    const selectSuggestion = useCallback((suggestion: VenueSuggestion) => {
        setSelectedVenue(suggestion);
        setValueState(suggestion.name);
        setSuggestions([]);
    }, []);

    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return {
        value,
        setValue,
        suggestions,
        isLoading,
        error,
        clearSuggestions,
        selectSuggestion,
        selectedVenue,
    };
}

/**
 * Fetch detailed venue information from OpenStreetMap
 */
export async function fetchVenueDetails(
    osmType: string,
    osmId: number
): Promise<Record<string, string> | null> {
    try {
        const typePrefix = osmType.charAt(0).toUpperCase(); // N, W, or R
        const response = await fetch(
            `https://nominatim.openstreetmap.org/lookup?osm_ids=${typePrefix}${osmId}&format=json&extratags=1&addressdetails=1`,
            {
                headers: {
                    "User-Agent": "MappingBitcoin/1.0",
                },
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch venue details");
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            return null;
        }

        const result = data[0];
        const tags: Record<string, string> = {};

        // Extract extra tags (contains OSM tags like opening_hours, website, etc.)
        if (result.extratags) {
            Object.assign(tags, result.extratags);
        }

        // Add address components
        if (result.address) {
            const addr = result.address;
            if (addr.house_number) tags["addr:housenumber"] = addr.house_number;
            if (addr.road) tags["addr:street"] = addr.road;
            if (addr.city || addr.town || addr.village) {
                tags["addr:city"] = addr.city || addr.town || addr.village;
            }
            if (addr.state) tags["addr:state"] = addr.state;
            if (addr.postcode) tags["addr:postcode"] = addr.postcode;
            if (addr.country_code) tags["addr:country"] = addr.country_code.toUpperCase();
        }

        // Add name
        if (result.name) {
            tags["name"] = result.name;
        }

        return tags;
    } catch (error) {
        console.error("Error fetching venue details:", error);
        return null;
    }
}

export default useVenueSearch;
