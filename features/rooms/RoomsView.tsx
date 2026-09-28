"use client";

import React, { useState, useEffect, useMemo } from "react";
import { RoomGrid } from "./components/RoomGrid";
import { Room, RoomType, RoomStatus } from "@/lib/types/room.types";
import { Button } from "@/components/ui/Button";
import { StatTile } from "@/components/ui/StatTile";
import { Plus, Filter, LayoutGrid, List, Loader2, MapPin, Users, Cpu, Monitor, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { roomsService } from "./rooms.service";
import { AddEditRoomModal } from "./components/AddEditRoomModal";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

const statusConfig: Record<RoomStatus, { label: string; className: string }> = {
  available: { label: "Available", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  occupied: { label: "Occupied", className: "bg-rose-100 text-rose-700 border-rose-200" },
  maintenance: { label: "Maintenance", className: "bg-amber-100 text-amber-700 border-amber-200" },
};

export default function RoomsView() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Layout States
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = roomsService.subscribeRooms((data) => {
      setRooms(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Compute unique buildings dynamically
  const buildingsList = useMemo(() => {
    const buildings = rooms.map(r => r.building).filter(Boolean);
    return Array.from(new Set(buildings)).sort();
  }, [rooms]);

  // Handle Search and Filter logic
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesSearch = 
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.building.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesBuilding = selectedBuilding === "all" || room.building === selectedBuilding;
      const matchesType = selectedType === "all" || room.type === selectedType;

      return matchesSearch && matchesBuilding && matchesType;
    });
  }, [rooms, searchQuery, selectedBuilding, selectedType]);

  // Derived real-time stats
  const stats = useMemo(() => {
    return {
      total: rooms.length,
      available: rooms.filter(r => r.status === "available").length,
      occupied: rooms.filter(r => r.status === "occupied").length,
      maintenance: rooms.filter(r => r.status === "maintenance").length,
    };
  }, [rooms]);

  const handleAddRoom = () => {
    setRoomToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditRoom = (room: Room) => {
    setRoomToEdit(room);
    setIsModalOpen(true);
  };

  const handleDeleteRoom = async (roomId: string) => {
    setDeleteConfirmId(roomId);
  };

  const confirmDeleteRoom = async () => {
    if (!deleteConfirmId) return;
    try {
      await roomsService.deleteRoom(deleteConfirmId, profile || undefined);
      toast.success("Room Deleted", "The room was successfully deleted.");
    } catch (error) {
      console.error("Failed to delete room:", error);
      toast.error("Deletion Failed", "Failed to delete the room.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-text-muted text-sm font-medium">Synchronizing resources in real-time...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif">Rooms & Labs</h1>
          <p className="text-text-muted mt-1">Monitor and manage physical resources and laboratory environments.</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleAddRoom}
              className="gap-2 bg-primary hover:bg-primary-strong transition-all shadow-md h-12 px-6 rounded-2xl"
            >
              <Plus className="h-5 w-5" /> Add Room
            </Button>
          </div>
        )}
      </div>

      {/* Real-time stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatTile title="Total Resources" value={stats.total.toString()} icon={LayoutGrid} />
        <StatTile title="Available Now" value={stats.available.toString()} icon={LayoutGrid} />
        <StatTile title="Currently Occupied" value={stats.occupied.toString()} icon={LayoutGrid} />
        <StatTile title="In Maintenance" value={stats.maintenance.toString()} icon={LayoutGrid} />
      </div>

      {/* Filter and control bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-4 rounded-3xl bg-white/50 border border-border/50 shadow-sm backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <input 
            type="text" 
            placeholder="Search room, building..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-full md:w-60 text-text"
          />

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted shrink-0" />
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="pl-3 pr-8 py-2 bg-white border border-border rounded-xl text-sm text-text-muted outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer appearance-none min-w-[150px]"
            >
              <option value="all">All Buildings</option>
              {buildingsList.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="pl-3 pr-8 py-2 bg-white border border-border rounded-xl text-sm text-text-muted outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer appearance-none min-w-[150px]"
            >
              <option value="all">All Types</option>
              <option value="lecture">Lecture Hall</option>
              <option value="laboratory">Computer Lab</option>
              <option value="seminar">Seminar Room</option>
              <option value="auditorium">Auditorium</option>
            </select>
          </div>
        </div>

        {/* Layout View Toggles */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-alt/50 rounded-xl border border-border self-end lg:self-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode("grid")}
            className={cn("h-8 w-8 p-0 rounded-lg", viewMode === "grid" ? "bg-white shadow-sm border border-border" : "text-text-muted")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode("list")}
            className={cn("h-8 w-8 p-0 rounded-lg", viewMode === "list" ? "bg-white shadow-sm border border-border" : "text-text-muted")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Render Room layout (Grid vs List) */}
      {viewMode === "grid" ? (
        <RoomGrid 
          rooms={filteredRooms} 
          isAdmin={isAdmin}
          onEdit={handleEditRoom}
          onDelete={handleDeleteRoom}
        />
      ) : (
        <div className="border border-border/50 rounded-[2rem] overflow-hidden bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-alt/30">
                  <th className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Room Name</th>
                  <th className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Building & Floor</th>
                  <th className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Type</th>
                  <th className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Capacity</th>
                  <th className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                  {isAdmin && <th className="px-8 py-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRooms.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="px-8 py-20 text-center text-text-muted">
                      No rooms found matching your search or filters.
                    </td>
                  </tr>
                ) : (
                  filteredRooms.map((room) => (
                    <tr key={room.id} className="group hover:bg-surface-alt/30 transition-colors">
                      <td className="px-8 py-4 font-bold text-text">{room.name}</td>
                      <td className="px-8 py-4 text-sm text-text-muted">
                        {room.building} • Floor {room.floor}
                      </td>
                      <td className="px-8 py-4 capitalize text-sm font-semibold text-text">{room.type}</td>
                      <td className="px-8 py-4 text-sm font-semibold text-text">{room.capacity} Pax</td>
                      <td className="px-8 py-4">
                        <Badge variant="outline" className={statusConfig[room.status].className}>
                          {statusConfig[room.status].label}
                        </Badge>
                      </td>
                      {isAdmin && (
                        <td className="px-8 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditRoom(room)}
                              className="p-1.5 rounded-lg border border-border bg-white hover:border-primary hover:text-primary transition-all text-text-muted"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRoom(room.id)}
                              className="p-1.5 rounded-lg border border-border bg-white hover:border-danger hover:text-danger transition-all text-text-muted"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddEditRoomModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        roomToEdit={roomToEdit}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDeleteRoom}
        title="Delete Room?"
        message="Are you sure you want to delete this room? This action cannot be undone."
      />
    </div>
  );
}
