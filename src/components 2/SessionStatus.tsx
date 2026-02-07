"use client";

interface SessionStatusProps {
  status: string;
  userATravelTime?: number | null;
  userBTravelTime?: number | null;
  warning?: string | null;
}

function formatTime(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return "< 1 min walk";
  return `${minutes} min walk`;
}

export default function SessionStatus({
  status,
  userATravelTime,
  userBTravelTime,
  warning,
}: SessionStatusProps) {
  const statusConfig: Record<
    string,
    { label: string; color: string; description: string }
  > = {
    waiting_for_b: {
      label: "Waiting",
      color: "bg-saffron/15 text-saffron",
      description: "Waiting for your friend to drop their pin...",
    },
    ready_to_compute: {
      label: "Ready",
      color: "bg-mint/15 text-mint",
      description: "Both locations set! Ready to find your meeting point.",
    },
    computing: {
      label: "Computing",
      color: "bg-saffron/15 text-saffron",
      description: "Finding the fairest midpoint and best venues...",
    },
    voting: {
      label: "Vote",
      color: "bg-mint/15 text-mint",
      description: "Pick your favorite venue!",
    },
    completed: {
      label: "Done",
      color: "bg-text-muted/15 text-text-secondary",
      description: "A winner has been chosen!",
    },
  };

  const config = statusConfig[status] || statusConfig.waiting_for_b;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
        >
          {config.label}
        </span>
        <p className="text-text-secondary text-sm">{config.description}</p>
      </div>

      {status === "computing" && (
        <div className="flex items-center gap-2 text-sm text-saffron">
          <div className="meridian-spinner w-4 h-4" />
          This may take 5-10 seconds...
        </div>
      )}

      {(status === "voting" || status === "completed") &&
        userATravelTime != null &&
        userBTravelTime != null && (
          <div className="flex gap-4 text-sm">
            <span className="text-[#4285F4]">
              You (A): {formatTime(userATravelTime)}
            </span>
            <span className="text-[#EA4335]">
              Friend (B): {formatTime(userBTravelTime)}
            </span>
          </div>
        )}

      {warning && (
        <div className="text-sm text-coral bg-coral/10 border border-coral/20 p-3 rounded-lg">
          {warning}
        </div>
      )}
    </div>
  );
}
