"use client";

import { useEffect, useRef } from "react";

interface MapWithDraggableMarkerProps {
  lat: number;
  lon: number;
  onMove: (lat: number, lon: number) => void;
}

export default function MapWithDraggableMarker({ lat, lon, onMove }: MapWithDraggableMarkerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: { lat, lng: lon },
        zoom: 16,
        disableDefaultUI: true,
      });
    }

    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({
        position: { lat, lng: lon },
        map: mapInstanceRef.current,
        draggable: true,
      });

      markerRef.current.addListener("dragend", () => {
        const pos = markerRef.current?.getPosition();
        if (pos) onMove(pos.lat(), pos.lng());
      });
    } else {
      markerRef.current.setPosition({ lat, lng: lon });
    }

    mapInstanceRef.current.setCenter({ lat, lng: lon });
  }, [lat, lon, onMove]);

  return <div ref={mapRef} style={{ width: "100%", height: "300px", borderRadius: "12px" }} />;
}
