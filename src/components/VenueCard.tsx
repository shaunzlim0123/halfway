"use client";

import { VenueData } from "@/lib/types";

interface VenueCardProps {
  venue: VenueData;
  isSelected: boolean;
  onSelect: (venueId: string) => void;
  disabled: boolean;
  isWinner?: boolean;
}

function parseTags(json: string | null): string[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

function getPriceLevelDisplay(level: string | null): string {
  switch (level) {
    case "PRICE_LEVEL_INEXPENSIVE":
      return "$";
    case "PRICE_LEVEL_MODERATE":
      return "$$";
    case "PRICE_LEVEL_EXPENSIVE":
      return "$$$";
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return "$$$$";
    default:
      return "";
  }
}

export default function VenueCard({
  venue,
  isSelected,
  onSelect,
  disabled,
  isWinner,
}: VenueCardProps) {
  const cuisineTags = parseTags(venue.cuisineTags);
  const vibeTags = parseTags(venue.vibeTags);
  const bestFor = parseTags(venue.bestFor);
  const priceDisplay = getPriceLevelDisplay(venue.priceLevel);

  return (
    <div
      onClick={() => !disabled && onSelect(venue.id)}
      className={`
        relative rounded-xl border-2 p-5 transition-all cursor-pointer
        ${isWinner ? "border-saffron bg-saffron/10 ring-2 ring-saffron/30" : ""}
        ${isSelected && !isWinner ? "border-mint bg-mint/10 ring-2 ring-mint/30" : ""}
        ${!isSelected && !isWinner ? "border-border bg-card hover:border-border hover:bg-card-hover" : ""}
        ${disabled ? "cursor-default" : "hover:shadow-lg hover:shadow-black/20"}
      `}
    >
      {isWinner && (
        <div className="absolute -top-3 -right-3 bg-saffron text-deep text-xs font-bold px-3 py-1 rounded-full">
          WINNER
        </div>
      )}

      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-text-primary">{venue.name}</h3>
        <div className="flex items-center gap-2 text-sm shrink-0 ml-2">
          <span className="text-saffron font-medium">
            {venue.rating.toFixed(1)} ★
          </span>
          <span className="text-text-muted">
            ({venue.userRatingCount.toLocaleString()})
          </span>
          {priceDisplay && (
            <span className="text-mint font-medium">{priceDisplay}</span>
          )}
        </div>
      </div>

      {venue.description && (
        <p className="text-sm text-text-secondary mb-3">{venue.description}</p>
      )}

      {venue.signatureDish && (
        <p className="text-sm text-saffron-dim mb-3">
          <span className="font-medium">Likely known for:</span>{" "}
          {venue.signatureDish}
        </p>
      )}

      {cuisineTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {cuisineTags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-saffron/15 text-saffron text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {vibeTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {vibeTags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-mint/15 text-mint text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {bestFor.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {bestFor.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-text-muted/15 text-text-secondary text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {venue.address && (
        <p className="text-xs text-text-muted mt-2">{venue.address}</p>
      )}

      {venue.googleMapsUri && (
        <a
          href={venue.googleMapsUri}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-saffron hover:underline mt-1 inline-block"
        >
          Open in Google Maps
        </a>
      )}
    </div>
  );
}
