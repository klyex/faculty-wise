"use client";

import React, { useState } from "react";
import { DayOfWeek, AvailabilityStatus } from "@/lib/types/availability.types";
import { cn } from "@/lib/utils";

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

interface AvailabilityGridProps {
  initialSlots?: Record<string, AvailabilityStatus>;
}

export function AvailabilityGrid({ initialSlots = {} }: AvailabilityGridProps) {
  const [slots, setSlots] = useState<Record<string, AvailabilityStatus>>(initialSlots);

  const toggleSlot = (day: string, hour: number) => {
    const key = `${day}-${hour}`;
    setSlots((prev) => {
      const current = prev[key] || "unavailable";
      const next: AvailabilityStatus = 
        current === "unavailable" ? "available" :
        current === "available" ? "preferred" : "unavailable";
      
      return { ...prev, [key]: next };
    });
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-surface-alt/50 border-b border-border">
            <th className="p-4 text-left text-[10px] font-bold text-text-muted uppercase tracking-widest border-r border-border min-w-[100px]">Time</th>
            {DAYS.map((day) => (
              <th key={day} className="p-4 text-center text-[10px] font-bold text-text-muted uppercase tracking-widest min-w-[120px]">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {HOURS.map((hour) => (
            <tr key={hour} className="group hover:bg-primary/5 transition-colors">
              <td className="p-3 text-center border-r border-border bg-surface-alt/20">
                <span className="text-xs font-bold text-text-muted">
                  {hour > 12 ? `${hour - 12} PM` : `${hour} ${hour === 12 ? 'PM' : 'AM'}`}
                </span>
              </td>
              {DAYS.map((day) => {
                const key = `${day}-${hour}`;
                const status = slots[key] || "unavailable";
                
                return (
                  <td 
                    key={day} 
                    className="p-1 h-14"
                    onClick={() => toggleSlot(day, hour)}
                  >
                    <div className={cn(
                      "w-full h-full rounded-lg border-2 transition-all cursor-pointer flex items-center justify-center text-[10px] font-bold uppercase tracking-tighter",
                      status === "preferred" ? "bg-primary text-white border-primary shadow-md scale-[1.02]" :
                      status === "available" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:border-emerald-500/40" :
                      "bg-transparent text-text-muted/0 border-transparent hover:bg-surface-alt/50 hover:text-text-muted/40"
                    )}>
                      {status === "preferred" ? "★ Preferred" : status === "available" ? "✓" : "+"}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
