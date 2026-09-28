"use client";

import React from "react";
import { AvailabilityStatus } from "@/lib/types/availability.types";

const statusConfig: Record<AvailabilityStatus, { label: string; className: string }> = {
  preferred: { label: "Preferred", className: "bg-primary border-primary shadow-sm" },
  available: { label: "Available", className: "bg-emerald-500/20 border-emerald-500/30" },
  unavailable: { label: "Unavailable", className: "bg-surface-alt border-border" },
};

export function AvailabilityLegend() {
  return (
    <div className="flex flex-wrap gap-6 p-4 rounded-xl border border-border bg-white/50 backdrop-blur-sm">
      {(Object.entries(statusConfig) as [AvailabilityStatus, typeof statusConfig["preferred"]][]).map(([key, config]) => (
        <div key={key} className="flex items-center gap-2">
          <div className={`h-4 w-4 rounded border ${config.className}`} />
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{config.label}</span>
        </div>
      ))}
    </div>
  );
}
