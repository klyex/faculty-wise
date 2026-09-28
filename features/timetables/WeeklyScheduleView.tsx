"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TimetableGrid } from "./components/TimetableGrid";
import { TimetableEntry, DayOfWeek } from "@/lib/types/timetable.types";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/context/AuthContext";
import { getDb } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { Schedule, Room, User } from "@/lib/types/firestore.types";
import { Printer, CalendarDays, Loader2, Users, Ruler } from "lucide-react";

const DEFAULT_DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function WeeklyScheduleView() {
  const { profile, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printMode, setPrintMode] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [departments, setDepartments] = useState<string[]>([]);

  // Layout, Search, Sort & Paging States
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<string>("day");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Reset page index on search/filter updates
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDept]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Fetch data
  useEffect(() => {
    if (!profile || authLoading) return;

    const db = getDb();
    if (!db) return;

    setLoading(true);
    setError(null);

    // Build query based on role
    let scheduleQuery;
    if (profile.role === "teacher") {
      scheduleQuery = query(
        collection(db, "schedules"),
        where("teacherId", "==", profile.id)
      );
    } else {
      scheduleQuery = query(collection(db, "schedules"), orderBy("dayOfWeek"));
    }

    const unsubscribe = onSnapshot(scheduleQuery, async (snapshot) => {
      try {
        const scheduleData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Schedule[];

        // Enrich with course, room, teacher info
        const enriched = await Promise.all(
          scheduleData.map(async (s): Promise<TimetableEntry | null> => {
            const roomDoc = await getDoc(doc(db, "rooms", s.roomId));
            const room = roomDoc.exists() ? (roomDoc.data() as Room) : null;

            let teacherName = s.teacherId;
            if (s.teacherId === profile.id) {
              teacherName = profile.displayName || "You";
            } else {
              const teacherDoc = await getDoc(doc(db, "users", s.teacherId));
              if (teacherDoc.exists()) {
                const tData = teacherDoc.data() as User;
                teacherName = tData.displayName || tData.email || s.teacherId;
              }
            }

            let realCourseCode = s.courseCode || s.courseId;
            let realCourseName = s.courseName || s.courseId;
            let sectionName = "A";

            try {
              const offeringDoc = await getDoc(doc(db, "courseOfferings", s.courseId));
              if (offeringDoc.exists()) {
                const offeringData = offeringDoc.data();
                const sectionId = offeringData.sectionId;
                if (sectionId) {
                  const sectionDoc = await getDoc(doc(db, "sections", sectionId));
                  if (sectionDoc.exists()) {
                    sectionName = sectionDoc.data().name || sectionId;
                  }
                }
                const courseDoc = await getDoc(doc(db, "courses", offeringData.courseId));
                if (courseDoc.exists()) {
                  realCourseCode = courseDoc.data().code || realCourseCode;
                  realCourseName = courseDoc.data().name || realCourseName;
                }
              }
            } catch {
              // ignore
            }

            // Filter by selected department
            if (selectedDept !== "all" && !realCourseCode.startsWith(selectedDept)) {
              return null;
            }

            return {
              id: s.id,
              courseCode: realCourseCode,
              courseName: realCourseName,
              teacherName,
              sectionName,
              room: room ? `${room.name} (${room.building})` : s.roomId,
              day: s.dayOfWeek as DayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
              type: room?.type === "laboratory" ? "lab" : "lecture",
            };
          })
        );

        const validEntries = enriched.filter((e): e is TimetableEntry => e !== null);
        setEntries(validEntries);
        const depts = Array.from(new Set(validEntries.map((e) => e.courseCode.split("-")[0]))).sort();
        setDepartments(depts);
        setLoading(false);
      } catch (err) {
        console.error("Error enriching schedule data:", err);
        setError("Failed to load schedule");
        setLoading(false);
      }
    }, (err) => {
      console.error("Schedule subscription error:", err);
      setError("Failed to connect to schedule updates");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile, authLoading, selectedDept]);

  const handlePrint = () => {
    setPrintMode(true);
    // Give time for print styles to apply
    setTimeout(() => window.print(), 100);
    setTimeout(() => setPrintMode(false), 1000);
  };

  const filteredEntries = entries.filter((e) => {
    const deptMatch = selectedDept === "all" || e.courseCode.startsWith(selectedDept);
    return deptMatch;
  });

  const searchedEntries = useMemo(() => {
    return filteredEntries.filter(e => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        e.courseCode.toLowerCase().includes(q) ||
        e.courseName.toLowerCase().includes(q) ||
        e.teacherName.toLowerCase().includes(q) ||
        (e.sectionName || "").toLowerCase().includes(q) ||
        e.room.toLowerCase().includes(q)
      );
    });
  }, [filteredEntries, searchQuery]);

  const sortedEntries = useMemo(() => {
    return [...searchedEntries].sort((a: any, b: any) => {
      let valA = a[sortField] || "";
      let valB = b[sortField] || "";

      if (sortField === "day") {
        const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        valA = DAYS_OF_WEEK.indexOf(a.day);
        valB = DAYS_OF_WEEK.indexOf(b.day);
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
  }, [searchedEntries, sortField, sortOrder]);

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedEntries.slice(start, start + pageSize);
  }, [sortedEntries, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedEntries.length / pageSize);

  const stats = {
    totalClasses: filteredEntries.length,
    lectures: filteredEntries.filter((e) => e.type === "lecture").length,
    labs: filteredEntries.filter((e) => e.type === "lab").length,
    days: new Set(filteredEntries.map((e) => e.day)).size,
    teachers: new Set(filteredEntries.map((e) => e.teacherName)).size,
    rooms: new Set(filteredEntries.map((e) => e.room)).size,
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-40 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-text-muted">Loading weekly schedule...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-xl border border-red-100">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  // Print-optimized view
  if (printMode) {
    return (
      <div className="print-only p-0">
        <style>{`
          @page { size: A4 landscape; margin: 0.5in; }
          @media print {
            body { margin: 0; padding: 0; background: white; }
            .no-print { display: none !important; }
          }
        `}</style>
        <div className="mb-4 text-center print:mb-8">
          <h1 className="text-3xl font-bold text-black mb-1">Weekly Schedule</h1>
          <p className="text-gray-600 text-sm">Mon–Sat • {stats.totalClasses} classes</p>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4 text-sm text-gray-600 print:mb-6">
          <div><strong>Classes:</strong> {stats.totalClasses}</div>
          <div><strong>Lectures:</strong> {stats.lectures}</div>
          <div><strong>Labs:</strong> {stats.labs}</div>
          <div><strong>Days:</strong> {stats.days}</div>
        </div>
        <TimetableGrid entries={filteredEntries} days={DEFAULT_DAYS} printMode={true} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between no-print">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif flex items-center gap-3">
            <CalendarDays className="w-9 h-9 text-accent" />
            Weekly Schedule
          </h1>
          <p className="text-text-muted mt-1">Monday–Saturday view. Filter by department, then print for distribution.</p>
        </div>
        <div className="flex items-center gap-2.5 no-print">
          {/* View Toggles */}
          <div className="flex items-center gap-1 p-1 bg-surface-alt/50 rounded-xl border border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer ${viewMode === "grid" ? "bg-white shadow-sm border border-border font-bold text-primary" : "text-text-muted"}`}
            >
              Grid Matrix
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("table")}
              className={`h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer ${viewMode === "table" ? "bg-white shadow-sm border border-border font-bold text-primary" : "text-text-muted"}`}
            >
              List Table
            </Button>
          </div>
          <Button variant="secondary" onClick={handlePrint} className="gap-2 h-10 border border-border">
            <Printer className="h-4 w-4" />
            Print Schedule
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 no-print">
        <Card className="bg-blue-50/30 border-blue-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">📚</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900">{stats.totalClasses}</div>
              <div className="text-xs text-blue-700 font-medium">Total Classes</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/30 border-emerald-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <span className="text-emerald-600 text-xl">📝</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-900">{stats.lectures}</div>
              <div className="text-xs text-emerald-700 font-medium">Lectures</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50/30 border-purple-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-xl">🧪</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-900">{stats.labs}</div>
              <div className="text-xs text-purple-700 font-medium">Labs</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/30 border-amber-100">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-amber-600 shrink-0" />
            <div>
              <div className="text-2xl font-bold text-amber-900">{stats.teachers}</div>
              <div className="text-xs text-amber-700 font-medium">Teachers</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50/30 border-purple-100">
          <CardContent className="p-4 flex items-center gap-3">
            <Ruler className="w-8 h-8 text-purple-600 shrink-0" />
            <div>
              <div className="text-2xl font-bold text-purple-900">{stats.rooms}</div>
              <div className="text-xs text-purple-700 font-medium">Rooms</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50/30 border-orange-100">
          <CardContent className="p-4 flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-orange-600 shrink-0" />
            <div>
              <div className="text-2xl font-bold text-orange-900">{stats.days}</div>
              <div className="text-xs text-orange-700 font-medium">Active Days</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-md bg-white/40 backdrop-blur-md no-print">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-text-muted">Filter by Department:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[180px] cursor-pointer"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            {viewMode === "table" && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search subject or teacher..."
                  className="px-3 py-2 w-52 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}
            <span className="text-sm text-text-muted">
              {searchedEntries.length} of {entries.length} classes
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Content */}
      {viewMode === "grid" ? (
        <Card className="border-none shadow-md bg-white/40 backdrop-blur-md overflow-hidden">
          <CardContent className="p-0">
            <TimetableGrid entries={filteredEntries} days={DEFAULT_DAYS} printMode={printMode} />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-none shadow-md bg-white/40 backdrop-blur-md overflow-hidden">
          <CardContent className="p-0">
            {paginatedEntries.length === 0 ? (
              <div className="p-12 text-center text-text-muted">
                <p>No classes scheduled matching your criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border bg-surface-alt/30">
                        <th className="px-6 py-3 text-[10px] uppercase font-bold text-text-muted tracking-wider cursor-pointer hover:text-text select-none" onClick={() => handleSort("courseCode")}>
                          Subject {sortField === "courseCode" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                        </th>
                        <th className="px-6 py-3 text-[10px] uppercase font-bold text-text-muted tracking-wider cursor-pointer hover:text-text select-none" onClick={() => handleSort("teacherName")}>
                          Instructor {sortField === "teacherName" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                        </th>
                        <th className="px-6 py-3 text-[10px] uppercase font-bold text-text-muted tracking-wider cursor-pointer hover:text-text select-none" onClick={() => handleSort("sectionName")}>
                          Section {sortField === "sectionName" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                        </th>
                        <th className="px-6 py-3 text-[10px] uppercase font-bold text-text-muted tracking-wider cursor-pointer hover:text-text select-none" onClick={() => handleSort("room")}>
                          Venue {sortField === "room" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                        </th>
                        <th className="px-6 py-3 text-[10px] uppercase font-bold text-text-muted tracking-wider cursor-pointer hover:text-text select-none" onClick={() => handleSort("day")}>
                          Day {sortField === "day" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                        </th>
                        <th className="px-6 py-3 text-[10px] uppercase font-bold text-text-muted tracking-wider cursor-pointer hover:text-text select-none" onClick={() => handleSort("startTime")}>
                          Time {sortField === "startTime" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                        </th>
                        <th className="px-6 py-3 text-[10px] uppercase font-bold text-text-muted tracking-wider cursor-pointer hover:text-text select-none" onClick={() => handleSort("type")}>
                          Type {sortField === "type" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedEntries.map((e) => (
                        <tr key={e.id} className="hover:bg-primary/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">{e.courseCode}</span>
                              <span className="text-sm font-semibold text-text truncate max-w-[200px]" title={e.courseName}>{e.courseName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-text">{e.teacherName}</td>
                          <td className="px-6 py-4 text-sm text-text-muted">{e.sectionName}</td>
                          <td className="px-6 py-4 text-sm text-text-muted">{e.room}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent/10 text-accent">{e.day}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-text-muted">{e.startTime} - {e.endTime}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${e.type === "lab" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{e.type}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table pagination */}
                <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-white/50">
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
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span>entries per page</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-text-muted">
                      Page <strong className="text-text font-bold">{currentPage}</strong> of <strong className="text-text font-bold">{totalPages || 1}</strong> ({sortedEntries.length} total entries)
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
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {filteredEntries.length === 0 && (
        <div className="p-12 text-center bg-surface-alt/50 rounded-2xl border border-border">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-text-muted">No classes scheduled for the selected filters.</p>
        </div>
      )}
    </div>
  );
}