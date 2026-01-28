import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Photon API result type (Komoot's free geocoding service based on OpenStreetMap)
 */
interface PhotonFeature {
    type: "Feature";
    geometry: {
        type: "Point";
        coordinates: [number, number]; // [lon, lat]
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
        extent?: [number, number, number, number];
    };
}

interface PhotonResponse {
    type: "FeatureCollection";
    features: PhotonFeature[];
}

export interface AddressSuggestion {
    id: string;
    label: string;
    lat: number;
    lon: number;
    address: {
        name?: string;
        housenumber?: string;
        street?: string;
        district?: string;
        city?: string;
        state?: string;
        postcode?: string;
        country?: string;
        countryCode?: string;
    };
    type: string;
    osmId: number;
    osmType: string;
}

interface UseAddressAutocompleteOptions {
    debounceMs?: number;
    limit?: number;
    lang?: string;
    locationBias?: { lat: number; lon: number };
}

interface UseAddressAutocompleteReturn {
    value: string;
    setValue: (value: string, shouldFetch?: boolean) => void;
    suggestions: AddressSuggestion[];
    isLoading: boolean;
    error: string | null;
    clearSuggestions: () => void;
    selectSuggestion: (suggestion: AddressSuggestion) => void;
    selectedSuggestion: AddressSuggestion | null;
}

const PHOTON_API = "https://photon.komoot.io/api/";

/**
 * Custom hook for address autocomplete using Photon (free, OpenStreetMap-based)
 *
 * Usage:
 * ```tsx
 * const { value, setValue, suggestions, isLoading, selectSuggestion } = useAddressAutocomplete();
 *
 * <input value={value} onChange={(e) => setValue(e.target.value)} />
 * {suggestions.map(s => <li key={s.id} onClick={() => selectSuggestion(s)}>{s.label}</li>)}
 * ```
 */
export function useAddressAutocomplete(
    options: UseAddressAutocompleteOptions = {}
): UseAddressAutocompleteReturn {
    const { debounceMs = 300, limit = 5, lang = "en", locationBias } = options;

    const [value, setValueState] = useState("");
    const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedSuggestion, setSelectedSuggestion] = useState<AddressSuggestion | null>(null);

    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchSuggestions = useCallback(
        async (query: string) => {
            if (query.length < 3) {
                setSuggestions([]);
                return;
            }

            // Cancel previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            abortControllerRef.current = new AbortController();
            setIsLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({
                    q: query,
                    limit: limit.toString(),
                    lang,
                });

                // Add location bias if provided (improves results near user)
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

                const data: PhotonResponse = await response.json();

                const formattedSuggestions: AddressSuggestion[] = data.features.map(
                    (feature) => {
                        const props = feature.properties;
                        const [lon, lat] = feature.geometry.coordinates;

                        // Build a readable label
                        const labelParts: string[] = [];
                        if (props.name) labelParts.push(props.name);
                        if (props.housenumber && props.street) {
                            labelParts.push(`${props.street} ${props.housenumber}`);
                        } else if (props.street) {
                            labelParts.push(props.street);
                        }
                        if (props.city) labelParts.push(props.city);
                        if (props.state) labelParts.push(props.state);
                        if (props.country) labelParts.push(props.country);

                        const label = labelParts.filter(Boolean).join(", ");

                        return {
                            id: `${props.osm_type}-${props.osm_id}`,
                            label: label || `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
                            lat,
                            lon,
                            address: {
                                name: props.name,
                                housenumber: props.housenumber,
                                street: props.street,
                                district: props.district,
                                city: props.city,
                                state: props.state,
                                postcode: props.postcode,
                                country: props.country,
                                countryCode: props.countrycode?.toUpperCase(),
                            },
                            type: props.type || props.osm_value || "place",
                            osmId: props.osm_id,
                            osmType: props.osm_type,
                        };
                    }
                );

                setSuggestions(formattedSuggestions);
            } catch (err) {
                if (err instanceof Error && err.name === "AbortError") {
                    // Request was cancelled, ignore
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
            setSelectedSuggestion(null);

            if (!shouldFetch) {
                setSuggestions([]);
                return;
            }

            // Debounce the API call
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

    const selectSuggestion = useCallback((suggestion: AddressSuggestion) => {
        setSelectedSuggestion(suggestion);
        setValueState(suggestion.label);
        setSuggestions([]);
    }, []);

    // Cleanup on unmount
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
        selectedSuggestion,
    };
}

/**
 * Reverse geocode coordinates to get address using Nominatim (free, OpenStreetMap)
 */
export async function reverseGeocode(
    lat: number,
    lon: number,
    lang = "en"
): Promise<AddressSuggestion["address"] | null> {
    try {
        const params = new URLSearchParams({
            lat: lat.toString(),
            lon: lon.toString(),
            format: "jsonv2",
            addressdetails: "1",
            "accept-language": lang,
        });

        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?${params}`,
            {
                headers: {
                    "User-Agent": "MappingBitcoin/1.0",
                },
            }
        );

        if (!response.ok) {
            throw new Error("Reverse geocoding failed");
        }

        const data = await response.json();

        if (data.error) {
            return null;
        }

        const address = data.address || {};

        return {
            name: data.name,
            housenumber: address.house_number,
            street: address.road || address.street,
            district: address.suburb || address.neighbourhood || address.district,
            city: address.city || address.town || address.village || address.municipality,
            state: address.state || address.province || address.region,
            postcode: address.postcode,
            country: address.country,
            countryCode: address.country_code?.toUpperCase(),
        };
    } catch (error) {
        console.error("Reverse geocoding error:", error);
        return null;
    }
}

export default useAddressAutocomplete;
