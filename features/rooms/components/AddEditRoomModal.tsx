"use client";

import React, { useState, useEffect } from "react";
import { X, LayoutGrid, CheckCircle2, Cpu, Wrench, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Room, RoomType, RoomStatus } from "@/lib/types/room.types";
import { roomsService } from "../rooms.service";
import { useAuth } from "@/lib/context/AuthContext";

interface AddEditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomToEdit?: Room | null;
}

export function AddEditRoomModal({ isOpen, onClose, roomToEdit }: AddEditRoomModalProps) {
  const [name, setName] = useState("");
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState(1);
  const [capacity, setCapacity] = useState(30);
  const [type, setType] = useState<RoomType>("lecture");
  const [status, setStatus] = useState<RoomStatus>("available");
  const [featuresInput, setFeaturesInput] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { profile } = useAuth();

  useEffect(() => {
    if (roomToEdit) {
      setName(roomToEdit.name);
      setBuilding(roomToEdit.building);
      setFloor(roomToEdit.floor);
      setCapacity(roomToEdit.capacity);
      setType(roomToEdit.type);
      setStatus(roomToEdit.status);
      setFeaturesInput(roomToEdit.features.join(", "));
    } else {
      setName("");
      setBuilding("");
      setFloor(1);
      setCapacity(30);
      setType("lecture");
      setStatus("available");
      setFeaturesInput("");
    }
  }, [roomToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!name.trim()) {
      setError("Room Name is required.");
      setLoading(false);
      return;
    }

    if (!building.trim()) {
      setError("Building Name is required.");
      setLoading(false);
      return;
    }

    const features = featuresInput
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f !== "");

    try {
      if (roomToEdit) {
        await roomsService.updateRoom(
          roomToEdit.id,
          {
            name: name.trim(),
            building: building.trim(),
            floor: Number(floor),
            capacity: Number(capacity),
            type,
            status,
            features,
          },
          profile || undefined
        );
      } else {
        await roomsService.createRoom(
          {
            name: name.trim(),
            building: building.trim(),
            floor: Number(floor),
            capacity: Number(capacity),
            type,
            status,
            features,
          },
          profile || undefined
        );
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save room.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-surface rounded-[2rem] border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="relative p-8">
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 p-2 rounded-full hover:bg-surface-alt transition-colors"
          >
            <X className="h-5 w-5 text-text-muted" />
          </button>

          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-text font-source-serif">
                {roomToEdit ? "Edit Room Details" : "Add Academic Room"}
              </h2>
              <p className="text-text-muted text-sm">Configure physical rooms, lecture halls, or computer laboratories.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted px-1">Room Name / No.</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RM-201, LAB-105"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 px-4 bg-surface-alt border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted px-1">Building</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Building"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className="w-full h-12 px-4 bg-surface-alt border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted px-1">Floor Level</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={floor}
                  onChange={(e) => setFloor(Number(e.target.value))}
                  className="w-full h-12 px-4 bg-surface-alt border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted px-1">Seating Capacity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full h-12 px-4 bg-surface-alt border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={roomToEdit ? "space-y-2" : "space-y-2 sm:col-span-2"}>
                <label className="text-sm font-medium text-text-muted px-1">Room Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as RoomType)}
                  className="w-full h-12 px-4 bg-surface-alt border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text appearance-none cursor-pointer"
                >
                  <option value="lecture">Lecture Hall</option>
                  <option value="laboratory">Computer Laboratory</option>
                  <option value="seminar">Seminar Room</option>
                  <option value="auditorium">Auditorium</option>
                </select>
              </div>

              {roomToEdit && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted px-1">Room Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as RoomStatus)}
                    className="w-full h-12 px-4 bg-surface-alt border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text appearance-none cursor-pointer"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted px-1">Room Features / Equipment</label>
              <input
                type="text"
                placeholder="Smart Board, AC, Projector, High-end PCs (comma separated)"
                value={featuresInput}
                onChange={(e) => setFeaturesInput(e.target.value)}
                className="w-full h-12 px-4 bg-surface-alt border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
              />
            </div>

            <div className="flex gap-3 mt-8">
              <Button 
                type="button" 
                variant="secondary" 
                className="flex-1 rounded-xl h-12"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 rounded-xl h-12"
                disabled={loading}
              >
                {loading ? "Saving..." : roomToEdit ? "Update Room" : "Add Room"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
