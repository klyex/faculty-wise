"use client";

import React, { useState, useEffect } from "react";
import { X, BookOpen, User, Calendar, Clock, Home } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { facultyLoadService } from "../faculty-load.service";

interface NewAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NewAssignmentModal({ isOpen, onClose, onSuccess }: NewAssignmentModalProps) {
  const [teacherId, setTeacherId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("Monday");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:30");
  const [sectionId, setSectionId] = useState("");

  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        // Use the services to get real data from Firebase
        const [teachersData, coursesData, roomsData] = await Promise.all([
          facultyLoadService.getTeachers?.() || (async () => [])(),
          facultyLoadService.getCourses?.() || (async () => [])(),
          facultyLoadService.getRooms?.() || (async () => [])(),
        ]);

        setTeachers(teachersData || []);
        setCourses(coursesData || []);
        setRooms(roomsData || []);
      } catch (err) {
        console.error("Error loading assignment data:", err);
        setError("Failed to load data");
      }
    };

    loadData();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teacherId || !courseId || !roomId) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await facultyLoadService.createAssignment(
        teacherId,
        courseId,
        roomId,
        dayOfWeek,
        startTime,
        endTime,
        sectionId
      );

      // Reset form
      setTeacherId("");
      setCourseId("");
      setRoomId("");
      setDayOfWeek("Monday");
      setStartTime("09:00");
      setEndTime("10:30");
      setSectionId("");

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error creating assignment:", err);
      setError(err instanceof Error ? err.message : "Failed to create assignment");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="border-b border-border/50 flex flex-row items-center justify-between bg-surface-alt/30 p-6">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            New Faculty Assignment
          </CardTitle>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-alt rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-text-muted" />
          </button>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Faculty Member */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  Faculty Member *
                </label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none cursor-pointer"
                  required
                >
                  <option value="">-- Select a faculty --</option>
                  {teachers.map((teacher) => {
                    const teacherName = teacher.displayName || (teacher as any).name || (teacher as any).fullName;
                    const displayLabel = teacherName 
                      ? `${teacherName} (${teacher.email})` 
                      : teacher.email;
                    return (
                      <option key={teacher.id} value={teacher.id}>
                        {displayLabel}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Course */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  Course *
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none cursor-pointer"
                  required
                >
                  <option value="">-- Select a course --</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Day of Week */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Day of Week *
                </label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none cursor-pointer"
                  required
                >
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                  <Home className="h-3.5 w-3.5" />
                  Room *
                </label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none cursor-pointer"
                  required
                >
                  <option value="">-- Select a room --</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} - {room.building}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Time */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Start Time *
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  required
                />
              </div>

              {/* End Time */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  End Time *
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  required
                />
              </div>

              {/* Section (Optional) */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-text-muted">Section (Optional)</label>
                <input
                  type="text"
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  placeholder="e.g., A, B, LAB-1"
                  className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border/50">
              <Button
                type="button"
                variant="secondary"
                className="flex-1 rounded-lg h-10"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-lg h-10 bg-primary hover:bg-primary-strong"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Assignment"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
