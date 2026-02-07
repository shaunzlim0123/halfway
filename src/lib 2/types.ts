export interface SessionData {
  id: string;
  status:
    | "waiting_for_b"
    | "ready_to_compute"
    | "computing"
    | "voting"
    | "completed";
  userALat: number;
  userALng: number;
  userALabel: string | null;
  userBLat: number | null;
  userBLng: number | null;
  userBLabel: string | null;
  midpointLat: number | null;
  midpointLng: number | null;
  userATravelTime: number | null;
  userBTravelTime: number | null;
  travelMode: string;
  winnerVenueId: string | null;
  pinCode: string | null;
  warning: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueData {
  id: string;
  sessionId: string;
  googlePlaceId: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  rating: number;
  userRatingCount: number;
  priceLevel: string | null;
  googleMapsUri: string | null;
  types: string | null;
  description: string | null;
  cuisineTags: string | null;
  vibeTags: string | null;
  bestFor: string | null;
  signatureDish: string | null;
}

export interface VoteData {
  id: string;
  sessionId: string;
  venueId: string;
  voter: "user_a" | "user_b";
  createdAt: string;
}

export interface SessionWithVenuesAndVotes extends SessionData {
  venues: VenueData[];
  votes: VoteData[];
}
