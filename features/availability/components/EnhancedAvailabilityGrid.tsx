"use client";

import React, { useState } from "react";
import { DayOfWeek, AvailabilityStatus, AvailabilitySlot } from "@/features/availability/availability.service";
import { availabilityService } from "@/features/availability/availability.service";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

interface EnhancedAvailabilityGridProps {
  slots: AvailabilitySlot[];
  onSlotsChange: (slots: AvailabilitySlot[]) => void;
  readOnly?: boolean;
  showStats?: boolean;
}

export function EnhancedAvailabilityGrid({
  slots,
  onSlotsChange,
  readOnly = false,
  showStats = true,
}: EnhancedAvailabilityGridProps) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("Monday");

  const toggleSlot = (day: DayOfWeek, startHour: number) => {
    const slotIndex = slots.findIndex(
      (s) => s.day === day && s.startTime === `${startHour.toString().padStart(2, "0")}:00`
    );

    if (slotIndex !== -1) {
      const newSlots = [...slots];
      newSlots[slotIndex].status = availabilityService.toggleSlotStatus(
        newSlots[slotIndex].status
      );
      onSlotsChange(newSlots);
    }
  };

  const getSlotStatus = (day: DayOfWeek, hour: number): AvailabilityStatus => {
    const slot = slots.find(
      (s) => s.day === day && s.startTime === `${hour.toString().padStart(2, "0")}:00`
    );
    return slot?.status || "unavailable";
  };

  const availableHours = availabilityService.calculateAvailableHours(slots);
  const preferredCount = slots.filter((s) => s.status === "preferred").length;
  const availableCount = slots.filter((s) => s.status === "available").length;

  const dayIndex = DAYS.indexOf(selectedDay);
  const prevDay = dayIndex > 0 ? DAYS[dayIndex - 1] : null;
  const nextDay = dayIndex < DAYS.length - 1 ? DAYS[dayIndex + 1] : null;

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      {showStats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Total Available</p>
            <p className="text-2xl font-bold text-emerald-900">{availableHours.toFixed(1)}h</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs text-blue-700 font-bold uppercase tracking-wider">Preferred Slots</p>
            <p className="text-2xl font-bold text-blue-900">{preferredCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Available Slots</p>
            <p className="text-2xl font-bold text-amber-900">{availableCount}</p>
          </div>
        </div>
      )}

      {/* Day Selector */}
      <div className="flex items-center gap-2 bg-surface-alt/50 rounded-lg p-3 border border-border/50">
        <button
          onClick={() => prevDay && setSelectedDay(prevDay)}
          disabled={!prevDay}
          className="p-1.5 rounded hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex-1 text-center">
          <p className="text-sm font-bold text-text">{selectedDay}</p>
          <p className="text-xs text-text-muted">
            {slots
              .filter((s) => s.day === selectedDay && s.status !== "unavailable")
              .length.toString()
              .padStart(2, "0")}/{slots.filter((s) => s.day === selectedDay).length} hours
          </p>
        </div>

        <button
          onClick={() => nextDay && setSelectedDay(nextDay)}
          disabled={!nextDay}
          className="p-1.5 rounded hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Grid View - Single Day */}
      <div className="rounded-lg border border-border overflow-hidden bg-white shadow-sm">
        <div className="divide-y divide-border">
          {HOURS.map((hour) => {
            const status = getSlotStatus(selectedDay, hour);
            const ampm = hour < 12 ? "AM" : "PM";
            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

            return (
              <button
                key={hour}
                onClick={() => !readOnly && toggleSlot(selectedDay, hour)}
                disabled={readOnly}
                className={cn(
                  "w-full p-4 text-left transition-colors hover:bg-opacity-75",
                  status === "preferred"
                    ? "bg-emerald-100 border-l-4 border-emerald-500"
                    : status === "available"
                      ? "bg-blue-100 border-l-4 border-blue-400"
                      : "bg-gray-50 border-l-4 border-transparent hover:bg-gray-100",
                  readOnly && "cursor-default"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-text">
                      {`${displayHour}:00 ${ampm}`}
                    </p>
                    <p className="text-xs text-text-muted">
                      {availabilityService.getStatusDescription(status)}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "h-6 w-6 rounded border-2",
                      availabilityService.getStatusColor(status)
                    )}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Full Week View (compact) */}
      <div className="rounded-lg border border-border overflow-x-auto bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-alt/50 border-b border-border">
              <th className="px-4 py-2 text-left text-xs font-bold text-text-muted uppercase tracking-wider min-w-[80px]">
                Time
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className={cn(
                    "px-3 py-2 text-center text-xs font-bold uppercase tracking-wider min-w-[60px]",
                    day === selectedDay ? "bg-primary/10 text-primary" : "text-text-muted"
                  )}
                >
                  {day.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {HOURS.map((hour) => (
              <tr key={hour} className="hover:bg-primary/5 transition-colors">
                <td className="px-4 py-2 text-right text-xs font-medium text-text-muted bg-surface-alt/20">
                  {`${(hour > 12 ? hour - 12 : hour).toString().padStart(2, "0")}:00`}
                </td>
                {DAYS.map((day) => {
                  const status = getSlotStatus(day, hour);
                  return (
                    <td key={day} className="p-1 text-center">
                      <button
                        onClick={() => !readOnly && toggleSlot(day, hour)}
                        disabled={readOnly}
                        className={cn(
                          "w-full h-8 rounded text-xs font-bold transition-all mx-auto",
                          availabilityService.getStatusColor(status),
                          readOnly && "cursor-default opacity-75"
                        )}
                        title={availabilityService.getStatusDescription(status)}
                      >
                        {status === "preferred" ? "P" : status === "available" ? "A" : "–"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex gap-4 justify-center text-xs p-3 rounded-lg bg-surface-alt/50 border border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500" />
          <span className="text-text-muted">Preferred</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-400" />
          <span className="text-text-muted">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-200" />
          <span className="text-text-muted">Unavailable</span>
        </div>
      </div>
    </div>
  );
}
