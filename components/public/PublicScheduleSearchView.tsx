"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CalendarDays, BookOpen, AlertCircle, Loader2, ArrowLeft, Users, Landmark } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TimetableGrid } from "@/features/timetables/components/TimetableGrid";
import { TimetableEntry, DayOfWeek } from "@/lib/types/timetable.types";
import { getDb } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { useSystemInfo } from "@/lib/context/SystemContext";

const DEFAULT_DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function PublicScheduleSearchView() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TimetableEntry[]>([]);
  const [metaTitle, setMetaTitle] = useState<string | null>(null);
  const { currentTerm, academicYear } = useSystemInfo();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setMetaTitle(null);

    const queryClean = searchQuery.trim().toUpperCase();
    const db = getDb();

    try {
      // 1. Search by Student ID
        const studentsSnap = await getDocs(
          query(collection(db, "students"), where("studentNo", "==", searchQuery.trim()))
        );
        if (!studentsSnap.empty) {
          const studentData = studentsSnap.docs[0].data();
          const sectionId = studentData.sectionId;
          const sectionDoc = await getDoc(doc(db, "sections", sectionId));
          const sectionName = sectionDoc.exists() ? sectionDoc.data().name : "BSCS-3A";

          // Get schedules
          const schedulesSnap = await getDocs(collection(db, "schedules"));
          const scheduleList = schedulesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
          
          // Match by course offerings
          const offeringsSnap = await getDocs(
            query(collection(db, "courseOfferings"), where("sectionId", "==", sectionId))
          );
          const activeCourseIds = offeringsSnap.docs.map(d => d.data().courseId);

          const filtered = scheduleList.filter(s => activeCourseIds.includes(s.courseId));
          const enriched = await enrichFirestoreSchedules(db, filtered);
          setResults(enriched);
          setMetaTitle(`Student Schedule: ${studentData.fullName} (Section ${sectionName})`);
          setLoading(false);
          return;
        }

        // 2. Search by Section Name
        const sectionsSnap = await getDocs(
          query(collection(db, "sections"), where("name", "==", searchQuery.trim()))
        );
        if (!sectionsSnap.empty) {
          const sectionDoc = sectionsSnap.docs[0];
          const sectionId = sectionDoc.id;
          const sectionName = sectionDoc.data().name;

          // Get offerings and schedules
          const offeringsSnap = await getDocs(
            query(collection(db, "courseOfferings"), where("sectionId", "==", sectionId))
          );
          const activeCourseIds = offeringsSnap.docs.map(d => d.data().courseId);

          const schedulesSnap = await getDocs(collection(db, "schedules"));
          const scheduleList = schedulesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

          const filtered = scheduleList.filter(s => activeCourseIds.includes(s.courseId));
          const enriched = await enrichFirestoreSchedules(db, filtered);
          setResults(enriched);
          setMetaTitle(`Class Schedule: Section ${sectionName}`);
          setLoading(false);
          return;
        }

        // 3. Search by Course Code
        const coursesSnap = await getDocs(
          query(collection(db, "courses"), where("code", "==", searchQuery.trim()))
        );
        if (!coursesSnap.empty) {
          const courseDoc = coursesSnap.docs[0];
          const courseData = courseDoc.data();

          const schedulesSnap = await getDocs(
            query(collection(db, "schedules"), where("courseId", "==", courseDoc.id))
          );
          const filtered = schedulesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
          const enriched = await enrichFirestoreSchedules(db, filtered);
          setResults(enriched);
          setMetaTitle(`Course Schedule: ${courseData.code} – ${courseData.name}`);
          setLoading(false);
          return;
        }

        setError("No matching records found. Ensure Student ID matches (e.g. STUD-2026-8801) or Class Code is exact (e.g. BSCS-3A).");
    } catch (err: any) {
      console.error(err);
      setError("An error occurred during search. Please check your query.");
    } finally {
      setLoading(false);
    }
  };

  const enrichFirestoreSchedules = async (db: any, schedules: any[]): Promise<TimetableEntry[]> => {
    return Promise.all(schedules.map(async (s) => {
      const courseDoc = await getDoc(doc(db, "courses", s.courseId));
      const course = courseDoc.exists() ? courseDoc.data() : null;

      const roomDoc = await getDoc(doc(db, "rooms", s.roomId));
      const room = roomDoc.exists() ? roomDoc.data() : null;

      const userDoc = await getDoc(doc(db, "users", s.teacherId));
      const user = userDoc.exists() ? userDoc.data() : null;

      return {
        id: s.id,
        courseCode: course?.code || s.courseId,
        courseName: course?.name || s.courseId,
        teacherName: user?.displayName || "Instructor",
        room: room ? `${room.name} (${room.building})` : s.roomId,
        day: s.dayOfWeek as DayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        type: room?.type === "laboratory" ? "lab" : "lecture",
      };
    }));
  };

  return (
    <main className="min-h-screen bg-stone-50 p-6 font-manrope">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Branding */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/login")}
              className="p-2 border border-stone-200 rounded-xl hover:bg-stone-100 transition-colors shrink-0"
              title="Back to login"
            >
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </button>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white font-bold shrink-0">
              FW
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-source-serif">Public Schedule Search</h1>
              <p className="text-xs text-stone-500">Lookup schedules instantly without registering an account.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 font-medium">Academic Year {currentTerm?.academicYear || academicYear}</span>
          </div>
        </div>

        {/* Search Panel Card */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-md p-6 max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
              <input
                type="text"
                required
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Student ID (e.g. STUD-2026-8801) or Class/Course (e.g. BSCS-3A)"
                className="w-full h-14 pl-12 pr-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-stone-900 font-semibold"
              />
            </div>
            <div className="flex justify-between items-center flex-wrap gap-2 pt-1 px-1">
              <div className="text-[11px] text-stone-400">
                <strong>Examples:</strong> <code className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">STUD-2026-8801</code> or <code className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">BSCS-3A</code>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="bg-stone-950 hover:bg-stone-800 text-white h-11 px-6 rounded-xl font-semibold gap-1.5 flex items-center justify-center cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </Button>
            </div>
          </form>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-red-50 border border-red-100 text-red-800 text-xs flex gap-2 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Results Area */}
        {results.length > 0 && metaTitle && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
              <CalendarDays className="w-6 h-6 text-amber-600" />
              <div>
                <h3 className="font-bold text-stone-900">{metaTitle}</h3>
                <p className="text-xs text-stone-500">Only showing institutional approved/published timetables.</p>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl border border-stone-200 shadow-md p-6">
              <TimetableGrid entries={results} days={DEFAULT_DAYS} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
