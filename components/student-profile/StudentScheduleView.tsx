"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useSystemInfo } from "@/lib/context/SystemContext";
import { getDb } from "@/lib/firebase";
import { TimetableGrid } from "@/features/timetables/components/TimetableGrid";
import { TimetableEntry, DayOfWeek } from "@/lib/types/timetable.types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";
import { 
  Calendar, 
  BookOpen, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Bell, 
  Activity, 
  RefreshCw, 
  Zap,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";

// Structure for tracking a toast alert
interface LiveToast {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success";
  time: string;
}

export function StudentScheduleView() {
  const { profile, user } = useAuth();
  const { currentTerm, academicYear } = useSystemInfo();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [sectionInfo, setSectionInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // States for live toast alerts and class update banners
  const [toasts, setToasts] = useState<LiveToast[]>([]);
  const [activeBanners, setActiveBanners] = useState<{ id: string; text: string; type: string }[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);

  // Keep a reference of previous entries to detect changes in room or timings
  const prevEntriesRef = useRef<TimetableEntry[]>([]);

  // Sound play utility for notifications
  const playNotificationChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sine";
      // Chime notes: G5 then C6
      osc.frequency.setValueAtTime(784, audioCtx.currentTime); // G5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      osc.start();
      osc.frequency.setValueAtTime(1046, audioCtx.currentTime + 0.12); // C6
      gain.gain.setValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn("Audio Context chime block:", e);
    }
  };

  // Toast adder function
  const addToast = (title: string, message: string, type: "info" | "warning" | "success") => {
    const id = `toast-${Date.now()}`;
    const newToast: LiveToast = {
      id,
      title,
      message,
      type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setToasts((prev) => [newToast, ...prev]);
    playNotificationChime();

    // Auto-remove toast after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  // Compare schedules to detect changes (relocations / rescheduling)
  const auditScheduleUpdates = (newEntries: TimetableEntry[]) => {
    if (prevEntriesRef.current.length === 0) {
      prevEntriesRef.current = newEntries;
      return;
    }

    const prevMap = new Map(prevEntriesRef.current.map((e) => [e.id, e]));
    const banners: { id: string; text: string; type: string }[] = [];

    newEntries.forEach((current) => {
      const prev = prevMap.get(current.id);
      if (prev) {
        // 1. Detect Room Relocation Change
        if (prev.room !== current.room) {
          addToast(
            "Class Relocation Alert",
            `Class ${current.courseCode} (${current.courseName}) has been moved to ${current.room}.`,
            "warning"
          );
          banners.push({
            id: `banner-room-${current.id}-${Date.now()}`,
            text: `⚠️ RELOCATED: ${current.courseCode} (${current.courseName}) has been moved from ${prev.room} to ${current.room}. Please proceed directly to the new venue.`,
            type: "room_change"
          });
        }
        // 2. Detect Reschedule (Timing/Day) Change
        else if (prev.day !== current.day || prev.startTime !== current.startTime || prev.endTime !== current.endTime) {
          addToast(
            "Schedule Rescheduled Alert",
            `Class ${current.courseCode} timings updated: ${current.day}s at ${current.startTime}-${current.endTime}.`,
            "warning"
          );
          banners.push({
            id: `banner-time-${current.id}-${Date.now()}`,
            text: `📅 RESCHEDULED: ${current.courseCode} (${current.courseName}) is now held on ${current.day} at ${current.startTime} - ${current.endTime}.`,
            type: "rescheduled"
          });
        }
      }
    });

    if (banners.length > 0) {
      setActiveBanners((prev) => [...banners, ...prev]);
    }
    prevEntriesRef.current = newEntries;
  };

  useEffect(() => {
    const userId = profile?.id || (profile as any)?.uid || user?.uid;
    if (!userId) {
      if (profile === null && user === null) {
        setLoading(false);
      }
      return;
    }

    const db = getDb();
    if (!db) return;

    setLoading(true);
    setError(null);

    // Live Firebase Synced Query Mode
    const studentsRef = collection(db, "students");
    const studentQuery = query(studentsRef, where("uid", "==", userId));

    let unsubscribeSchedules: (() => void) | null = null;

    const unsubscribeStudent = onSnapshot(studentQuery, async (snapshot) => {
      try {
        if (unsubscribeSchedules) {
          unsubscribeSchedules();
          unsubscribeSchedules = null;
        }

        if (!snapshot.empty) {
          const sData = snapshot.docs[0].data();
          setStudentInfo(sData);

          let sectionName = "BSCS-3A";
          if (sData.sectionId) {
            const secSnap = await getDoc(doc(db, "sections", sData.sectionId));
            if (secSnap.exists()) {
              const secData = secSnap.data();
              setSectionInfo(secData);
              sectionName = secData.name || "BSCS-3A";
            }
          }

          // Fetch schedules collection and filter programmatically for the section
          const scheduleQuery = collection(db, "schedules");
          unsubscribeSchedules = onSnapshot(scheduleQuery, async (schedSnapshot) => {
            const scheduleData = schedSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as any[];

            // Apply section boundaries to schedules matching courses
            const filteredScheds = scheduleData.filter(s => {
              if (sectionName === "BSCS-3A") {
                return s.courseId === "CS-101" || s.courseId === "CS-202";
              } else if (sectionName === "BSMATH-2B") {
                return s.courseId === "MATH-101";
              }
              return true;
            });

            const enrichedEntries: TimetableEntry[] = await Promise.all(
              filteredScheds.map(async (s) => {
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
                  teacherName: user?.displayName || user?.name || user?.fullName || "Instructor",
                  room: room ? `${room.name} (${room.building})` : s.roomId,
                  day: s.dayOfWeek as DayOfWeek,
                  startTime: s.startTime,
                  endTime: s.endTime,
                  type: room?.type === "laboratory" ? "lab" : "lecture",
                };
              })
            );

            // Trigger audit change checker
            auditScheduleUpdates(enrichedEntries);
            setLoading(false);
          });
        } else {
          setError("No matching student profile found for your account.");
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Error loading student schedule:", err);
        setError("Failed to fetch schedule updates.");
        setLoading(false);
      }
    });

    return () => {
      unsubscribeStudent();
      if (unsubscribeSchedules) {
        unsubscribeSchedules();
      }
    };
  }, [profile, user]);

  // Simulation handlers for Room Changes & Rescheduling
  const simulateRoomChange = async () => {
    const db = getDb();
    try {
      const docRef = doc(db, "schedules", "schedule-003");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const currentRoom = docSnap.data().roomId;
        const newRoom = currentRoom === "room-001" ? "room-002" : "room-001";
        await updateDoc(docRef, { roomId: newRoom });
      }
    } catch (err) {
      console.error("Failed to simulate room change in Firestore:", err);
    }
  };

  const simulateReschedule = async () => {
    const db = getDb();
    try {
      const docRef = doc(db, "schedules", "schedule-001");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.dayOfWeek === "Monday") {
          await updateDoc(docRef, {
            dayOfWeek: "Tuesday",
            startTime: "10:30",
            endTime: "12:00"
          });
        } else {
          await updateDoc(docRef, {
            dayOfWeek: "Monday",
            startTime: "09:00",
            endTime: "10:30"
          });
        }
      }
    } catch (err) {
      console.error("Failed to simulate reschedule in Firestore:", err);
    }
  };

  const resetSimulations = async () => {
    const db = getDb();
    try {
      await updateDoc(doc(db, "schedules", "schedule-001"), {
        dayOfWeek: "Monday",
        startTime: "09:00",
        endTime: "10:30"
      });
      await updateDoc(doc(db, "schedules", "schedule-003"), {
        roomId: "room-001"
      });
      setActiveBanners([]);
      addToast("Simulator Reset", "All schedules restored back to default in Firestore.", "success");
    } catch (err) {
      console.error("Failed to reset Firestore simulations:", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-28 bg-surface-alt rounded-2xl" />
        <div className="h-[500px] bg-surface-alt rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-100">
        <p className="text-rose-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      
      {/* FLOATING TOAST NOTIFICATION CONTAINER */}
      <div className="fixed top-6 right-6 z-[999] flex flex-col gap-3.5 w-full max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 bg-white/90 backdrop-blur-xl border border-amber-250 p-4 rounded-2xl shadow-[0_20px_40px_rgba(200,100,20,0.12)] border-l-4 border-l-amber-500 animate-in slide-in-from-right duration-350"
          >
            <div className="h-8 w-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Bell className="h-4.5 w-4.5 animate-bounce" />
            </div>
            <div className="flex-1 space-y-0.5">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-stone-900">{toast.title}</h4>
                <span className="text-[9px] font-semibold text-stone-400">{toast.time}</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                {toast.message}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Header Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-gradient-to-r from-indigo-650 to-violet-650 p-6 md:p-8 rounded-3xl text-white shadow-xl shadow-indigo-600/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full text-white/90">
            Student Timetable
          </span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-3 font-source-serif">
            My Class Schedule
          </h1>
          <p className="text-white/80 text-sm mt-1 max-w-xl">
            View weekly lectures, laboratory sessions, and assigned classrooms for class section{" "}
            <strong className="text-white underline decoration-wavy decoration-indigo-200">
              {sectionInfo?.name || "BSCS-3A"}
            </strong>.
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          {currentTerm && (
            <Badge variant="outline" className="bg-white/10 text-white border-white/20 self-start md:self-end flex items-center gap-1.5 py-1 px-3">
              <Calendar className="h-3.5 w-3.5" />
              {currentTerm.semester} Semester AY {currentTerm.academicYear || academicYear}
            </Badge>
          )}
          <span className="text-[10px] text-white/70 self-start md:self-end">
            Advisor: {sectionInfo?.advisorName || "Dr. John Smith"}
          </span>
        </div>
      </div>

      {/* DYNAMIC REAL-TIME CLASS UPDATES BANNERS PANEL */}
      {activeBanners.length > 0 && (
        <div className="space-y-3.5 animate-in fade-in slide-in-from-top-3 duration-400">
          {activeBanners.map((banner) => (
            <div
              key={banner.id}
              className="relative overflow-hidden p-4 rounded-2xl bg-amber-50 border border-amber-200/60 shadow-sm flex items-start gap-3.5"
            >
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500" />
              <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-100 px-2.5 py-0.5 rounded-full">
                    Live Schedule Alert
                  </span>
                  <span className="text-[10px] font-medium text-amber-600">Updated just now</span>
                </div>
                <p className="text-xs font-semibold text-amber-900 leading-relaxed mt-1.5">
                  {banner.text}
                </p>
              </div>
              <button 
                onClick={() => setActiveBanners((prev) => prev.filter((b) => b.id !== banner.id))}
                className="text-amber-500 hover:text-amber-700 text-xs font-bold px-2 py-1 rounded transition hover:bg-amber-100"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {/* REGISTRAR TESTING & SIMULATION PANEL */}
      <Card className="border-border/60 shadow-md bg-stone-50 overflow-hidden">
        <button
          onClick={() => setIsConsoleOpen(!isConsoleOpen)}
          className="w-full flex items-center justify-between px-6 py-4 bg-stone-100/50 hover:bg-stone-100 transition-colors border-b border-border/40"
        >
          <div className="flex items-center gap-2">
            <div className="h-6.5 w-6.5 rounded-lg bg-indigo-600/10 text-indigo-650 flex items-center justify-center">
              <Zap className="h-4 w-4" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-xs text-stone-900">Registrar Change Simulator</h3>
              <p className="text-[9px] font-medium text-stone-400">Trigger live reschedules & room changes to test real-time alerts</p>
            </div>
          </div>
          {isConsoleOpen ? <ChevronUp className="h-4 w-4 text-stone-500" /> : <ChevronDown className="h-4 w-4 text-stone-500" />}
        </button>
        {isConsoleOpen && (
          <CardContent className="p-5 grid gap-4 sm:grid-cols-3 bg-white/70 animate-in slide-in-from-top-2 duration-200">
            <Button
              onClick={simulateRoomChange}
              variant="secondary"
              className="h-10 text-xs font-semibold flex items-center justify-center gap-2 border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 shadow-sm"
            >
              <MapPin className="h-4 w-4 text-amber-600" />
              Relocate CS-202 (Room Change)
            </Button>
            <Button
              onClick={simulateReschedule}
              variant="secondary"
              className="h-10 text-xs font-semibold flex items-center justify-center gap-2 border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 shadow-sm"
            >
              <Clock className="h-4 w-4 text-blue-600" />
              Reschedule CS-101 (Timing)
            </Button>
            <Button
              onClick={resetSimulations}
              variant="secondary"
              className="h-10 text-xs font-semibold flex items-center justify-center gap-2 border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 shadow-sm"
            >
              <RefreshCw className="h-4 w-4 text-emerald-600" />
              Restore Original Schedule
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Class Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50 shadow-sm bg-white/60 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-650/10 text-indigo-650 flex items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Enrolled Courses</p>
                <p className="text-2xl font-bold text-text mt-0.5">{entries.length} Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-white/60 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-teal-650/10 text-teal-650 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Weekly Hours</p>
                <p className="text-2xl font-bold text-text mt-0.5">
                  {(entries.length * 1.5).toFixed(1)} Hours
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-white/60 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-violet-650/10 text-violet-650 flex items-center justify-center">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Classrooms</p>
                <p className="text-2xl font-bold text-text mt-0.5">
                  {new Set(entries.map(e => e.room)).size} Rooms
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Timetable Calendar Grid Card */}
      <Card className="border-none shadow-xl overflow-hidden bg-white/40 backdrop-blur-md">
        <CardContent className="p-0">
          <TimetableGrid entries={entries} />
        </CardContent>
      </Card>

      {/* Schedule Advisory Note */}
      <div className="p-6 rounded-3xl bg-indigo-50/50 border border-indigo-100/50 flex items-start gap-4">
        <div className="h-10 w-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
          <Info className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-bold text-indigo-900">Student Schedule Advisory</h4>
          <p className="text-sm text-indigo-800/80 leading-relaxed mt-1">
            Weekly class sessions, lectures, and laboratory configurations are published and updated in real-time by the academic registrar. Classroom transfers or room reassignments (e.g. moving from a lecture room to a computer science lab) will trigger instant update alerts on this timetable dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
export default StudentScheduleView;
