"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Sparkles, Calendar, Plus, CheckCircle, AlertCircle, ArrowRight, Activity, Trash2, Edit } from "lucide-react";
import TimetableView from "@/features/timetables/TimetableView";
import { useAuth } from "@/lib/context/AuthContext";
import { getDb } from "@/lib/firebase";
import { collection, doc, setDoc, query, where, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/Button";
import { facultyLoadService } from "@/features/faculty-load/faculty-load.service";
import { useToast } from "@/components/ui/Toast";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

interface ProposedSchedule {
  courseId: string;
  roomId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  semester: string;
}

export function MySchedulePage() {
  const { profile } = useAuth();
  const [requestText, setRequestText] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [proposed, setProposed] = useState<ProposedSchedule | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [mySchedules, setMySchedules] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  
  // Edit schedule states
  const [editingSchedId, setEditingSchedId] = useState<string | null>(null);
  const [editDay, setEditDay] = useState("");
  const [editRoom, setEditRoom] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editSection, setEditSection] = useState("");

  // Load courses and rooms on mount
  useEffect(() => {
    facultyLoadService.getCourses().then(setCourses).catch(console.error);
    facultyLoadService.getRooms().then(setRooms).catch(console.error);
  }, []);

  // Real-time subscribe to my schedules
  useEffect(() => {
    if (!profile) return;
    const db = getDb();
    if (!db) return;

    // Firestore mode
    const q = query(
      collection(db, "schedules"),
      where("teacherId", "==", profile.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMySchedules(list);
    });
    return unsubscribe;
  }, [profile]);

  const handleSaveSched = async (id: string) => {
    try {
      await facultyLoadService.updateAssignment(id, {
        dayOfWeek: editDay,
        roomId: editRoom,
        startTime: editStart,
        endTime: editEnd,
        sectionId: editSection,
      });
      setEditingSchedId(null);
      setSuccessMessage("Schedule successfully updated!");
    } catch (err: any) {
      setError(err.message || "Failed to update schedule slot.");
    }
  };

  const handleDeleteSched = async (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteSched = async () => {
    if (!deleteConfirmId) return;
    try {
      await facultyLoadService.deleteAssignment(deleteConfirmId);
      toast.success("Slot Deleted", "Schedule slot was successfully deleted.");
    } catch (err: any) {
      setError(err.message || "Failed to delete schedule slot.");
      toast.error("Error", "Failed to delete schedule slot.");
    }
  };

  const handleAiAnalyze = async () => {
    if (!requestText.trim() || !profile) return;
    setLoading(true);
    setError(null);
    setExplanation(null);
    setProposed(null);
    setSuccessMessage(null);

    const contextPrompt = `System: You are the FacultyWise AI Scheduling Engine. 

Active teacher: ${profile.displayName} (ID: ${profile.id})

User request: "${requestText}"`;

    try {
      const response = await fetch("/api/ai-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: contextPrompt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      const aiResponseText = data.answer || "";

      // Extractor regex to pull out JSON block
      const jsonMatch = aiResponseText.match(/```json\s*([\s\S]*?)\s*```/) || aiResponseText.match(/({[\s\S]*?})/);
      
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          setIsValid(parsed.valid);
          setExplanation(parsed.reason);
          if (parsed.proposedEntry) {
            setProposed(parsed.proposedEntry);
          }
        } catch (parseErr) {
          console.error("JSON parsing error:", parseErr);
          setError("AI returned unparseable scheduling suggestion. Please try rephrasing.");
        }
      } else {
        // Fallback explanation if no JSON is found
        setExplanation(aiResponseText);
        setError("AI could not structure the schedule slot. Try specifying days and times clearly.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while analyzing the schedule.");
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = async () => {
    if (!proposed || !profile) return;

    try {
      const db = getDb();
      const newId = `schedule-${Date.now()}`;
      
      const newSchedule = {
        id: newId,
        courseId: proposed.courseId,
        teacherId: profile.id, // Assign to current teacher
        roomId: proposed.roomId,
        dayOfWeek: proposed.dayOfWeek,
        startTime: proposed.startTime,
        endTime: proposed.endTime,
        semester: proposed.semester,
      };

      await setDoc(doc(db, "schedules", newId), newSchedule);

      setSuccessMessage(`Successfully scheduled ${proposed.courseId} on ${proposed.dayOfWeek}!`);
      setProposed(null);
      setRequestText("");
      setExplanation(null);
    } catch (err: any) {
      console.error(err);
      setError("Failed to save schedule record to the database.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-stone-200/50 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-text font-source-serif">My Schedule</h1>
          <p className="text-text-muted mt-1">Individual academic timetable and predictive schedule builder.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          AI Solver Active
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Grid: Timetable Grid */}
        <div className="lg:col-span-2 space-y-6">
          <React.Suspense fallback={<div className="animate-pulse h-[600px] bg-surface-alt rounded-xl" />}>
            <TimetableView title="" subtitle="" />
          </React.Suspense>

          {/* List of active schedules */}
          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_50px_rgba(40,30,15,0.08)] backdrop-blur-xl space-y-4">
            <div>
              <h3 className="font-semibold text-stone-900 text-sm">Schedule List</h3>
              <p className="text-[10px] font-medium text-stone-400">Edit or delete your schedule entries directly.</p>
            </div>
            
            <div className="divide-y divide-stone-100">
              {mySchedules.length > 0 ? (
                mySchedules.map((sched, idx) => {
                  const course = courses.find(c => c.id === sched.courseId);
                  const room = rooms.find(r => r.id === sched.roomId);
                  const isEditingSched = editingSchedId === sched.id;

                  if (isEditingSched) {
                    return (
                      <div key={sched.id} className="py-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-stone-900">{course?.name || sched.courseId}</span>
                          <span className="text-[10px] font-bold text-stone-400">{course?.code || sched.courseId}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-stone-500 uppercase">Day</label>
                            <select 
                              value={editDay} 
                              onChange={(e) => setEditDay(e.target.value)}
                              className="w-full h-8 px-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                            >
                              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-stone-500 uppercase">Room</label>
                            <select 
                              value={editRoom} 
                              onChange={(e) => setEditRoom(e.target.value)}
                              className="w-full h-8 px-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                            >
                              <option value="">-- Select --</option>
                              {rooms.map(r => (
                                <option key={r.id} value={r.id}>{r.name} - {r.building}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-stone-500 uppercase">Start Time</label>
                            <input 
                              type="time" 
                              value={editStart} 
                              onChange={(e) => setEditStart(e.target.value)}
                              className="w-full h-8 px-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-stone-500 uppercase">End Time</label>
                            <input 
                              type="time" 
                              value={editEnd} 
                              onChange={(e) => setEditEnd(e.target.value)}
                              className="w-full h-8 px-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                            />
                          </div>
                          <div className="space-y-1 col-span-2">
                            <label className="text-[10px] font-bold text-stone-500 uppercase">Section</label>
                            <input 
                              type="text" 
                              value={editSection} 
                              onChange={(e) => setEditSection(e.target.value)}
                              className="w-full h-8 px-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                              placeholder="e.g. A"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="h-8 text-xs font-semibold px-3"
                            onClick={() => setEditingSchedId(null)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-8 text-xs font-semibold px-3 bg-stone-900 text-white hover:bg-stone-800"
                            onClick={() => handleSaveSched(sched.id)}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={sched.id} className="group flex justify-between items-center py-3 hover:bg-stone-50/50 px-2 rounded-xl transition-all">
                      <div className="min-w-0 pr-3 space-y-0.5">
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {course?.name || sched.courseId}
                        </p>
                        <p className="text-[10px] text-stone-400 font-medium">
                          Code: {course?.code || sched.courseId} • Section: <span className="font-semibold text-stone-700">{sched.sectionId || "A"}</span>
                        </p>
                        <p className="text-[9px] text-stone-500 bg-stone-100 rounded-md px-1.5 py-0.5 inline-block font-semibold mt-1">
                          {sched.dayOfWeek} • {sched.startTime} - {sched.endTime}
                          {room && ` • Room: ${room.name} (${room.building})`}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingSchedId(sched.id);
                              setEditDay(sched.dayOfWeek || "Monday");
                              setEditRoom(sched.roomId || "");
                              setEditStart(sched.startTime || "09:00");
                              setEditEnd(sched.endTime || "10:30");
                              setEditSection(sched.sectionId || "A");
                            }}
                            className="h-7 w-7 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors flex items-center justify-center"
                            title="Edit slot"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteSched(sched.id)}
                            className="h-7 w-7 rounded-lg hover:bg-red-50 text-red-600 transition-colors flex items-center justify-center"
                            title="Delete slot"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-stone-400 italic py-2">
                  No classes scheduled yet. Use the AI Assistant to schedule a slot!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Grid: AI Schedule Fixer Component */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_50px_rgba(40,30,15,0.08)] backdrop-blur-xl space-y-5">
            
            {/* Widget Title */}
            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200/50">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
                <Sparkles size={18} className="animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 text-sm">AI Schedule Assistant</h3>
                <p className="text-[10px] font-medium text-stone-400">Natural-Language Schedule Builder</p>
              </div>
            </div>

            {/* Input Prompt */}
            <div className="space-y-2">
              <label htmlFor="ai-prompt" className="text-xs font-semibold text-stone-700">
                What class would you like to schedule?
              </label>
              <textarea
                id="ai-prompt"
                disabled={loading}
                placeholder="e.g., 'Schedule CS-202 on Friday at 09:00-10:30 in room-001'"
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                className="w-full h-24 p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs outline-none transition focus:border-amber-400 focus:bg-white placeholder:text-stone-400 text-stone-900 resize-none disabled:opacity-50"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleAiAnalyze}
              disabled={loading || !requestText.trim()}
              className="w-full h-11 bg-stone-950 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:bg-stone-800 transition disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Activity size={14} className="animate-spin text-amber-400" />
                  Analyzing DB & Overlaps...
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-amber-400" />
                  AI Analyze Schedule
                </>
              )}
            </Button>

            {/* Error Message */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-[11px] text-red-600 flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-[11px] text-emerald-700 flex items-start gap-2 animate-bounce">
                <CheckCircle size={14} className="shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Response Area */}
            {explanation && (
              <div className="space-y-4 pt-3 border-t border-stone-200/50">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">AI Verification Details</span>
                  <div className="rounded-xl bg-stone-50/80 p-3 border border-stone-100 text-xs text-stone-700 leading-relaxed whitespace-pre-line">
                    {explanation.replace(/\*/g, "")}
                  </div>
                </div>

                {/* Proposed Preview Card */}
                {proposed && (
                  <div className={`rounded-2xl border p-4 space-y-3 ${
                    isValid ? "bg-emerald-50/30 border-emerald-200/50" : "bg-red-50/30 border-red-200/50"
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-stone-500">PROPOSED SCHEDULE SLOT</span>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        isValid 
                          ? "bg-emerald-100/50 text-emerald-800 border-emerald-200" 
                          : "bg-red-100/50 text-red-800 border-red-200"
                      }`}>
                        {isValid ? "Conflict Free" : "Overlap Detected"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[9px] text-stone-400 block font-medium">Course Code</span>
                        <span className="font-semibold text-stone-800">{proposed.courseId}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-stone-400 block font-medium">Classroom</span>
                        <span className="font-semibold text-stone-800">
                          {proposed.roomId === "room-001" ? "Lab 101" : "Lecture Hall A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-stone-400 block font-medium">Day & Semester</span>
                        <span className="font-semibold text-stone-800">{proposed.dayOfWeek}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-stone-400 block font-medium">Timings</span>
                        <span className="font-semibold text-stone-800">{proposed.startTime} - {proposed.endTime}</span>
                      </div>
                    </div>

                    {/* DB Insertion Button */}
                    {isValid && (
                      <button
                        onClick={handleInsert}
                        className="w-full h-10 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                      >
                        <Plus size={14} />
                        Confirm & Insert into DB
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDeleteSched}
        title="Delete Schedule Slot?"
        message="Are you sure you want to delete this schedule slot? This action cannot be undone."
      />
    </div>
  );
}

export default MySchedulePage;
