"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface MapLibreMarkerProps {
    lat: number;
    lon: number;
    onMove: (lat: number, lon: number) => void;
    height?: string;
    zoom?: number;
}

/**
 * MapLibre GL JS map with draggable marker
 *
 * Free, open-source alternative to Google Maps.
 * Uses Carto basemaps (free) for tile rendering.
 */
export default function MapLibreMarker({
    lat,
    lon,
    onMove,
    height = "300px",
    zoom = 16,
}: MapLibreMarkerProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markerRef = useRef<maplibregl.Marker | null>(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    // Store the onMove callback in a ref to avoid recreating marker listeners
    const onMoveRef = useRef(onMove);
    useEffect(() => {
        onMoveRef.current = onMove;
    }, [onMove]);

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const initialLat = lat || 0;
        const initialLon = lon || 0;

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
            center: [initialLon, initialLat],
            zoom: initialLat === 0 && initialLon === 0 ? 2 : zoom,
            attributionControl: false,
        });

        // Add navigation controls
        map.addControl(new maplibregl.NavigationControl(), "top-right");

        // Add attribution
        map.addControl(
            new maplibregl.AttributionControl({
                compact: true,
            }),
            "bottom-right"
        );

        map.on("load", () => {
            setIsMapLoaded(true);

            // Create draggable marker
            const marker = new maplibregl.Marker({
                draggable: true,
                color: "#f7931a", // Bitcoin orange
            })
                .setLngLat([initialLon, initialLat])
                .addTo(map);

            marker.on("dragend", () => {
                const lngLat = marker.getLngLat();
                onMoveRef.current(lngLat.lat, lngLat.lng);
            });

            markerRef.current = marker;
        });

        // Allow clicking on map to move marker
        map.on("click", (e) => {
            if (markerRef.current) {
                markerRef.current.setLngLat(e.lngLat);
                onMoveRef.current(e.lngLat.lat, e.lngLat.lng);
            }
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update marker position when lat/lon props change
    useEffect(() => {
        if (!mapRef.current || !markerRef.current || !isMapLoaded) return;

        const validLat = lat || 0;
        const validLon = lon || 0;

        // Only update if position actually changed
        const currentPos = markerRef.current.getLngLat();
        if (
            Math.abs(currentPos.lat - validLat) > 0.00001 ||
            Math.abs(currentPos.lng - validLon) > 0.00001
        ) {
            markerRef.current.setLngLat([validLon, validLat]);

            // Fly to new position if it's a significant change
            if (
                Math.abs(currentPos.lat - validLat) > 0.01 ||
                Math.abs(currentPos.lng - validLon) > 0.01
            ) {
                mapRef.current.flyTo({
                    center: [validLon, validLat],
                    zoom: zoom,
                    duration: 1000,
                });
            }
        }
    }, [lat, lon, isMapLoaded, zoom]);

    // Handle geolocation
    const handleLocateMe = useCallback(() => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;

                if (markerRef.current && mapRef.current) {
                    markerRef.current.setLngLat([longitude, latitude]);
                    mapRef.current.flyTo({
                        center: [longitude, latitude],
                        zoom: zoom,
                        duration: 1500,
                    });
                    onMoveRef.current(latitude, longitude);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                alert("Unable to get your location. Please check your permissions.");
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    }, [zoom]);

    return (
        <div className="relative">
            <div
                ref={mapContainerRef}
                style={{ width: "100%", height, borderRadius: "12px" }}
                className="overflow-hidden border border-border-light"
            />

            {/* Locate me button */}
            <button
                type="button"
                onClick={handleLocateMe}
                className="absolute bottom-3 left-3 bg-surface hover:bg-surface-light text-white p-2 rounded-lg shadow-lg border border-border-light transition-colors"
                title="Use my location"
            >
                <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                </svg>
            </button>

            {/* Instructions */}
            <div className="absolute top-3 left-3 bg-surface/90 backdrop-blur-sm text-xs text-text-light px-2 py-1 rounded-lg border border-border-light">
                Drag marker or click to set location
            </div>
        </div>
    );
}
