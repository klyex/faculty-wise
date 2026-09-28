"use client";

import React from "react";
import { Room } from "@/lib/types/room.types";
import { RoomCard } from "./RoomCard";

interface RoomGridProps {
  rooms: Room[];
  isAdmin?: boolean;
  onEdit?: (room: Room) => void;
  onDelete?: (roomId: string) => void;
}

export function RoomGrid({ rooms, isAdmin, onEdit, onDelete }: RoomGridProps) {
  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-surface-alt/20 rounded-2xl border border-dashed border-border">
        <p className="text-text-muted">No rooms found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {rooms.map((room) => (
        <RoomCard 
          key={room.id} 
          room={room} 
          isAdmin={isAdmin}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
