"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FacultyMember } from "@/lib/types/faculty-load.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { facultyLoadService } from "./faculty-load.service";
import {
  Search,
  Loader2,
  Filter,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Clock,
  Ruler,
} from "lucide-react";

interface FlatAssignment {
  id: string;
  facultyId: string;
  facultyName: string;
  facultyDepartment: string;
  courseCode: string;
  courseName: string;
  day: string;
  startTime: string;
  endTime: string;
  units: number;
  section: string;
  semester?: string;
  academicYear?: string;
}

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function formatTime(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

export default function FacultyLoadingView() {
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedDay, setSelectedDay] = useState("all");

  // Sorting & Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<string>("day");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Reset to first page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDepartment, selectedDay]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  useEffect(() => {
    const unsub = facultyLoadService.subscribeFacultyLoad((data) => {
      setFaculty(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const allAssignments = useMemo(() => {
    const list: FlatAssignment[] = [];
    let idx = 0;
    for (const f of faculty) {
      for (const a of f.assignments || []) {
        idx++;
        list.push({
          id: a.id || `${f.id}-${idx}`,
          facultyId: f.id,
          facultyName: f.name,
          facultyDepartment: f.department,
          courseCode: a.courseCode,
          courseName: a.courseName,
          day: a.dayOfWeek || "",
          startTime: a.startTime || "",
          endTime: a.endTime || "",
          units: a.units,
          section: a.section,
          semester: a.semester,
          academicYear: a.academicYear,
        });
      }
    }
    return list;
  }, [faculty]);

  const departments = useMemo(() => {
    return Array.from(new Set(faculty.map((f) => f.department))).sort();
  }, [faculty]);

  const filteredAssignments = useMemo(() => {
    return allAssignments.filter((a) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        a.facultyName.toLowerCase().includes(q) ||
        a.courseName.toLowerCase().includes(q) ||
        a.courseCode.toLowerCase().includes(q) ||
        a.section.toLowerCase().includes(q);
      const matchesDept = selectedDepartment === "all" || a.facultyDepartment === selectedDepartment;
      const matchesDay = selectedDay === "all" || a.day === selectedDay;
      return matchesSearch && matchesDept && matchesDay;
    });
  }, [allAssignments, searchQuery, selectedDepartment, selectedDay]);

  const stats = useMemo(() => ({
    totalAssignments: filteredAssignments.length,
    totalFaculty: new Set(filteredAssignments.map((a) => a.facultyId)).size,
    totalUnits: filteredAssignments.reduce((s, a) => s + a.units, 0),
    totalDays: new Set(filteredAssignments.map((a) => a.day)).size,
  }), [filteredAssignments]);

  const sortedAssignments = useMemo(() => {
    return [...filteredAssignments].sort((a: any, b: any) => {
      let valA = a[sortField] || "";
      let valB = b[sortField] || "";

      if (sortField === "day") {
        valA = DAYS_ORDER.indexOf(a.day);
        valB = DAYS_ORDER.indexOf(b.day);
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
  }, [filteredAssignments, sortField, sortOrder]);

  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAssignments.slice(start, start + pageSize);
  }, [sortedAssignments, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedAssignments.length / pageSize);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-text-muted">Loading faculty assignments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif">
            Faculty Loading
          </h1>
          <p className="text-text-muted mt-1">
            View all faculty teaching assignments across departments. Search, filter by day or department.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50/30 border-blue-100">
          <CardContent className="p-4 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-600 shrink-0" />
            <div>
              <div className="text-2xl font-bold text-blue-900">{stats.totalAssignments}</div>
              <div className="text-xs text-blue-700 font-medium">Assignments</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/30 border-emerald-100">
          <CardContent className="p-4 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <div className="text-2xl font-bold text-emerald-900">{stats.totalFaculty}</div>
              <div className="text-xs text-emerald-700 font-medium">Faculty</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50/30 border-purple-100">
          <CardContent className="p-4 flex items-center gap-3">
            <Ruler className="w-8 h-8 text-purple-600 shrink-0" />
            <div>
              <div className="text-2xl font-bold text-purple-900">{stats.totalUnits}</div>
              <div className="text-xs text-purple-700 font-medium">Total Units</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/30 border-amber-100">
          <CardContent className="p-4 flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-amber-600 shrink-0" />
            <div>
              <div className="text-2xl font-bold text-amber-900">{stats.totalDays}</div>
              <div className="text-xs text-amber-700 font-medium">Days</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-md bg-white/40 backdrop-blur-md overflow-hidden">
        <CardHeader className="border-b border-border bg-white/50 px-6 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-lg">Assignment Details</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search faculty or subject..."
                  className="pl-9 pr-4 py-2 w-full sm:w-56 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer min-w-[140px]"
                >
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer min-w-[120px]"
                >
                  <option value="all">All Days</option>
                  {DAYS_ORDER.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sortedAssignments.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <p>No assignments found matching your filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-surface-alt/30">
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-text-muted font-bold cursor-pointer hover:text-text select-none" onClick={() => handleSort("facultyName")}>
                        Faculty {sortField === "facultyName" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-text-muted font-bold cursor-pointer hover:text-text select-none" onClick={() => handleSort("facultyDepartment")}>
                        Department {sortField === "facultyDepartment" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-text-muted font-bold cursor-pointer hover:text-text select-none" onClick={() => handleSort("courseCode")}>
                        Subject {sortField === "courseCode" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-text-muted font-bold cursor-pointer hover:text-text select-none" onClick={() => handleSort("section")}>
                        Section {sortField === "section" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-text-muted font-bold cursor-pointer hover:text-text select-none" onClick={() => handleSort("day")}>
                        Day {sortField === "day" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-text-muted font-bold cursor-pointer hover:text-text select-none" onClick={() => handleSort("startTime")}>
                        Time {sortField === "startTime" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                      </th>
                      <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-text-muted font-bold cursor-pointer hover:text-text select-none" onClick={() => handleSort("units")}>
                        Units {sortField === "units" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedAssignments.map((a) => (
                      <tr
                        key={a.id}
                        className="hover:bg-primary/5 transition-colors group"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-accent text-[10px] font-bold shrink-0">
                              {a.facultyName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)}
                            </div>
                            <span className="text-sm font-semibold text-text">{a.facultyName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-text-muted">{a.facultyDepartment}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">
                              {a.courseCode}
                            </span>
                            <span className="text-sm text-text truncate max-w-[200px]">{a.courseName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-text-muted">{a.section}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[10px] font-semibold border-primary/20 text-primary">
                            {a.day.substring(0, 3)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-text-muted flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(a.startTime)} – {formatTime(a.endTime)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Badge className="bg-accent/10 text-accent text-xs font-bold border border-accent/20">
                            {a.units} {a.units === 1 ? "Unit" : "Units"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-white/50 rounded-b-2xl">
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
                    Page <strong className="text-text font-bold">{currentPage}</strong> of <strong className="text-text font-bold">{totalPages || 1}</strong> ({sortedAssignments.length} total entries)
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
    </div>
  );
}
