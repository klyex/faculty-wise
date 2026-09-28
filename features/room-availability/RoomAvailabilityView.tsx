"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getDb } from "@/lib/firebase";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { Room, RoomType, RoomStatus } from "@/lib/types/room.types";
import { Schedule } from "@/lib/types/firestore.types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatTile } from "@/components/ui/StatTile";
import { 
  Loader2, 
  MapPin, 
  Users, 
  Cpu, 
  Monitor, 
  CalendarDays, 
  Clock, 
  Filter, 
  Search, 
  LayoutGrid, 
  Table as TableIcon,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";

// Standard academic days
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Standard hourly blocks for the matrix view
const HOUR_SLOTS = [
  { start: "08:00", end: "09:00", label: "08:00 - 09:00" },
  { start: "09:00", end: "10:00", label: "09:00 - 10:00" },
  { start: "10:00", end: "11:00", label: "10:00 - 11:00" },
  { start: "11:00", end: "12:00", label: "11:00 - 12:00" },
  { start: "12:00", end: "13:00", label: "12:00 - 13:00" },
  { start: "13:00", end: "14:00", label: "13:00 - 14:00" },
  { start: "14:00", end: "15:00", label: "14:00 - 15:00" },
  { start: "15:00", end: "16:00", label: "15:00 - 16:00" },
  { start: "16:00", end: "17:00", label: "16:00 - 17:00" },
  { start: "17:00", end: "18:00", label: "17:00 - 18:00" },
];

// Simulation time options for the dropdown
const SIMULATION_TIMES = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", 
  "16:00", "16:30", "17:00", "17:30", "18:00"
];

interface EnrichedSchedule extends Schedule {
  courseCode: string;
  courseName: string;
  teacherName: string;
  sectionName: string;
}

export function RoomAvailabilityView() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [schedules, setSchedules] = useState<EnrichedSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Layout states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"matrix" | "cards">("matrix");

  // Simulation states
  const [simulatedDay, setSimulatedDay] = useState("Monday");
  const [simulatedTime, setSimulatedTime] = useState("10:00");

  // Sorting & Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Reset to page 1 on filter/search updates
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedBuilding, selectedType, selectedStatus, simulatedDay, simulatedTime]);

  // Load and enrich room & schedule data
  useEffect(() => {
    const db = getDb();
    if (!db) return;

    setLoading(true);

    // Realtime Rooms subscription
    const roomsUnsubscribe = onSnapshot(collection(db, "rooms"), (roomsSnapshot) => {
      const roomsList = roomsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "",
          building: data.building || "",
          floor: Number(data.floor) || 1,
          capacity: Number(data.capacity) || 0,
          type: data.type || "lecture",
          status: data.status || "available",
          features: data.features || [],
          currentClass: data.currentClass || "",
        } as Room;
      });
      setRooms(roomsList);
    });

    // Realtime Schedules subscription and enrichment
    const schedulesUnsubscribe = onSnapshot(collection(db, "schedules"), async (schedulesSnapshot) => {
      const rawSchedules = schedulesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Schedule[];

      const enriched = await Promise.all(
        rawSchedules.map(async (s): Promise<EnrichedSchedule> => {
          let teacherName = s.teacherId;
          let courseCode = s.courseId;
          let courseName = s.courseId;
          let sectionName = "";

          try {
            const teacherDoc = await getDoc(doc(db, "users", s.teacherId));
            if (teacherDoc.exists()) {
              teacherName = teacherDoc.data().displayName || s.teacherId;
            }
          } catch (e) {
            console.error("Failed to retrieve teacher:", e);
          }

          try {
            const offeringDoc = await getDoc(doc(db, "courseOfferings", s.courseId));
            if (offeringDoc.exists()) {
              const offeringData = offeringDoc.data();
              if (offeringData.sectionId) {
                const sectionDoc = await getDoc(doc(db, "sections", offeringData.sectionId));
                if (sectionDoc.exists()) {
                  sectionName = sectionDoc.data().name || "";
                }
              }
              const courseDoc = await getDoc(doc(db, "courses", offeringData.courseId));
              if (courseDoc.exists()) {
                courseCode = courseDoc.data().code || s.courseId;
                courseName = courseDoc.data().name || s.courseId;
              }
            } else {
              const courseDoc = await getDoc(doc(db, "courses", s.courseId));
              if (courseDoc.exists()) {
                courseCode = courseDoc.data().code || s.courseId;
                courseName = courseDoc.data().name || s.courseId;
              }
            }
          } catch (e) {
            console.error("Failed to retrieve course details:", e);
          }

          return {
            ...s,
            courseCode,
            courseName,
            teacherName,
            sectionName,
          };
        })
      );

      setSchedules(enriched);
      setLoading(false);
    });

    return () => {
      roomsUnsubscribe();
      schedulesUnsubscribe();
    };
  }, []);

  // Compute unique buildings dynamically
  const buildingsList = useMemo(() => {
    const list = rooms.map((r) => r.building).filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [rooms]);

  // Helper: check room occupancy status at simulated time
  const getRoomOccupancyAtTime = (room: Room, day: string, timeStr: string) => {
    if (room.status === "maintenance") {
      return { status: "maintenance" as const, classInfo: null };
    }

    const activeClass = schedules.find(
      (s) =>
        s.roomId === room.id &&
        s.dayOfWeek.toLowerCase() === day.toLowerCase() &&
        s.startTime <= timeStr &&
        s.endTime > timeStr
    );

    if (activeClass) {
      return { status: "occupied" as const, classInfo: activeClass };
    }

    return { status: "available" as const, classInfo: null };
  };

  // Filtered rooms list
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesSearch =
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.building.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBuilding = selectedBuilding === "all" || room.building === selectedBuilding;
      const matchesType = selectedType === "all" || room.type === selectedType;

      const { status } = getRoomOccupancyAtTime(room, simulatedDay, simulatedTime);
      const matchesStatus = selectedStatus === "all" || status === selectedStatus;

      return matchesSearch && matchesBuilding && matchesType && matchesStatus;
    });
  }, [rooms, searchQuery, selectedBuilding, selectedType, selectedStatus, simulatedDay, simulatedTime, schedules]);

  const sortedRooms = useMemo(() => {
    return [...filteredRooms].sort((a: any, b: any) => {
      let valA = a[sortField] || "";
      let valB = b[sortField] || "";

      if (sortField === "capacity") {
        valA = Number(a.capacity || 0);
        valB = Number(b.capacity || 0);
      }

      if (typeof valA === "string") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sortOrder === "asc"
          ? (valA > valB ? 1 : -1)
          : (valB > valA ? 1 : -1);
      }
    });
  }, [filteredRooms, sortField, sortOrder]);

  const paginatedRooms = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRooms.slice(start, start + pageSize);
  }, [sortedRooms, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedRooms.length / pageSize);

  // Real-time stats calculated based on the simulated day/time selection
  const stats = useMemo(() => {
    let total = rooms.length;
    let available = 0;
    let occupied = 0;
    let maintenance = 0;

    rooms.forEach((room) => {
      const { status } = getRoomOccupancyAtTime(room, simulatedDay, simulatedTime);
      if (status === "available") available++;
      else if (status === "occupied") occupied++;
      else if (status === "maintenance") maintenance++;
    });

    return { total, available, occupied, maintenance };
  }, [rooms, simulatedDay, simulatedTime, schedules]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-text-muted text-sm font-medium">Synchronizing resource matrix...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif">Room Availability</h1>
          <p className="text-text-muted mt-1">Check, filter, and monitor room occupancy schedules across all time slots.</p>
        </div>
      </div>

      {/* Simulation Controls Panel */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-primary/5 to-info/5 border border-primary/10 shadow-sm relative overflow-hidden backdrop-blur-md">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Play className="h-5 w-5 fill-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text">Time simulation mode</h2>
              <p className="text-xs text-text-muted">Simulate any schedule block to see what rooms are available/occupied.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Day Switcher */}
            <div className="flex bg-surface-alt/70 p-1 rounded-xl border border-border">
              {DAYS_OF_WEEK.map((d) => (
                <button
                  key={d}
                  onClick={() => setSimulatedDay(d)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    simulatedDay === d 
                      ? "bg-white text-primary shadow-sm border border-border/50" 
                      : "text-text-muted hover:text-text"
                  )}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>

            {/* Time Picker */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-border">
              <Clock className="h-4 w-4 text-primary" />
              <select
                value={simulatedTime}
                onChange={(e) => setSimulatedTime(e.target.value)}
                className="text-xs font-bold text-text outline-none bg-transparent cursor-pointer"
              >
                {SIMULATION_TIMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Stats Banner */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatTile 
          title="Total Rooms" 
          value={stats.total} 
          icon={CalendarDays} 
          description="Registered resources"
        />
        <StatTile 
          title="Available Now" 
          value={stats.available} 
          icon={CheckCircle} 
          className="[&_svg]:text-emerald-500"
          description={`Free at ${simulatedDay} ${simulatedTime}`}
        />
        <StatTile 
          title="Occupied Now" 
          value={stats.occupied} 
          icon={XCircle} 
          className="[&_svg]:text-rose-500"
          description={`Busy at ${simulatedDay} ${simulatedTime}`}
        />
        <StatTile 
          title="In Maintenance" 
          value={stats.maintenance} 
          icon={AlertTriangle} 
          className="[&_svg]:text-amber-500"
          description="Undergoing service"
        />
      </div>

      {/* Filter and View controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-4 rounded-3xl bg-white border border-border/50 shadow-sm backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative w-full md:w-60">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search room name or building..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-full text-text"
            />
          </div>

          {/* Building filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted shrink-0" />
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="pl-3 pr-8 py-2 bg-white border border-border rounded-xl text-sm text-text outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer min-w-[140px]"
            >
              <option value="all">All Buildings</option>
              {buildingsList.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="pl-3 pr-8 py-2 bg-white border border-border rounded-xl text-sm text-text outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer min-w-[140px]"
            >
              <option value="all">All Types</option>
              <option value="lecture">Lecture Hall</option>
              <option value="laboratory">Computer Lab</option>
              <option value="seminar">Seminar Room</option>
              <option value="auditorium">Auditorium</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="pl-3 pr-8 py-2 bg-white border border-border rounded-xl text-sm text-text outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer min-w-[155px]"
            >
              <option value="all">All Occupancies</option>
              <option value="available">Available Now</option>
              <option value="occupied">Occupied Now</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          {/* Sort Selection */}
          <div className="flex items-center gap-1.5">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="pl-3 pr-8 py-2 bg-white border border-border rounded-xl text-sm text-text outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer min-w-[130px]"
            >
              <option value="name">Sort by Name</option>
              <option value="capacity">Sort by Capacity</option>
              <option value="type">Sort by Type</option>
            </select>
            <Button
              variant="secondary"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="h-[38px] px-3 border border-border rounded-xl text-xs font-semibold cursor-pointer shrink-0"
              title="Toggle Sort Direction"
            >
              {sortOrder === "asc" ? "Asc ▲" : "Desc ▼"}
            </Button>
          </div>
        </div>

        {/* Layout View Toggles */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-alt/50 rounded-xl border border-border self-end lg:self-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode("matrix")}
            className={cn("h-8 px-3 gap-1.5 rounded-lg text-xs font-semibold transition-all border border-transparent cursor-pointer", viewMode === "matrix" ? "bg-white shadow-sm border-border text-primary font-bold" : "text-text-muted hover:text-text")}
          >
            <TableIcon className="h-3.5 w-3.5" /> Timeline Matrix
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode("cards")}
            className={cn("h-8 px-3 gap-1.5 rounded-lg text-xs font-semibold transition-all border border-transparent cursor-pointer", viewMode === "cards" ? "bg-white shadow-sm border-border text-primary font-bold" : "text-text-muted hover:text-text")}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Room Cards
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {sortedRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface/50 rounded-3xl border border-dashed border-border/80 text-center space-y-3">
          <Search className="h-10 w-10 text-text-muted/60" />
          <div>
            <h3 className="text-lg font-bold text-text">No Rooms Found</h3>
            <p className="text-sm text-text-muted max-w-sm mt-1">We couldn't find any rooms matching your filter criteria. Try adjusting the search query or drop downs.</p>
          </div>
        </div>
      ) : viewMode === "matrix" ? (
        /* TIMELINE MATRIX VIEW */
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border/60 bg-surface-alt/50">
                  <th className="p-4 font-source-serif text-base font-bold text-text min-w-[220px]">Room Info</th>
                  {HOUR_SLOTS.map((slot) => (
                    <th 
                      key={slot.label} 
                      className="p-3 text-center border-l border-border/30 text-xs font-semibold text-text-muted uppercase tracking-wider min-w-[100px]"
                    >
                      {slot.start}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {paginatedRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-surface-alt/10 transition-colors">
                    {/* Room Meta Column */}
                    <td className="p-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text text-base">{room.name}</span>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-surface-alt border border-border text-text-muted">
                            {room.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-text-muted">
                          <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                          <span>{room.building} • Flr {room.floor}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-text-muted">
                          <Users className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                          <span>Cap: <strong className="text-text">{room.capacity}</strong> pax</span>
                        </div>
                      </div>
                    </td>

                    {/* Hourly occupancy cells */}
                    {HOUR_SLOTS.map((slot) => {
                      // Determine status in this specific hour block
                      const blockStatus = getRoomOccupancyAtTime(room, simulatedDay, slot.start);
                      
                      return (
                        <td 
                          key={slot.label} 
                          className="p-2 border-l border-border/30 align-middle text-center"
                        >
                          {blockStatus.status === "maintenance" ? (
                            <div 
                              className="mx-auto py-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex flex-col items-center justify-center cursor-default group relative"
                              title="Maintenance"
                            >
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-[8px] font-bold mt-0.5 uppercase tracking-wide">Maint</span>
                            </div>
                          ) : blockStatus.status === "occupied" && blockStatus.classInfo ? (
                            // OCCUPIED CELL
                            <div className="group relative">
                              <div className="mx-auto py-2 px-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 flex flex-col items-center justify-center cursor-pointer hover:bg-rose-100/70 hover:border-rose-200 transition-all">
                                <span className="text-[10px] font-bold tracking-tight truncate max-w-[85px]">
                                  {blockStatus.classInfo.courseCode}
                                </span>
                                <span className="text-[9px] font-semibold text-rose-500 tracking-tight">
                                  Sec {blockStatus.classInfo.sectionName || "A"}
                                </span>
                              </div>

                              {/* Hover Tooltip Card */}
                              <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 rounded-2xl bg-text text-white text-left text-xs space-y-1.5 shadow-xl border border-white/10 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 animate-in fade-in slide-in-from-bottom-2">
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-text" />
                                <div className="font-bold text-sm text-primary-strong bg-white px-2 py-0.5 rounded-lg inline-block">
                                  {blockStatus.classInfo.courseCode}
                                </div>
                                <div className="font-bold leading-tight">{blockStatus.classInfo.courseName}</div>
                                <div className="text-[10px] text-white/70">
                                  <span className="font-semibold text-white">Section:</span> {blockStatus.classInfo.sectionName || "A"}
                                </div>
                                <div className="text-[10px] text-white/70">
                                  <span className="font-semibold text-white">Faculty:</span> {blockStatus.classInfo.teacherName}
                                </div>
                                <div className="text-[10px] text-white/70">
                                  <span className="font-semibold text-white">Schedule:</span> {blockStatus.classInfo.startTime} - {blockStatus.classInfo.endTime}
                                </div>
                              </div>
                            </div>
                          ) : (
                            // AVAILABLE CELL
                            <div 
                              className="mx-auto py-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex flex-col items-center justify-center cursor-default hover:bg-emerald-100/50 hover:border-emerald-200 transition-all"
                              title="Available"
                            >
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                              <span className="text-[8px] font-bold mt-0.5 uppercase tracking-wide">Free</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ROOM CARDS VIEW WITH SCHEDULE DETAILS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedRooms.map((room) => {
            // Find schedules for this room on the simulated day
            const daySchedules = schedules
              .filter(
                (s) =>
                  s.roomId === room.id &&
                  s.dayOfWeek.toLowerCase() === simulatedDay.toLowerCase()
              )
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            // Get room occupancy status at simulated time
            const currentOcc = getRoomOccupancyAtTime(room, simulatedDay, simulatedTime);

            return (
              <Card 
                key={room.id} 
                className={cn(
                  "group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 bg-white backdrop-blur-sm relative flex flex-col justify-between"
                )}
              >
                <div>
                  <div className={cn(
                    "h-1.5 w-full",
                    currentOcc.status === "available" ? "bg-emerald-500" : 
                    currentOcc.status === "occupied" ? "bg-rose-500" : "bg-amber-500"
                  )} />
                  
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl font-bold text-text">
                        {room.name}
                      </CardTitle>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "px-2.5 py-0.5 font-bold uppercase tracking-wider text-[9px] rounded-lg border",
                          currentOcc.status === "available" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : 
                          currentOcc.status === "occupied" ? "bg-rose-100 text-rose-700 border-rose-200" : 
                          "bg-amber-100 text-amber-700 border-amber-200"
                        )}
                      >
                        {currentOcc.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-text-muted text-xs font-medium">
                      <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                      {room.building} • Floor {room.floor}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pb-2">
                    {/* Room Attributes */}
                    <div className="grid grid-cols-2 gap-4 py-2 border-y border-border/50">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Capacity</span>
                          <span className="text-sm font-bold text-text">{room.capacity} Pax</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {room.type === "laboratory" ? <Cpu className="h-4 w-4 text-primary" /> : <Monitor className="h-4 w-4 text-primary" />}
                        <div className="flex flex-col">
                          <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Type</span>
                          <span className="text-sm font-bold text-text capitalize">{room.type}</span>
                        </div>
                      </div>
                    </div>

                    {/* Room Features */}
                    {room.features && room.features.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Features</span>
                        <div className="flex flex-wrap gap-1.5">
                          {room.features.map((feature) => (
                            <span key={feature} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-alt text-text-muted border border-border font-medium">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Simulation status preview */}
                    {currentOcc.status === "occupied" && currentOcc.classInfo && (
                      <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-xs animate-in fade-in zoom-in duration-300">
                        <p className="text-[10px] text-rose-600 uppercase font-bold tracking-wider">Occupied At simulated time</p>
                        <div className="font-bold text-rose-900 mt-0.5">{currentOcc.classInfo.courseCode} - {currentOcc.classInfo.courseName}</div>
                        <div className="text-rose-700/80 mt-1 flex flex-col gap-0.5 font-medium text-[11px]">
                          <span>Section: {currentOcc.classInfo.sectionName || "A"}</span>
                          <span>Faculty: {currentOcc.classInfo.teacherName}</span>
                          <span>Time: {currentOcc.classInfo.startTime} - {currentOcc.classInfo.endTime}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </div>

                <div className="p-4 border-t border-border/50 bg-surface-alt/25 mt-auto">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" /> {simulatedDay} Schedule
                    </h4>
                    {daySchedules.length === 0 ? (
                      <p className="text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-100/50 p-2 rounded-xl">
                        Available all day
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {daySchedules.map((s) => (
                          <div 
                            key={s.id}
                            className={cn(
                              "p-2 rounded-xl text-[11px] border flex justify-between items-center transition-all bg-white hover:border-primary/30",
                              simulatedTime >= s.startTime && simulatedTime < s.endTime
                                ? "border-rose-200 bg-rose-50/20 font-bold"
                                : "border-border/60"
                            )}
                          >
                            <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                              <div className="font-bold text-text truncate">
                                {s.courseCode} ({s.sectionName || "A"})
                              </div>
                              <div className="text-text-muted text-[10px] truncate">
                                {s.teacherName}
                              </div>
                            </div>
                            <div className="text-[10px] font-bold text-primary shrink-0 bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">
                              {s.startTime} - {s.endTime}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {sortedRooms.length > 0 && (
        <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-white shadow-sm rounded-3xl mt-4">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-surface border border-border rounded-lg outline-none cursor-pointer focus:ring-1 focus:ring-primary/30"
            >
              <option value={3}>3 rooms</option>
              <option value={5}>5 rooms</option>
              <option value={10}>10 rooms</option>
              <option value={20}>20 rooms</option>
            </select>
            <span>per page</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-text-muted">
              Page <strong className="text-text font-bold">{currentPage}</strong> of <strong className="text-text font-bold">{totalPages || 1}</strong> ({sortedRooms.length} total rooms)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 px-3 rounded-lg border border-border text-xs cursor-pointer"
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 px-3 rounded-lg border border-border text-xs cursor-pointer"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomAvailabilityView;
