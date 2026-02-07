"use client";

import { useState, useCallback, useRef } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { DEFAULT_CENTER, DARK_MAP_STYLE } from "@/lib/constants";

const containerStyle = {
  width: "100%",
  height: "600px",
};

interface MapPinDropProps {
  onPinDrop: (lat: number, lng: number) => void;
  initialCenter?: { lat: number; lng: number };
  existingPin?: { lat: number; lng: number } | null;
}

export default function MapPinDrop({
  onPinDrop,
  initialCenter = DEFAULT_CENTER,
  existingPin,
}: MapPinDropProps) {
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    existingPin || null
  );
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const handleClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setPin({ lat, lng });
      onPinDrop(lat, lng);
    },
    [onPinDrop]
  );

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  if (!isLoaded) {
    return (
      <div className="w-full h-[600px] rounded-lg skeleton flex items-center justify-center">
        <div className="meridian-spinner w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={initialCenter}
        zoom={13}
        onClick={handleClick}
        onLoad={onLoad}
        options={{
          styles: DARK_MAP_STYLE,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {pin && <Marker position={pin} />}
      </GoogleMap>
    </div>
  );
}
