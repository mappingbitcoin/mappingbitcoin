"use client";

import React from "react";
import dynamic from "next/dynamic";
import { FormInput } from "@/components/forms";
import { PinIcon } from "@/assets/icons/ui";

// Dynamically import the MapLibre-based map component (free, open-source)
const MapWithDraggableMarker = dynamic(
    () => import("./MapWithDraggableMarker/MapLibreMarker"),
    { ssr: false, loading: () => <div className="h-[300px] bg-surface-light rounded-xl animate-pulse" /> }
);

interface LocationSectionProps {
    lat: string;
    lon: string;
    address: {
        street: string;
        housenumber: string;
        city: string;
        state: string;
        postcode: string;
        country: string;
    };
    onMapMove: (lat: number, lon: number) => void;
    onAddressChange: (field: string, value: string) => void;
    showAllFields?: boolean;
}

export default function LocationSection({
    lat,
    lon,
    address,
    onMapMove,
    onAddressChange,
    showAllFields = false,
}: LocationSectionProps) {
    const hasCoordinates = lat && lon && !isNaN(Number(lat)) && !isNaN(Number(lon));

    return (
        <div className="space-y-5">
            {/* Map */}
            {hasCoordinates && (
                <div className="rounded-xl overflow-hidden border border-border-light shadow-sm">
                    <MapWithDraggableMarker
                        lat={Number(lat)}
                        lon={Number(lon)}
                        onMove={onMapMove}
                    />
                </div>
            )}

            {!hasCoordinates && (
                <div className="h-[250px] bg-surface-light rounded-xl border-2 border-dashed border-border-light flex items-center justify-center">
                    <div className="text-center text-text-light">
                        <PinIcon className="w-10 h-10 mx-auto mb-2 text-text-light/50" />
                        <p className="text-sm">Enter an address to show the map</p>
                    </div>
                </div>
            )}

            {/* Address Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                    label="Street"
                    name="address.street"
                    value={address.street}
                    onChange={(e) => onAddressChange("street", e.target.value)}
                    placeholder="123 Main Street"
                />
                {showAllFields && (
                    <FormInput
                        label="House/Unit Number"
                        name="address.housenumber"
                        value={address.housenumber}
                        onChange={(e) => onAddressChange("housenumber", e.target.value)}
                        placeholder="Apt 4B"
                    />
                )}
                <FormInput
                    label="City"
                    name="address.city"
                    value={address.city}
                    onChange={(e) => onAddressChange("city", e.target.value)}
                    placeholder="San Francisco"
                />
                {showAllFields && (
                    <>
                        <FormInput
                            label="State/Province"
                            name="address.state"
                            value={address.state}
                            onChange={(e) => onAddressChange("state", e.target.value)}
                            placeholder="California"
                        />
                        <FormInput
                            label="Postal Code"
                            name="address.postcode"
                            value={address.postcode}
                            onChange={(e) => onAddressChange("postcode", e.target.value)}
                            placeholder="94102"
                        />
                        <FormInput
                            label="Country"
                            name="address.country"
                            value={address.country}
                            onChange={(e) => onAddressChange("country", e.target.value)}
                            placeholder="United States"
                        />
                    </>
                )}
            </div>

            {/* Coordinates Display */}
            {hasCoordinates && (
                <div className="flex items-center gap-4 text-xs text-text-light bg-surface-light rounded-lg px-3 py-2">
                    <span>
                        <span className="font-medium">Lat:</span> {Number(lat).toFixed(6)}
                    </span>
                    <span>
                        <span className="font-medium">Lon:</span> {Number(lon).toFixed(6)}
                    </span>
                    <span className="text-text-light/60">Drag the marker to adjust position</span>
                </div>
            )}
        </div>
    );
}
