"use client";

import { VenueData } from "@/lib/types";
import VenueCard from "./VenueCard";

interface VenueListProps {
  venues: VenueData[];
  selectedVenueId: string | null;
  onSelect: (venueId: string) => void;
  disabled: boolean;
  winnerVenueId?: string | null;
}

export default function VenueList({
  venues,
  selectedVenueId,
  onSelect,
  disabled,
  winnerVenueId,
}: VenueListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {venues.map((venue) => (
        <VenueCard
          key={venue.id}
          venue={venue}
          isSelected={selectedVenueId === venue.id}
          onSelect={onSelect}
          disabled={disabled}
          isWinner={winnerVenueId === venue.id}
        />
      ))}
    </div>
  );
}
