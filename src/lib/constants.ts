export const GOOGLE_PLACES_URL =
  "https://places.googleapis.com/v1/places:searchNearby";
export const GOOGLE_DISTANCE_MATRIX_URL =
  "https://maps.googleapis.com/maps/api/distancematrix/json";
export const GOOGLE_GEOCODING_URL =
  "https://maps.googleapis.com/maps/api/geocode/json";

export const INITIAL_SEARCH_RADIUS = 800;
export const MAX_SEARCH_RADIUS = 3000;
export const RADIUS_MULTIPLIER = 1.5;
export const MIN_VENUES = 5;
export const MAX_VENUES = 8;

export const MIN_RATING = 4.0;
export const MIN_REVIEWS = 50;
export const RELAXED_MIN_RATING = 3.8;
export const RELAXED_MIN_REVIEWS = 30;

export const MIDPOINT_MAX_ITERATIONS = 3;
export const MIDPOINT_CONVERGENCE_THRESHOLD = 0.1;
export const MIDPOINT_DAMPING_FACTOR = 0.3;

export const POLLING_INTERVAL_MS = 3000;

export const VENUE_TYPES = ["restaurant", "cafe"];

export const DEFAULT_CENTER: { lat: number; lng: number } = {
  lat: -33.8568,
  lng: 151.2153,
}; // Sydney Opera House

export const LONG_DISTANCE_THRESHOLD = 3600; // 60 min in seconds

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Dark map style matching the Meridian theme
export const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0a0f1a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0f1a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#4a5672" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#2a3655" }],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4a5672" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#131b2e" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#1a2340" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7e8ca3" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#131b2e" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#5de5d5" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1a2340" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#2a3655" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7e8ca3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#c48a2a" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e8a838" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#eae4dc" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1a2340" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7e8ca3" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0d1525" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#2a3655" }],
  },
];
