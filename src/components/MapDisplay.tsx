"use client";

import { useCallback, useRef } from "react";
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { DEFAULT_CENTER, DARK_MAP_STYLE } from "@/lib/constants";
import { useState } from "react";
import { VenueData } from "@/lib/types";
import VenueCard from "./VenueCard";

const containerStyle = {
  width: "100%",
  height: "600px",
};

// SVG marker URLs for different colors
const MARKER_COLORS: Record<string, string> = {
  userA: "#4285F4",    // blue
  userB: "#EA4335",    // red
  midpoint: "#E8A838", // saffron/gold
  venue: "#34A853",    // green
};

function createMarkerIcon(color: string): google.maps.Symbol {
  return {
    path: "M12 0C5.4 0 0 5.4 0 12c0 7.2 12 24 12 24s12-16.8 12-24C24 5.4 18.6 0 12 0zm0 18c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z",
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 1,
    scale: 1.4,
    anchor: new google.maps.Point(12, 36),
  };
}

interface MarkerData {
  lat: number;
  lng: number;
  label: string;
  type: "userA" | "userB" | "midpoint" | "venue";
  venueId?: string;
}

interface MapDisplayProps {
  markers: MarkerData[];
  center?: { lat: number; lng: number };
  zoom?: number;
  venues?: VenueData[];
  selectedVenueId?: string | null;
  onVenueSelect?: (venueId: string) => void;
  disabled?: boolean;
  winnerVenueId?: string | null;
}

export default function MapDisplay({
  markers,
  center,
  zoom = 13,
  venues = [],
  selectedVenueId = null,
  onVenueSelect,
  disabled = false,
  winnerVenueId = null,
}: MapDisplayProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [activeMarker, setActiveMarker] = useState<number | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const mapCenter = center ||
    (markers.length > 0
      ? {
          lat: markers.reduce((sum, m) => sum + m.lat, 0) / markers.length,
          lng: markers.reduce((sum, m) => sum + m.lng, 0) / markers.length,
        }
      : DEFAULT_CENTER);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      if (markers.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
        map.fitBounds(bounds, 50);
      }
    },
    [markers]
  );

  // Helper to get venue data for a marker
  const getVenueForMarker = (marker: MarkerData): VenueData | undefined => {
    if (marker.type === "venue" && marker.venueId) {
      return venues.find((v) => v.id === marker.venueId);
    }
    return undefined;
  };

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
        center={mapCenter}
        zoom={zoom}
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
        {markers.map((marker, idx) => {
          const venue = getVenueForMarker(marker);
          const isVenue = marker.type === "venue" && venue;
          // Use venueId for venues, otherwise use a combination of type and coordinates
          const markerKey = marker.venueId || `${marker.type}-${marker.lat}-${marker.lng}-${idx}`;
          
          return (
            <Marker
              key={markerKey}
              position={{ lat: marker.lat, lng: marker.lng }}
              icon={createMarkerIcon(MARKER_COLORS[marker.type] || "#4285F4")}
              onClick={() => setActiveMarker(idx)}
            >
              {activeMarker === idx && (
                <InfoWindow 
                  onCloseClick={() => setActiveMarker(null)}
                  options={{
                    maxWidth: 400,
                    pixelOffset: new google.maps.Size(0, -10),
                  }}
                >
                  {isVenue ? (
                    <div className="max-w-sm -m-2" onClick={(e) => e.stopPropagation()}>
                      <VenueCard
                        venue={venue}
                        isSelected={selectedVenueId === venue.id}
                        onSelect={onVenueSelect || (() => {})}
                        disabled={disabled}
                        isWinner={winnerVenueId === venue.id}
                      />
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-gray-900 px-1 py-1">
                      {marker.label}
                    </div>
                  )}
                </InfoWindow>
              )}
            </Marker>
          );
        })}
      </GoogleMap>
    </div>
  );
}
