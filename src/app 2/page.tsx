"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const MapPinDrop = dynamic(() => import("@/components/MapPinDrop"), {
  ssr: false,
  loading: () => (
    <div className="map-wrapper w-full h-[450px] skeleton flex items-center justify-center">
      <div className="meridian-spinner w-8 h-8" />
    </div>
  ),
});

export default function HomePage() {
  const router = useRouter();
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateSession = async () => {
    if (!pin) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: pin.lat, lng: pin.lng }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create session");
      }

      try {
        localStorage.setItem(`session_${data.sessionId}_role`, "user_a");
        if (data.pinCode) {
          localStorage.setItem(`session_${data.sessionId}_pin`, data.pinCode);
        }
      } catch (err) {
        // localStorage may not be available (private browsing)
        console.warn("Could not save to localStorage:", err);
      }
      router.push(`/session/${data.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="text-center space-y-5 animate-fade-in-up">
        <h1 className="font-display text-5xl sm:text-6xl text-text-primary tracking-tight leading-tight">
          Find Your
          <span className="text-saffron"> Halfway </span>
          Point
        </h1>
        <p className="text-text-secondary max-w-md mx-auto text-lg font-light leading-relaxed">
          Drop your pin. Share the link. We&apos;ll find the fairest spot
          to meet&nbsp;&mdash;&nbsp;with the best places to eat.
        </p>
      </div>

      {/* Map + CTA */}
      <div className="space-y-5 animate-fade-in-up stagger-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-saffron/15 text-saffron text-sm font-mono font-medium">
            1
          </div>
          <p className="text-text-secondary text-sm">
            Click the map to drop your pin
          </p>
        </div>

        <div className="map-wrapper">
          <MapPinDrop onPinDrop={(lat, lng) => setPin({ lat, lng })} />
        </div>

        {pin && (
          <p className="text-xs text-text-muted font-mono animate-fade-in">
            {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
          </p>
        )}

        {error && (
          <div className="text-sm text-coral bg-coral/10 border border-coral/20 p-3 rounded-lg animate-fade-in">
            {error}
          </div>
        )}

        <button
          onClick={handleCreateSession}
          disabled={!pin || loading}
          className="btn-primary w-full py-3.5 rounded-xl text-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="meridian-spinner w-5 h-5 !border-deep/30 !border-t-deep" />
              Creating...
            </span>
          ) : (
            "Generate Link for Friend"
          )}
        </button>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 border-t border-border/30 animate-fade-in-up stagger-4">
        {[
          {
            step: "1",
            title: "Drop your pin",
            desc: "Mark where you are on the map",
          },
          {
            step: "2",
            title: "Share the link",
            desc: "Your friend drops their pin too",
          },
          {
            step: "3",
            title: "Pick a spot",
            desc: "Vote on curated venues at the midpoint",
          },
        ].map((item) => (
          <div key={item.step} className="text-center space-y-2.5 py-6">
            <div className="w-10 h-10 rounded-full border border-border text-text-muted text-sm font-mono flex items-center justify-center mx-auto">
              {item.step}
            </div>
            <h3 className="font-display text-lg text-text-primary">
              {item.title}
            </h3>
            <p className="text-text-secondary text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
