"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useSessionPolling } from "@/hooks/useSessionPolling";
import SessionStatus from "@/components/SessionStatus";
import VenueList from "@/components/VenueList";

const MapDisplay = dynamic(() => import("@/components/MapDisplay"), {
  ssr: false,
  loading: () => (
    <div className="map-wrapper w-full h-[600px] skeleton flex items-center justify-center">
      <div className="meridian-spinner w-8 h-8" />
    </div>
  ),
});

export default function VotePage() {
  const { id } = useParams<{ id: string }>();
  const { session, error, loading, expired, refetch } = useSessionPolling(id);
  const [role, setRole] = useState<"user_a" | "user_b" | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  // Get role from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const storedRole = localStorage.getItem(`session_${id}_role`);
      if (storedRole === "user_a" || storedRole === "user_b") {
        setRole(storedRole);
      }
    } catch (err) {
      // localStorage may not be available (SSR, private browsing)
      console.warn("Could not access localStorage:", err);
    }
  }, [id]);

  // Check if we already voted
  useEffect(() => {
    if (session && role) {
      const myVote = session.votes.find((v) => v.voter === role);
      if (myVote) {
        setHasVoted(true);
        setSelectedVenueId(myVote.venueId);
      } else {
        // Reset voting state if vote was removed or session changed
        setHasVoted(false);
        setSelectedVenueId(null);
      }
    } else {
      setHasVoted(false);
      setSelectedVenueId(null);
    }
  }, [session, role]);

  const handleVote = async () => {
    if (!selectedVenueId || !role) return;

    setSubmitting(true);
    setVoteError(null);

    try {
      const res = await fetch(`/api/sessions/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId: selectedVenueId, voter: role }),
      });

      if (res.status === 410) {
        setVoteError("This session has expired.");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit vote");
      }

      setHasVoted(true);
      refetch();
    } catch (err) {
      setVoteError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !session) {
    return (
      <div className="text-center py-12">
        <div className="meridian-spinner w-8 h-8 mx-auto mb-4" />
        <p className="text-text-muted">Loading session...</p>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="text-center py-12 space-y-4 animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-coral/15 flex items-center justify-center mx-auto">
          <span className="text-coral text-2xl">!</span>
        </div>
        <h2 className="font-display text-2xl text-text-primary">Session Expired</h2>
        <p className="text-text-secondary">
          This session has expired. Sessions are valid for 24 hours.
        </p>
        <a
          href="/"
          className="btn-primary inline-block px-6 py-2.5 rounded-xl text-sm"
        >
          Create a new session
        </a>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="text-center py-12 space-y-4 animate-fade-in-up">
        <p className="text-coral">
          {error || "Session not found"}
        </p>
        <a href="/" className="text-saffron hover:underline text-sm">
          Create a new session
        </a>
      </div>
    );
  }

  const isCompleted = session.status === "completed";
  const winnerVenue = isCompleted && session.winnerVenueId
    ? session.venues.find((v) => v.id === session.winnerVenueId) || null
    : null;

  // Build map markers
  const markers = [
    {
      lat: session.userALat,
      lng: session.userALng,
      label: role === "user_a" ? "Your location" : "Friend's location",
      type: "userA" as const,
    },
    ...(session.userBLat != null && session.userBLng != null
      ? [
          {
            lat: session.userBLat,
            lng: session.userBLng,
            label: role === "user_b" ? "Your location" : "Friend's location",
            type: "userB" as const,
          },
        ]
      : []),
    ...(session.midpointLat != null && session.midpointLng != null
      ? [
          {
            lat: session.midpointLat,
            lng: session.midpointLng,
            label: "Midpoint",
            type: "midpoint" as const,
          },
        ]
      : []),
    ...session.venues.map((v) => ({
      lat: v.lat,
      lng: v.lng,
      label: v.name,
      type: "venue" as const,
      venueId: v.id,
    })),
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <SessionStatus
        status={session.status}
        userATravelTime={session.userATravelTime}
        userBTravelTime={session.userBTravelTime}
        warning={session.warning}
      />

      {/* Winner announcement */}
      {isCompleted && winnerVenue && (
        <div className="bg-saffron/10 border-2 border-saffron/30 rounded-xl p-6 text-center space-y-3 animate-fade-in-up">
          <h2 className="font-display text-2xl text-saffron">
            Meet at: {winnerVenue.name}
          </h2>
          {winnerVenue.address && (
            <p className="text-text-secondary">{winnerVenue.address}</p>
          )}
          {winnerVenue.googleMapsUri && (
            <a
              href={winnerVenue.googleMapsUri}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-block px-6 py-2.5 rounded-xl text-sm"
            >
              Open in Google Maps
            </a>
          )}
        </div>
      )}

      <div className="map-wrapper">
        <MapDisplay 
          markers={markers}
          venues={session.venues}
          selectedVenueId={selectedVenueId}
          onVenueSelect={setSelectedVenueId}
          disabled={hasVoted || isCompleted}
          winnerVenueId={session.winnerVenueId}
        />
      </div>

      {/* Venue list - Optional, venues are now shown on map */}
      {session.venues.length > 0 ? (
        <div className="space-y-4">
          <h2 className="font-display text-xl text-text-primary">
            {isCompleted
              ? "All Venues"
              : hasVoted
              ? "Waiting for the other vote..."
              : "Click on venue markers on the map to see details and select"}
          </h2>

          {!hasVoted && !isCompleted && (
            <>
              {voteError && (
                <div className="text-sm text-coral bg-coral/10 border border-coral/20 p-3 rounded-lg">
                  {voteError}
                </div>
              )}
              <button
                onClick={handleVote}
                disabled={!selectedVenueId || submitting}
                className="btn-primary w-full py-3.5 rounded-xl text-lg"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="meridian-spinner w-5 h-5 !border-deep/30 !border-t-deep" />
                    Submitting...
                  </span>
                ) : (
                  "Cast My Vote"
                )}
              </button>
            </>
          )}

          {hasVoted && !isCompleted && (
            <div className="text-center py-4">
              <div className="meridian-spinner w-6 h-6 mx-auto mb-3" />
              <p className="text-text-muted">
                Waiting for the other person to vote...
              </p>
            </div>
          )}

          {/* Optional: Show venue list below map for easier browsing */}
          <div className="mt-6">
            <h3 className="font-display text-lg text-text-primary mb-3">
              Or browse all venues:
            </h3>
            <VenueList
              venues={session.venues}
              selectedVenueId={selectedVenueId}
              onSelect={setSelectedVenueId}
              disabled={hasVoted || isCompleted}
              winnerVenueId={session.winnerVenueId}
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-text-muted">
            No venues found near the midpoint. Try creating a new session with closer locations.
          </p>
        </div>
      )}
    </div>
  );
}
