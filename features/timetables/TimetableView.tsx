"use client";

import React, { useEffect, useState } from "react";
import { TimetableGrid } from "./components/TimetableGrid";
import FacultyRecommendations from "./components/FacultyRecommendations";
import { TimetableEntry, DayOfWeek } from "@/lib/types/timetable.types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/context/AuthContext";
import { getDb } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { Schedule, Course, Room, User } from "@/lib/types/firestore.types";
import { generateMultipleSchedules, generateAiSchedule, AiScheduleReport, detectConflictsAgainstExisting, ConflictInfo } from "@/lib/ai-scheduler";
import { Button } from "@/components/ui/Button";
import { Download, Printer, X, ChevronDown, ChevronUp, Settings, Info, AlertTriangle, Loader2 } from "lucide-react";
import { departmentsService } from "@/features/departments/departments.service";
import { coursesService } from "@/features/courses/courses.service";
import { userManagementService } from "@/features/user-management/user-management.service";
import { facultyLoadService } from "@/features/faculty-load/faculty-load.service";
import { FacultyMember } from "@/lib/types/faculty-load.types";
import { aiSchedulesService } from "@/features/ai-schedules/ai-schedules.service";
import { useNavigate } from "react-router-dom";

interface TimetableViewProps {
  title: string;
  subtitle?: string;
}

export default function TimetableView({ title, subtitle }: TimetableViewProps) {
  const { profile, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<AiScheduleReport | null>(null);
  const [expandedDecision, setExpandedDecision] = useState<number | null>(null);
  const [existingSchedules, setExistingSchedules] = useState<any[]>([]);
  const [draftConflicts, setDraftConflicts] = useState<ConflictInfo[] | null>(null);
  const [autoRegenerated, setAutoRegenerated] = useState(false);
  const [generatedProposals, setGeneratedProposals] = useState<any[] | null>(null);
  const [generationProgress, setGenerationProgress] = useState<string | null>(null);
  const [proposalCount, setProposalCount] = useState(3);
  const navigate = useNavigate();

  // AI configuration & draft states
  const [showConfig, setShowConfig] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [facultyMembers, setFacultyMembers] = useState<FacultyMember[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);

  // Draft preview states
  const [draftEntries, setDraftEntries] = useState<TimetableEntry[] | null>(null);
  const [draftSchedules, setDraftSchedules] = useState<any[] | null>(null);
  const [draftReport, setDraftReport] = useState<AiScheduleReport | null>(null);
  const [previewMode, setPreviewMode] = useState<'active' | 'draft'>('active');

  // Load departments, courses, and teachers for AI generation panel
  useEffect(() => {
    if (!profile || (profile.role !== "admin" && profile.role !== "program_head")) return;

    const unsubDepts = departmentsService.subscribeDepartments((depts) => {
      setDepartments(depts);
    });

    const unsubCourses = coursesService.subscribeCourses((crs) => {
      setAllCourses(crs);
      setSelectedCourseIds(crs.map(c => c.id));
    });

    const unsubTeachers = userManagementService.subscribeUsers((users) => {
      const activeTeachers = users.filter(u => u.role === 'teacher' && u.status === 'active');
      setAllTeachers(activeTeachers);
      setSelectedTeacherIds(activeTeachers.map(t => t.id));
    });

    const unsubFacultyLoad = facultyLoadService.subscribeFacultyLoad((faculty) => {
      setFacultyMembers(faculty);
    });

    return () => {
      unsubDepts();
      unsubCourses();
      unsubTeachers();
      unsubFacultyLoad();
    };
  }, [profile]);

  const handleDeptChange = (deptId: string) => {
    setSelectedDeptId(deptId);
    if (deptId === "all") {
      setSelectedCourseIds(allCourses.map(c => c.id));
      setSelectedTeacherIds(allTeachers.map(t => t.id));
    } else {
      const filteredC = allCourses.filter(c => c.department === deptId);
      const filteredT = allTeachers.filter(t => t.departmentId === deptId);
      setSelectedCourseIds(filteredC.map(c => c.id));
      setSelectedTeacherIds(filteredT.map(t => t.id));
    }
  };


  useEffect(() => {
    if (!profile || !profile.id || authLoading) return;

    const db = getDb();
    if (!db) return;

    setLoading(true);
    setError(null);

    // 1. Define the query for schedules
    let scheduleQuery;
    if (profile.role === 'teacher') {
      scheduleQuery = query(
        collection(db, "schedules"),
        where("teacherId", "==", profile.id)
      );
    } else if (profile.role === 'student') {
      // In a real app, this would be filtered by section or enrollments
      scheduleQuery = collection(db, "schedules");
    } else {
      scheduleQuery = collection(db, "schedules");
    }

    // 2. Listen to changes in real-time
    const unsubscribe = onSnapshot(scheduleQuery, async (snapshot) => {
      try {
        const scheduleData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Schedule[];

        setExistingSchedules(scheduleData);

        // 3. Enrich the data (Courses, Rooms)
        const enrichedEntries: TimetableEntry[] = await Promise.all(
          scheduleData.map(async (s) => {
            const roomDoc = await getDoc(doc(db, "rooms", s.roomId));
            const room = roomDoc.exists() ? (roomDoc.data() as Room) : null;

            let teacherName = s.teacherId;
            if (s.teacherId === profile.id) {
              teacherName = profile.displayName || (profile as any).name || (profile as any).fullName || s.teacherId;
            } else {
              const teacherDoc = await getDoc(doc(db, "users", s.teacherId));
              if (teacherDoc.exists()) {
                const tData = teacherDoc.data();
                teacherName = tData.displayName || tData.name || tData.fullName || s.teacherId;
              }
            }

            // Resolve course details and sectionName
            let realCourseCode = s.courseCode || s.courseId;
            let realCourseName = s.courseName || s.courseId;
            let sectionName = "A";

            try {
              // Try to find course offering document (s.courseId is usually an offering reference ID)
              const offeringDoc = await getDoc(doc(db, "courseOfferings", s.courseId));
              if (offeringDoc.exists()) {
                const offeringData = offeringDoc.data();
                
                // Get Section
                const sectionId = offeringData.sectionId;
                if (sectionId) {
                  const sectionDoc = await getDoc(doc(db, "sections", sectionId));
                  if (sectionDoc.exists()) {
                    sectionName = sectionDoc.data().name || sectionId;
                  }
                }

                // Get Prospectus Course
                const courseDoc = await getDoc(doc(db, "courses", offeringData.courseId));
                if (courseDoc.exists()) {
                  realCourseCode = courseDoc.data().code || realCourseCode;
                  realCourseName = courseDoc.data().name || realCourseName;
                }
              } else {
                // Fallback: If s.courseId directly maps to the courses collection
                const courseDoc = await getDoc(doc(db, "courses", s.courseId));
                if (courseDoc.exists()) {
                  realCourseCode = courseDoc.data().code || realCourseCode;
                  realCourseName = courseDoc.data().name || realCourseName;
                }

                // Try root sectionId as a secondary fallback
                const sectionId = (s as any).sectionId;
                if (sectionId) {
                  const sectionDoc = await getDoc(doc(db, "sections", sectionId));
                  if (sectionDoc.exists()) {
                    sectionName = sectionDoc.data().name || sectionId;
                  }
                }
              }
            } catch (err) {
              console.error("Error enriching schedule document:", s.id, err);
            }

            return {
              id: s.id,
              courseCode: realCourseCode,
              courseName: realCourseName,
              teacherName: teacherName,
              sectionName,
              room: room ? `${room.name} (${room.building})` : s.roomId,
              day: s.dayOfWeek as DayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
              type: room?.type === "laboratory" ? "lab" : (room?.type as any) || "lecture",
            };
          })
        );

        setEntries(enrichedEntries);
        setLoading(false);
      } catch (err: any) {
        console.error("Error enriching timetable data:", err);
        setError("Failed to process schedule updates.");
        setLoading(false);
      }
    }, (err) => {
      console.error("Schedule subscription error:", err);
      setError("Failed to connect to real-time schedule updates.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile, authLoading]);

  const enrichSchedules = async (schedules: any[], db: any) => {
    return Promise.all(
      schedules.map(async (s) => {
        const courseDoc = await getDoc(doc(db, "courses", s.courseId));
        const course = courseDoc.exists() ? (courseDoc.data() as Course) : null;
        const roomDoc = await getDoc(doc(db, "rooms", s.roomId));
        const room = roomDoc.exists() ? (roomDoc.data() as Room) : null;
        const teacherDoc = await getDoc(doc(db, "users", s.teacherId));
        const teacher = teacherDoc.exists() ? (teacherDoc.data() as User) : null;

        const courseName = course?.name || s.courseId;
        const roomName = room ? `${room.name} (${room.building})` : s.roomId;
        const teacherDisplayName = teacher ? teacher.displayName : s.teacherId;

        const sectionId = (s as any).sectionId;
        let sectionName = sectionId || "A";
        if (sectionId) {
          const sectionDoc = await getDoc(doc(db, "sections", sectionId));
          if (sectionDoc.exists()) {
            sectionName = sectionDoc.data().name || sectionId;
          }
        }

        return {
          id: `draft-${Math.random().toString(36).substr(2, 9)}`,
          courseCode: s.courseId,
          courseName: courseName || s.courseId,
          teacherName: teacherDisplayName,
          sectionName,
          room: roomName,
          day: s.dayOfWeek as DayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          type: (roomName.toLowerCase().includes("lab") ? "lab" : "lecture") as TimetableEntry["type"],
        };
      })
    );
  };

  const handleGenerateAiSchedule = async () => {
    if (!profile || (profile.role !== "admin" && profile.role !== "program_head")) return;

    setIsGenerating(true);
    setError(null);
    setAiReport(null);
    setDraftConflicts(null);
    setAutoRegenerated(false);
    setGeneratedProposals(null);
    setGenerationProgress("Loading data...");

    try {
      const db = getDb();
      const coursesSnap = await getDocs(collection(db, "courses"));
      const courses = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Course[];

      const usersSnap = await getDocs(collection(db, "users"));
      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as User[];

      const roomsSnap = await getDocs(collection(db, "rooms"));
      const rooms = roomsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Room[];

      const filteredCourses = courses.filter(c => selectedCourseIds.includes(c.id));
      const filteredUsers = users.filter(u => selectedTeacherIds.includes(u.id));

      if (filteredCourses.length === 0) {
        setError("Please select at least one course/subject to schedule.");
        setIsGenerating(false);
        return;
      }
      if (filteredUsers.length === 0) {
        setError("Please select at least one faculty member to assign.");
        setIsGenerating(false);
        return;
      }

      // Detect conflicts against existing schedules before generation
      setGenerationProgress("Generating proposals...");

      // Generate multiple schedule proposals
      const allResults = generateMultipleSchedules(
        filteredCourses,
        filteredUsers,
        rooms,
        proposalCount,
        "Semester 1, 2026",
        existingSchedules
      );

      // Find the best result (most scheduled, least conflicts)
      allResults.sort((a, b) => {
        const scoreA = a.report.totalScheduled - a.report.conflictsAvoided * 0.1;
        const scoreB = b.report.totalScheduled - b.report.conflictsAvoided * 0.1;
        return scoreB - scoreA;
      });

      const bestResult = allResults[0];
      const { schedules: newSchedules, report } = bestResult;

      if (newSchedules.length === 0) {
         setError("AI could not generate a schedule with the current constraints (e.g. not enough teachers or rooms).");
         setIsGenerating(false);
         return;
      }

      // Detect conflicts against existing schedules
      const conflicts = detectConflictsAgainstExisting(newSchedules, existingSchedules, filteredUsers, rooms);
      setDraftConflicts(conflicts);

      // If conflicts found and not already regenerated, try once more with stricter avoidance
      if (conflicts.length > 0 && !autoRegenerated) {
        setAutoRegenerated(true);
        setGenerationProgress(`Detected ${conflicts.length} conflict(s), regenerating to minimize them...`);
        const retryResult = generateAiSchedule(filteredCourses, filteredUsers, rooms, "Semester 1, 2026", existingSchedules);
        const retryConflicts = detectConflictsAgainstExisting(retryResult.schedules, existingSchedules, filteredUsers, rooms);
        if (retryConflicts.length < conflicts.length) {
          retryResult.schedules.forEach(s => newSchedules.push(s));
          retryResult.report.decisions.forEach(d => report.decisions.push(d));
          report.totalScheduled = report.totalScheduled + retryResult.report.totalScheduled;
          report.totalSkipped = retryResult.report.totalSkipped;
          report.conflictsAvoided = report.conflictsAvoided + retryResult.report.conflictsAvoided + retryConflicts.length;
          report.skippedCourses = retryResult.report.skippedCourses;
          Object.entries(retryResult.report.teacherLoadSummary).forEach(([k, v]) => {
            report.teacherLoadSummary[k] = (report.teacherLoadSummary[k] || 0) + v;
          });
          Object.entries(retryResult.report.roomUsageSummary).forEach(([k, v]) => {
            report.roomUsageSummary[k] = (report.roomUsageSummary[k] || 0) + v;
          });
          setDraftConflicts(retryConflicts);
        } else {
          setDraftConflicts(conflicts);
        }
      }

      // Enrich draft schedules for rendering
      const enrichedDraft = await enrichSchedules(newSchedules, db);

      setDraftSchedules(newSchedules);
      setDraftEntries(enrichedDraft);
      setDraftReport(report);
      setPreviewMode('draft');
      setShowConfig(false);

      // Auto-save all generated proposals
      setGenerationProgress("Saving proposals...");
      const savedProposals = [];
      for (let i = 0; i < allResults.length; i++) {
        const result = allResults[i];
        const enriched = await enrichSchedules(result.schedules, db);
        const proposal = await aiSchedulesService.saveProposal({
          name: `AI Proposal #${i + 1} - ${new Date().toLocaleDateString()}`,
          createdAt: new Date().toISOString(),
          status: "draft" as const,
          filteredDepts: selectedDeptId === "all" ? [] : [selectedDeptId],
          filteredCourses: selectedCourseIds,
          filteredTeachers: selectedTeacherIds,
          totalScheduled: result.report.totalScheduled,
          totalSkipped: result.report.totalSkipped,
          conflictsAvoided: result.report.conflictsAvoided,
          data: {
            schedules: result.schedules,
            entries: enriched,
          },
          report: result.report,
        });
        savedProposals.push(proposal);
      }
      setGeneratedProposals(savedProposals);
      setGenerationProgress(null);

    } catch (err: any) {
      console.error("Failed to generate AI schedule draft:", err);
      setError("Failed to generate AI schedule. Ensure you have valid data.");
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  const handleSaveProposal = async () => {
    if (!draftSchedules || !draftReport || !profile) return;
    
    setIsGenerating(true);
    setError(null);
    try {
      await aiSchedulesService.saveProposal({
        name: `AI Proposal - ${new Date().toLocaleDateString()}`,
        createdAt: new Date().toISOString(),
        status: "draft",
        filteredDepts: selectedDeptId === "all" ? [] : [selectedDeptId],
        filteredCourses: selectedCourseIds,
        filteredTeachers: selectedTeacherIds,
        totalScheduled: draftReport.totalScheduled,
        totalSkipped: draftReport.totalSkipped,
        conflictsAvoided: draftReport.conflictsAvoided,
        data: {
          schedules: draftSchedules,
          entries: draftEntries || [],
        },
        report: draftReport,
      });

      setDraftSchedules(null);
      setDraftEntries(null);
      setDraftReport(null);
      setPreviewMode('active');
      navigate("/dashboard?tab=ai-schedules");
    } catch (err: any) {
      console.error("Failed to save AI proposal:", err);
      setError("Failed to save proposal.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDiscardDraft = () => {
    setDraftSchedules(null);
    setDraftEntries(null);
    setDraftReport(null);
    setPreviewMode('active');
  };


  const handleExportCsv = () => {
    if (entries.length === 0) return;
    
    const headers = ["Day", "Start Time", "End Time", "Course Code", "Course Name", "Faculty", "Room", "Type"];
    const rows = entries.map(entry => [
      entry.day,
      entry.startTime,
      entry.endTime,
      entry.courseCode,
      `"${entry.courseName.replace(/"/g, '""')}"`,
      `"${entry.teacherName.replace(/"/g, '""')}"`,
      `"${entry.room.replace(/"/g, '""')}"`,
      entry.type
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `timetable_schedule_${profile?.displayName?.toLowerCase().replace(/\s+/g, '_') || 'export'}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPdf = () => {
    window.print();
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-surface-alt rounded-xl" />
        <div className="h-[500px] bg-surface-alt rounded-xl" />
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



  if (!profile) {
    return (
      <div className="p-8 text-center bg-amber-50 rounded-xl border border-amber-100">
        <p className="text-amber-600 font-medium">Please log in to view your schedule.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      <style>{`
        @media print {
          /* Hide sidebar, header, ai chat drawer and export buttons */
          aside,
          header,
          .no-print,
          button,
          .fixed,
          [class*="Sidebar"],
          [class*="Header"],
          [class*="AiChatDrawer"] {
            display: none !important;
          }
          
          html, body {
            background-color: white !important;
            color: black !important;
            height: auto !important;
            overflow: visible !important;
          }
          
          main, 
          .flex-1,
          .mx-auto,
          .max-w-7xl {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            display: block !important;
          }

          .shadow-md, .shadow-lg, .shadow-xl {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 0.5rem !important;
          }
        }
      `}</style>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif">{title}</h1>
          {subtitle && <p className="text-text-muted mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {(profile.role === "admin" || profile.role === "program_head") && (
            <Button 
              onClick={() => {
                if (previewMode === 'draft') {
                  setPreviewMode('active');
                }
                setShowConfig(!showConfig);
              }}
              disabled={isGenerating}
              className={`${showConfig ? 'bg-primary hover:bg-primary/95' : 'bg-accent hover:bg-accent/90'} text-white shadow-md animate-in fade-in zoom-in duration-500 no-print`}
            >
              {showConfig ? "Hide Generator Panel" : "✨ Auto-Schedule with AI"}
            </Button>
          )}

          <Button 
            onClick={handleExportCsv}
            disabled={(previewMode === 'draft' ? (draftEntries || []) : entries).length === 0}
            variant="secondary"
            className="no-print gap-1.5 h-10 text-xs hover:bg-surface-alt font-manrope border border-border"
          >
            <Download className="h-4 w-4 text-text-muted" />
            Export CSV
          </Button>

          <Button 
            onClick={handleExportPdf}
            disabled={(previewMode === 'draft' ? (draftEntries || []) : entries).length === 0}
            variant="secondary"
            className="no-print gap-1.5 h-10 text-xs hover:bg-surface-alt font-manrope border border-border"
          >
            <Printer className="h-4 w-4 text-text-muted" />
            Print / PDF
          </Button>

          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 no-print">
            {(previewMode === 'draft' ? (draftEntries || []) : entries).length > 0 ? (previewMode === 'draft' ? (draftEntries || []) : entries)[0].type.toUpperCase() : "Semester 1, 2026"}
          </Badge>
          <Badge variant="outline" className={`no-print ${previewMode === 'draft' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-accent/5 text-accent border-accent/20'}`}>
            {previewMode === 'draft' ? 'DRAFT PREVIEW' : 'PUBLISHED'}
          </Badge>
        </div>
      </div>

      {/* AI Schedule Generation configuration panel */}
      {showConfig && (profile.role === "admin" || profile.role === "program_head") && (
        <Card className="border border-border shadow-md bg-white p-6 rounded-2xl animate-in slide-in-from-top-4 duration-300 no-print">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold tracking-tight text-text font-source-serif">AI Timetable Generation Settings</h2>
          </div>
          
          <div className="space-y-6">
            {/* Department selection */}
            <div>
              <label className="block text-sm font-semibold text-text mb-2">Select Department Filter</label>
              <select
                value={selectedDeptId}
                onChange={(e) => handleDeptChange(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Courses checkbox list */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-text">Subjects / Courses ({allCourses.filter(c => selectedDeptId === 'all' || c.department === selectedDeptId).length})</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const filtered = allCourses.filter(c => selectedDeptId === 'all' || c.department === selectedDeptId);
                        setSelectedCourseIds(prev => Array.from(new Set([...prev, ...filtered.map(c => c.id)])));
                      }}
                      className="text-xs text-accent font-medium hover:underline"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => {
                        const filtered = allCourses.filter(c => selectedDeptId === 'all' || c.department === selectedDeptId);
                        setSelectedCourseIds(prev => prev.filter(id => !filtered.some(c => c.id === id)));
                      }}
                      className="text-xs text-text-muted font-medium hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="border border-border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 bg-surface-alt/25">
                  {allCourses
                    .filter(c => selectedDeptId === 'all' || c.department === selectedDeptId)
                    .map((course) => {
                      const isChecked = selectedCourseIds.includes(course.id);
                      return (
                        <label key={course.id} className="flex items-start gap-2.5 p-1.5 hover:bg-surface-alt rounded cursor-pointer transition-colors text-sm">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedCourseIds(prev => 
                                isChecked ? prev.filter(id => id !== course.id) : [...prev, course.id]
                              );
                            }}
                            className="mt-1 rounded text-accent focus:ring-accent"
                          />
                          <div>
                            <span className="font-semibold text-text mr-1.5">{course.code}</span>
                            <span className="text-text-muted">{course.name}</span>
                          </div>
                        </label>
                      );
                    })}
                  {allCourses.filter(c => selectedDeptId === 'all' || c.department === selectedDeptId).length === 0 && (
                    <p className="text-xs text-text-muted text-center py-4">No courses available for selected department filter</p>
                  )}
                </div>
              </div>

              {/* Faculty checkbox list */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-text">Faculty / Instructors ({allTeachers.filter(t => selectedDeptId === 'all' || t.departmentId === selectedDeptId).length})</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const filtered = allTeachers.filter(t => selectedDeptId === 'all' || t.departmentId === selectedDeptId);
                        setSelectedTeacherIds(prev => Array.from(new Set([...prev, ...filtered.map(t => t.id)])));
                      }}
                      className="text-xs text-accent font-medium hover:underline"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => {
                        const filtered = allTeachers.filter(t => selectedDeptId === 'all' || t.departmentId === selectedDeptId);
                        setSelectedTeacherIds(prev => prev.filter(id => !filtered.some(t => t.id === id)));
                      }}
                      className="text-xs text-text-muted font-medium hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="border border-border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 bg-surface-alt/25">
                  {allTeachers
                    .filter(t => selectedDeptId === 'all' || t.departmentId === selectedDeptId)
                    .map((teacher) => {
                      const isChecked = selectedTeacherIds.includes(teacher.id);
                      return (
                        <label key={teacher.id} className="flex items-center gap-2.5 p-1.5 hover:bg-surface-alt rounded cursor-pointer transition-colors text-sm">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedTeacherIds(prev => 
                                isChecked ? prev.filter(id => id !== teacher.id) : [...prev, teacher.id]
                              );
                            }}
                            className="rounded text-accent focus:ring-accent"
                          />
                          <span className="text-text">{teacher.displayName || teacher.email}</span>
                        </label>
                      );
                    })}
                  {allTeachers.filter(t => selectedDeptId === 'all' || t.departmentId === selectedDeptId).length === 0 && (
                    <p className="text-xs text-text-muted text-center py-4">No active faculty available for selected department filter</p>
                  )}
                </div>
              </div>
            </div>

            {/* Faculty Recommendations */}
            <div className="border-t border-border pt-4">
              <FacultyRecommendations
                courses={allCourses
                  .filter(c => selectedCourseIds.includes(c.id))
                  .map(c => ({
                    id: c.id,
                    code: c.code || c.id,
                    name: c.name || c.id,
                    department: (c as any).departmentId || (c as any).department || "",
                  }))}
                facultyList={facultyMembers.filter(f => selectedTeacherIds.includes(f.id))}
              />
            </div>

            {/* Number of proposals */}
            <div>
              <label className="block text-sm font-semibold text-text mb-2">Number of Proposals to Generate</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setProposalCount(n)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      proposalCount === n
                        ? "bg-accent text-white border-accent"
                        : "border-border text-text-muted hover:border-accent hover:text-accent"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-muted mt-1">Each proposal is a unique variant. The best one will be previewed; all are saved automatically.</p>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowConfig(false)}
                className="h-10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateAiSchedule}
                disabled={isGenerating || selectedCourseIds.length === 0 || selectedTeacherIds.length === 0}
                className="bg-accent hover:bg-accent/90 text-white h-10 font-medium"
              >
                {isGenerating ? "Generating..." : "⚡ Generate Schedule"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* AI Schedule Draft Preview Banner */}
      {previewMode === 'draft' && draftSchedules && (
        <div className={`p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300 no-print ${
          draftConflicts && draftConflicts.length > 0
            ? "bg-red-50 border border-red-200"
            : "bg-amber-50 border border-amber-200"
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg mt-0.5 ${
              draftConflicts && draftConflicts.length > 0
                ? "bg-red-100 text-red-800"
                : "bg-amber-100 text-amber-800"
            }`}>
              {draftConflicts && draftConflicts.length > 0 ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            </div>
            <div>
              <h3 className={`text-base font-bold ${
                draftConflicts && draftConflicts.length > 0 ? "text-red-900" : "text-amber-900"
              }`}>
                {autoRegenerated ? "Regenerated — Conflict Minimized" : "Previewing AI Timetable Draft"}
              </h3>
              <p className={`text-sm mt-0.5 ${
                draftConflicts && draftConflicts.length > 0 ? "text-red-700" : "text-amber-700"
              }`}>
                AI generated <strong>{draftSchedules.length}</strong> classes.
                {draftConflicts && draftConflicts.length > 0
                  ? ` ⚠️ ${draftConflicts.length} conflict(s) with existing schedules detected.`
                  : " No conflicts with existing schedules found."}
                {autoRegenerated && " A second pass was run to reduce conflicts."}
                {generatedProposals && ` ${generatedProposals.length} proposals saved automatically.`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => setAiReport(draftReport)}
              variant="secondary"
              className="border border-amber-300 bg-white text-amber-800 hover:bg-amber-100 font-medium text-xs h-9"
            >
              View Decisions Report
            </Button>
            <Button
              onClick={handleSaveProposal}
              className="bg-accent hover:bg-accent/90 text-white font-medium text-xs h-9"
            >
              Save as Proposal
            </Button>
            <Button
              onClick={handleDiscardDraft}
              variant="secondary"
              className="border border-border text-text hover:bg-surface-alt font-medium text-xs h-9"
            >
              Discard Draft
            </Button>
          </div>
        </div>
      )}

      <Card className="border-none shadow-md overflow-hidden bg-white/40 backdrop-blur-md">
        <CardContent className="p-0">
          <TimetableGrid entries={previewMode === 'draft' ? (draftEntries || []) : entries} />
        </CardContent>
      </Card>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50/30 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 uppercase tracking-wider">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{(previewMode === 'draft' ? (draftEntries || []) : entries).length} Classes</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/30 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 uppercase tracking-wider">Lectures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">
              {(previewMode === 'draft' ? (draftEntries || []) : entries).filter(e => e.type === "lecture").length} Sessions
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50/30 border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 uppercase tracking-wider">Labs / Practicals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {(previewMode === 'draft' ? (draftEntries || []) : entries).filter(e => e.type === "lab").length} Sessions
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inline generation indicator */}
      {isGenerating && (
        <div className="bg-accent/5 border border-accent/20 p-4 rounded-2xl flex items-center gap-4 animate-in fade-in duration-300 no-print">
          <Loader2 className="w-5 h-5 text-accent animate-spin shrink-0" />
          <div>
            <p className="text-sm font-medium text-text">
              {generationProgress || "Generating proposals..."}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              Processing courses, faculty, and rooms to build {proposalCount} schedule variant(s) with conflict detection.
            </p>
          </div>
        </div>
      )}

      {/* AI Report Modal */}
      {aiReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">✨ AI Schedule Report</h2>
                <p className="text-sm text-gray-500 mt-0.5">Here&apos;s why the AI made these decisions</p>
              </div>
              <button onClick={() => { setAiReport(null); setExpandedDecision(null); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-700">{aiReport.totalScheduled}</div>
                  <div className="text-xs text-emerald-600 font-medium">Scheduled</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-amber-700">{aiReport.conflictsAvoided}</div>
                  <div className="text-xs text-amber-600 font-medium">Conflicts Avoided</div>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-red-700">{aiReport.totalSkipped}</div>
                  <div className="text-xs text-red-600 font-medium">Skipped</div>
                </div>
              </div>

              {/* Skipped courses warning */}
              {aiReport.skippedCourses.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-red-800 mb-2">⚠️ Could Not Schedule</h3>
                  {aiReport.skippedCourses.map((s, i) => (
                    <p key={i} className="text-sm text-red-700"><strong>{s.name}:</strong> {s.reason}</p>
                  ))}
                </div>
              )}

              {/* Per-course decisions */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Assignment Decisions</h3>
                <div className="space-y-2">
                  {aiReport.decisions.map((d, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl overflow-hidden transition-all">
                      <button
                        onClick={() => setExpandedDecision(expandedDecision === i ? null : i)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-md shrink-0">{d.courseCode}</span>
                          <span className="text-sm font-medium text-gray-800 truncate">{d.courseName}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-400">{d.day} {d.timeSlot}</span>
                          {expandedDecision === i ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </button>
                      {expandedDecision === i && (
                        <div className="px-4 pb-4 space-y-3 border-t border-gray-50 bg-gray-50/50 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="pt-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">👩‍🏫 Faculty Assignment</p>
                            <p className="text-sm text-gray-800 font-medium">{d.assignedTeacher}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{d.teacherReason}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">🏫 Room Assignment</p>
                            <p className="text-sm text-gray-800 font-medium">{d.assignedRoom}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{d.roomReason}</p>
                          </div>
                          {d.conflictsAvoided > 0 && (
                            <div className="bg-amber-50 rounded-lg px-3 py-2">
                              <p className="text-xs text-amber-700">⚡ {d.conflictsAvoided} conflict(s) were detected and avoided before finding this slot.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Teacher Load */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Faculty Load Distribution</h3>
                <div className="space-y-2">
                  {Object.entries(aiReport.teacherLoadSummary).sort(([,a],[,b]) => b - a).map(([name, count]) => (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 w-40 truncate" title={name}>{name}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all"
                          style={{ width: `${Math.min((count / Math.max(...Object.values(aiReport.teacherLoadSummary))) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-600 w-12 text-right">{count} cls</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Room Usage */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Room Usage</h3>
                <div className="space-y-2">
                  {Object.entries(aiReport.roomUsageSummary).sort(([,a],[,b]) => b - a).map(([name, count]) => (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 w-40 truncate" title={name}>{name}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-400 to-violet-600 rounded-full transition-all"
                          style={{ width: `${Math.min((count / Math.max(...Object.values(aiReport.roomUsageSummary))) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-600 w-12 text-right">{count} cls</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <Button onClick={() => { setAiReport(null); setExpandedDecision(null); }} className="bg-accent hover:bg-accent/90 text-white">
                Got it, close report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
