"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useSessionPolling } from "@/hooks/useSessionPolling";
import ShareLink from "@/components/ShareLink";
import SessionStatus from "@/components/SessionStatus";

const MapPinDrop = dynamic(() => import("@/components/MapPinDrop"), {
  ssr: false,
  loading: () => (
    <div className="map-wrapper w-full h-[600px] skeleton flex items-center justify-center">
      <div className="meridian-spinner w-8 h-8" />
    </div>
  ),
});

const MapDisplay = dynamic(() => import("@/components/MapDisplay"), {
  ssr: false,
  loading: () => (
    <div className="map-wrapper w-full h-[600px] skeleton flex items-center justify-center">
      <div className="meridian-spinner w-8 h-8" />
    </div>
  ),
});

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { session, error, loading, expired } = useSessionPolling(id);
  const [role, setRole] = useState<"user_a" | "user_b" | null>(null);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pinCode, setPinCode] = useState("");
  const [pinVerified, setPinVerified] = useState(false);
  const [storedPinCode, setStoredPinCode] = useState<string | null>(null);

  // Determine role from localStorage or URL param
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const params = new URLSearchParams(window.location.search);
    const forceRole = params.get("role");

    try {
      if (forceRole === "b") {
        localStorage.setItem(`session_${id}_role`, "user_b");
        setRole("user_b");
        return;
      }

      const storedRole = localStorage.getItem(`session_${id}_role`);
      if (storedRole === "user_a" || storedRole === "user_b") {
        setRole(storedRole);
      } else if (session && session.status === "waiting_for_b") {
        localStorage.setItem(`session_${id}_role`, "user_b");
        setRole("user_b");
      }
    } catch (err) {
      // localStorage may not be available (SSR, private browsing)
      console.warn("Could not access localStorage:", err);
    }

    // Load stored PIN for User A display
    try {
      const savedPin = localStorage.getItem(`session_${id}_pin`);
      if (savedPin) {
        setStoredPinCode(savedPin);
      }
    } catch (err) {
      // localStorage may not be available (SSR, private browsing)
      console.warn("Could not access localStorage:", err);
    }
  }, [id, session]);

  // Redirect to vote page when voting starts
  useEffect(() => {
    if (
      session &&
      (session.status === "voting" || session.status === "completed")
    ) {
      router.push(`/session/${id}/vote`);
    }
  }, [session, id, router]);

  const handleJoinAndCompute = useCallback(async () => {
    if (!pin) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Join session with PIN
      const joinRes = await fetch(`/api/sessions/${id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: pin.lat, lng: pin.lng, pinCode }),
      });

      if (!joinRes.ok) {
        const data = await joinRes.json();
        throw new Error(data.error || "Failed to join session");
      }

      // Trigger computation
      const computeRes = await fetch(`/api/sessions/${id}/compute`, {
        method: "POST",
      });

      if (!computeRes.ok) {
        const data = await computeRes.json();
        throw new Error(data.error || "Failed to compute midpoint");
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  }, [pin, id, pinCode]);

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

  const shareUrl = `${
    process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
  }/session/${id}?role=b`;

  // User A waiting for User B
  if (role === "user_a" && session.status === "waiting_for_b") {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <SessionStatus status={session.status} />
        <ShareLink url={shareUrl} pinCode={storedPinCode || session.pinCode} />
        <div className="map-wrapper">
          <MapDisplay
            markers={[
              {
                lat: session.userALat,
                lng: session.userALng,
                label: session.userALabel || "Your location",
                type: "userA",
              },
            ]}
          />
        </div>
        <p className="text-sm text-text-muted text-center">
          This page will auto-update when your friend joins.
        </p>
      </div>
    );
  }

  // User A sees computing state
  if (role === "user_a" && session.status === "computing") {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <SessionStatus status={session.status} />
        <div className="map-wrapper">
          <MapDisplay
            markers={[
              {
                lat: session.userALat,
                lng: session.userALng,
                label: "Your location",
                type: "userA",
              },
              ...(session.userBLat != null && session.userBLng != null
                ? [
                    {
                      lat: session.userBLat,
                      lng: session.userBLng,
                      label: "Friend's location",
                      type: "userB" as const,
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </div>
    );
  }

  // User B needs to drop pin — show PIN entry first if not verified
  if (role === "user_b" && session.status === "waiting_for_b") {
    if (!pinVerified) {
      return (
        <div className="max-w-sm mx-auto space-y-6 py-12 animate-fade-in-up">
          <div className="text-center space-y-2">
            <h2 className="font-display text-2xl text-text-primary">
              Enter Session PIN
            </h2>
            <p className="text-text-secondary text-sm">
              Ask your friend for the 4-digit PIN to join this session.
            </p>
          </div>

          <div className="flex justify-center">
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="0000"
              className="text-center text-3xl font-mono font-bold tracking-[0.5em] w-48 py-3 bg-card border border-border rounded-xl text-saffron placeholder:text-text-muted/30 focus:outline-none focus:border-saffron/50 focus:ring-1 focus:ring-saffron/30"
            />
          </div>

          {submitError && (
            <div className="text-sm text-coral bg-coral/10 border border-coral/20 p-3 rounded-lg text-center">
              {submitError}
            </div>
          )}

          <button
            onClick={() => {
              if (pinCode.length === 4) {
                setSubmitError(null);
                setPinVerified(true);
              }
            }}
            disabled={pinCode.length !== 4}
            className="btn-primary w-full py-3 rounded-xl text-lg"
          >
            Continue
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="text-center space-y-2">
          <h2 className="font-display text-2xl text-text-primary">
            Your friend is waiting!
          </h2>
          <p className="text-text-secondary">
            Drop your pin on the map, then we&apos;ll find the perfect meeting
            spot.
          </p>
        </div>

        <div className="map-wrapper">
          <MapPinDrop
            onPinDrop={(lat, lng) => setPin({ lat, lng })}
            initialCenter={{ lat: session.userALat, lng: session.userALng }}
          />
        </div>

        {pin && (
          <p className="text-xs text-text-muted font-mono">
            {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
          </p>
        )}

        {submitError && (
          <div className="text-sm text-coral bg-coral/10 border border-coral/20 p-3 rounded-lg">
            {submitError}
          </div>
        )}

        <button
          onClick={handleJoinAndCompute}
          disabled={!pin || submitting}
          className="btn-primary w-full py-3.5 rounded-xl text-lg"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="meridian-spinner w-5 h-5 !border-deep/30 !border-t-deep" />
              Finding your midpoint...
            </span>
          ) : (
            "Find Our Midpoint"
          )}
        </button>
      </div>
    );
  }

  // User B sees computing state
  if (role === "user_b" && session.status === "computing") {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <SessionStatus status={session.status} />
        <div className="map-wrapper">
          <MapDisplay
            markers={[
              {
                lat: session.userALat,
                lng: session.userALng,
                label: "Friend's location",
                type: "userA",
              },
              ...(session.userBLat != null && session.userBLng != null
                ? [
                    {
                      lat: session.userBLat,
                      lng: session.userBLng,
                      label: "Your location",
                      type: "userB" as const,
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </div>
    );
  }

  // Fallback / ready_to_compute (shouldn't stay here long)
  return (
    <div className="space-y-6 animate-fade-in-up">
      <SessionStatus status={session.status} />
      <p className="text-text-muted text-center">Processing...</p>
    </div>
  );
}
