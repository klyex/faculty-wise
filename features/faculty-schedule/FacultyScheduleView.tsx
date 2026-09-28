"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TimetableGrid } from "@/features/timetables/components/TimetableGrid";
import { FacultySearch } from "./components/FacultySearch";
import { TimetableEntry, DayOfWeek } from "@/lib/types/timetable.types";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Calendar, User, Info } from "lucide-react";
import { getDb } from "@/lib/firebase";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useSystemInfo } from "@/lib/context/SystemContext";
export function FacultyScheduleView() {
  const [searchParams] = useSearchParams();
  const instructor = searchParams.get("instructor") || "";
  const deptId = searchParams.get("dept") || "";
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentTerm, academicYear } = useSystemInfo();

  useEffect(() => {
    const db = getDb();

    if (!db) return;

    // Live Firestore subscriptions
    const unsubDepts = onSnapshot(
      collection(db, "departments"),
      (snapshot) => {
        const depts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDepartments(depts);
      }
    );

    const unsubSchedules = onSnapshot(
      collection(db, "schedules"),
      async (snapshot) => {
        const scheduleData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Enrich with course and room data
        const enriched: TimetableEntry[] = await Promise.all(
          scheduleData.map(async (s: any) => {
            let course = null;
            let room = null;
            let teacher = null;

            try {
              const courseSnap = await getDoc(doc(db, "courses", s.courseId));
              course = courseSnap.exists() ? courseSnap.data() : null;
            } catch (e) {}

            try {
              const roomSnap = await getDoc(doc(db, "rooms", s.roomId));
              room = roomSnap.exists() ? roomSnap.data() : null;
            } catch (e) {}

            try {
              const teacherSnap = await getDoc(doc(db, "users", s.teacherId));
              teacher = teacherSnap.exists() ? teacherSnap.data() : null;
            } catch (e) {}

            return {
              id: s.id,
              courseCode: course?.code || s.courseId,
              courseName: course?.name || s.courseId,
              teacherName: teacher?.displayName || teacher?.name || teacher?.fullName || "Instructor",
              room: room ? `${room.name} (${room.building})` : s.roomId,
              day: s.dayOfWeek as DayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
              type: room?.type === "laboratory" ? "lab" : "lecture",
            };
          })
        );

        setSchedules(enriched);
        setLoading(false);
      }
    );

    return () => {
      unsubDepts();
      unsubSchedules();
    };
  }, []);

  const currentDept = departments.find(d => d.id === deptId)?.name || 
    (departments.length > 0 ? departments[0].name : "Department");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            Faculty Schedule Viewer
          </h1>
          <p className="text-text-muted text-lg">
            Search for an instructor to view their weekly teaching availability.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentTerm && (
            <Badge variant="outline" className="bg-white/50 backdrop-blur-sm text-indigo-700 border-indigo-200 flex items-center gap-1.5 py-1.5 px-4 rounded-full shadow-sm">
              <Calendar className="h-4 w-4" />
              {currentTerm.semester} Semester {currentTerm.academicYear || academicYear}
            </Badge>
          )}
        </div>
      </div>

      <FacultySearch departments={departments} />

      {loading ? (
        <div className="space-y-8 animate-pulse">
          <div className="h-20 bg-surface-alt rounded-xl" />
          <div className="h-[500px] bg-surface-alt rounded-xl" />
        </div>
      ) : (
        <div className="grid gap-8">
          <div className="flex items-center gap-4 px-2">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text">{instructor || "All Instructors"}</h2>
              <p className="text-text-muted font-medium">{currentDept}</p>
            </div>
          </div>

          <Card className="border-none shadow-2xl overflow-hidden bg-white/40 backdrop-blur-xl ring-1 ring-white/20">
            <CardContent className="p-0">
              <TimetableGrid entries={schedules} />
            </CardContent>
          </Card>
        </div>
      )}
      
      <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
          <Info className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-bold text-indigo-900">About this View</h4>
          <p className="text-sm text-indigo-800/80 leading-relaxed mt-1">
            This schedule is provided to help you find instructors during their teaching hours or office consultations. Room assignments are subject to change; please verify with the department office if an instructor is not found in the listed room.
          </p>
        </div>
      </div>
    </div>
  );
}

export default FacultyScheduleView;
