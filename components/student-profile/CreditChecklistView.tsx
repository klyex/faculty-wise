"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { 
  GraduationCap, 
  Award, 
  BookOpen, 
  Layers, 
  Activity, 
  CheckCircle2, 
  Clock, 
  HelpCircle,
  TrendingUp,
  FileSpreadsheet,
  Briefcase,
  Play
} from "lucide-react";
import { getDb } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

// Curriculum database course structure
interface CurriculumCourse {
  code: string;
  name: string;
  units: number;
  category: "core" | "gen_ed" | "elective";
  grade?: string;
  status: "completed" | "in_progress" | "remaining";
  term: string; // E.g., "1st Year, 1st Sem"
}

export function CreditChecklistView() {
  const { profile } = useAuth();
  const [curriculum, setCurriculum] = useState<CurriculumCourse[]>([]);
  const [initialCurriculum, setInitialCurriculum] = useState<CurriculumCourse[]>([]);
  const [activeYear, setActiveYear] = useState<string>("3rd Year");
  const [loading, setLoading] = useState(true);
  const [studentProgram, setStudentProgram] = useState<any>(null);

  // Load student's curriculum from Firestore
  useEffect(() => {
    if (!profile || !profile.id) {
      setLoading(false);
      return;
    }

    const db = getDb();

    if (!db) return;

    // Fetch from Firestore in real-time
    const unsubscribe = onSnapshot(
      query(
        collection(db, "enrollments"),
        where("studentId", "==", profile.id)
      ),
      async (snapshot) => {
        try {
          const enrollments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Map enrollments to curriculum courses
          const curriculumCourses: CurriculumCourse[] = await Promise.all(
            enrollments.map(async (enrollment: any) => ({
              code: enrollment.courseCode || enrollment.id,
              name: enrollment.courseName || "Course",
              units: enrollment.units || 3,
              category: enrollment.category || "core",
              grade: enrollment.grade,
              status: enrollment.status || "remaining",
              term: enrollment.term || "Current Semester"
            }))
          );

          setCurriculum(curriculumCourses);
          setInitialCurriculum(curriculumCourses);
          setLoading(false);
        } catch (error) {
          console.error("Error loading curriculum:", error);
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [profile?.id]);

  // Toggle planned Remaining courses to Completed to simulate interactive planning
  const toggleCourseStatus = (code: string) => {
    setCurriculum((prev) =>
      prev.map((c) => {
        if (c.code === code) {
          if (c.status === "remaining") {
            return { ...c, status: "completed", grade: "1.50" }; // Assume simulated good grade
          } else if (c.status === "completed" && c.grade === "1.50") {
            return { ...c, status: "remaining", grade: undefined };
          }
        }
        return c;
      })
    );
  };

  // Perform calculations based on current state
  const totalRequiredUnits = curriculum.reduce((acc, c) => acc + c.units, 0);
  
  const completedUnits = curriculum
    .filter((c) => c.status === "completed")
    .reduce((acc, c) => acc + c.units, 0);
    
  const inProgressUnits = curriculum
    .filter((c) => c.status === "in_progress")
    .reduce((acc, c) => acc + c.units, 0);

  const remainingUnits = curriculum
    .filter((c) => c.status === "remaining")
    .reduce((acc, c) => acc + c.units, 0);

  const progressPercentage = totalRequiredUnits > 0 ? Math.round((completedUnits / totalRequiredUnits) * 100) : 0;

  // GPA calculation (Philippine system where 1.0 is highest, 3.0 is passing, weighted by units)
  const completedCoursesWithGrades = curriculum.filter(
    (c) => c.status === "completed" && c.grade
  );
  
  const totalWeightedGrade = completedCoursesWithGrades.reduce(
    (acc, c) => acc + parseFloat(c.grade!) * c.units,
    0
  );
  
  const completedGradesUnits = completedCoursesWithGrades.reduce(
    (acc, c) => acc + c.units,
    0
  );
  
  const cumulativeGPA = completedGradesUnits > 0 
    ? (totalWeightedGrade / completedGradesUnits).toFixed(2) 
    : "1.50";

  // Standing evaluation
  const getAcademicStanding = (gpa: string) => {
    const numericGPA = parseFloat(gpa);
    if (numericGPA <= 1.25) return "Summa Cum Laude Standing";
    if (numericGPA <= 1.50) return "Magna Cum Laude Standing";
    if (numericGPA <= 1.75) return "Cum Laude Standing";
    return "Regular Standing";
  };

  // Category breakdown calculators
  const getCategoryProgress = (cat: CurriculumCourse["category"]) => {
    const catCourses = curriculum.filter((c) => c.category === cat);
    const catTotal = catCourses.reduce((acc, c) => acc + c.units, 0);
    const catDone = catCourses
      .filter((c) => c.status === "completed")
      .reduce((acc, c) => acc + c.units, 0);
    return { done: catDone, total: catTotal };
  };

  const coreProg = getCategoryProgress("core");
  const genProg = getCategoryProgress("gen_ed");
  const elecProg = getCategoryProgress("elective");

  // Filtering curriculum by selected year
  const getCoursesForYear = (yearName: string) => {
    return curriculum.filter((c) => c.term.startsWith(yearName));
  };

  const getStatusBadge = (status: CurriculumCourse["status"]) => {
    switch (status) {
      case "completed":
        return <Badge variant="success" className="bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</Badge>;
      case "in_progress":
        return <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border border-indigo-200">In Progress</Badge>;
      default:
        return <Badge variant="outline" className="bg-stone-50 text-stone-500 border border-stone-200">Remaining</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-750 font-manrope">
      
      {/* Header Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-gradient-to-r from-violet-650 to-indigo-650 p-6 md:p-8 rounded-3xl text-white shadow-xl shadow-indigo-600/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full text-white/90">
            Curriculum Checklist & Audit
          </span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-3 font-source-serif">
            My Credit/Unit Checklist
          </h1>
          <p className="text-white/80 text-sm mt-1 max-w-xl">
            Track your degree progress, audit accumulated program units, and simulate future semesters to ensure a timely graduation.
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Badge variant="outline" className="bg-white/10 text-white border-white/20 self-start md:self-end flex items-center gap-1.5 py-1 px-3">
            <GraduationCap className="h-3.5 w-3.5" />
            BS Computer Science
          </Badge>
          <span className="text-[10px] text-white/70 self-start md:self-end">
            Curriculum Version: 2022 Revision
          </span>
        </div>
      </div>

      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Unit Completion Progress Circular Dial card */}
        <Card className="border-border/50 shadow-sm bg-white overflow-hidden flex flex-col md:col-span-2">
          <CardHeader className="bg-surface-alt/20 border-b border-border/40 py-4.5 px-6">
            <CardTitle className="text-xs font-bold text-stone-900 flex items-center gap-2 uppercase tracking-wider">
              <Layers className="h-4 w-4 text-indigo-600" />
              Degree Program Completion
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-between">
            <div className="flex items-center gap-6">
              {/* Premium radial progress ring */}
              <div className="relative flex items-center justify-center h-28 w-28 shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    className="stroke-stone-100"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    className="stroke-indigo-600 transition-all duration-500 ease-out"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={301.6}
                    strokeDashoffset={301.6 - (301.6 * progressPercentage) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-stone-900 leading-none">{progressPercentage}%</span>
                  <span className="text-[9px] text-stone-400 font-bold uppercase mt-1">Done</span>
                </div>
              </div>

              {/* Progress detail metrics */}
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-stone-850">Curriculum Units Overview</h4>
                  <p className="text-[10px] text-stone-400 mt-0.5">Total credit units mapped: <strong className="text-stone-800">{totalRequiredUnits} units</strong></p>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-stone-100">
                  <div>
                    <span className="block text-xs font-bold text-emerald-600 leading-tight">{completedUnits} u</span>
                    <span className="text-[9px] text-stone-400 font-medium">Completed</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-indigo-650 leading-tight">{inProgressUnits} u</span>
                    <span className="text-[9px] text-stone-400 font-medium">In-Flight</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-stone-500 leading-tight">{remainingUnits} u</span>
                    <span className="text-[9px] text-stone-400 font-medium">Remaining</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GPA & Honors stand card */}
        <Card className="border-border/50 shadow-sm bg-white overflow-hidden flex flex-col">
          <CardHeader className="bg-surface-alt/20 border-b border-border/40 py-4.5 px-6">
            <CardTitle className="text-xs font-bold text-stone-900 flex items-center gap-2 uppercase tracking-wider">
              <Award className="h-4 w-4 text-amber-500 animate-pulse" />
              Academic Standings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-stone-900 leading-none">{cumulativeGPA}</span>
                <span className="text-[10px] font-bold text-stone-400">/ 5.0 GPA</span>
              </div>
              <p className="text-[10px] font-bold text-amber-700 mt-1 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {getAcademicStanding(cumulativeGPA)}
              </p>
            </div>
            <div className="mt-4 pt-3.5 border-t border-stone-100">
              <p className="text-[10px] text-stone-400 leading-relaxed">
                * GPA utilizes the 1.0 (Highest) to 3.0 (Passing) grade distribution mapping.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Categories Bar Distribution Card */}
        <Card className="border-border/50 shadow-sm bg-white overflow-hidden flex flex-col">
          <CardHeader className="bg-surface-alt/20 border-b border-border/40 py-4.5 px-6">
            <CardTitle className="text-xs font-bold text-stone-900 flex items-center gap-2 uppercase tracking-wider">
              <Activity className="h-4 w-4 text-teal-650" />
              Accumulation Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
            {/* Core major courses */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-stone-700">Core Major Classes</span>
                <span className="text-stone-900">{coreProg.done} / {coreProg.total} u</span>
              </div>
              <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-indigo-600 transition-all duration-500" 
                  style={{ width: `${(coreProg.done / coreProg.total) * 100}%` }}
                />
              </div>
            </div>

            {/* Gen Eds */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-stone-700">General Education</span>
                <span className="text-stone-900">{genProg.done} / {genProg.total} u</span>
              </div>
              <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-teal-500 transition-all duration-500" 
                  style={{ width: `${(genProg.done / genProg.total) * 100}%` }}
                />
              </div>
            </div>

            {/* Electives */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-stone-700">Professional Electives</span>
                <span className="text-stone-900">{elecProg.done} / {elecProg.total} u</span>
              </div>
              <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-amber-500 transition-all duration-500" 
                  style={{ width: `${elecProg.total > 0 ? (elecProg.done / elecProg.total) * 100 : 0}%` }}
                />
              </div>
            </div>

          </CardContent>
        </Card>

      </div>

      {/* INTERACTIVE PLANNING NOTE / AUDITOR WIDGET */}
      <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-150 flex items-start gap-4 shadow-sm animate-pulse">
        <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
          <Play className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-bold text-xs text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
            Registrar Interactive Planner Mode Active
          </h4>
          <p className="text-xs text-indigo-800/80 leading-relaxed mt-1">
            Need to see how upcoming coursework affects your degree progression? Simply scroll to the curriculum list below and <strong>click on any gray "Remaining" course</strong>. It will temporarily check off that class to simulate credits gained, recalculating your degree completion and credit progress in real-time!
          </p>
        </div>
      </div>

      {/* Main Checklist Card and Tabs */}
      <Card className="border-border/50 shadow-md bg-white overflow-hidden">
        <CardHeader className="bg-stone-50 border-b border-border/40 p-0">
          
          {/* Year Tabs */}
          <div className="flex border-b border-border/20 bg-stone-100/50">
            {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((year) => (
              <button
                key={year}
                onClick={() => setActiveYear(year)}
                className={`px-6 py-4.5 text-xs font-bold border-b-2.5 transition-all text-center flex-1 sm:flex-none ${
                  activeYear === year
                    ? "border-indigo-600 text-indigo-650 bg-white"
                    : "border-transparent text-stone-500 hover:text-stone-850 hover:bg-stone-50"
                }`}
              >
                {year} Curriculum
              </button>
            ))}
          </div>

          <div className="px-6 py-3.5 flex flex-wrap gap-2.5 items-center justify-between bg-white border-t border-border/40">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-850">
              <BookOpen className="h-4.5 w-4.5 text-indigo-600" />
              <span>Year Mapping: {activeYear} Modules</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Legend:</span>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Completed</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600"><span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" /> In Progress</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-500"><span className="h-2 w-2 rounded-full bg-stone-400" /> Remaining</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          
          {/* 1st Semester Section */}
          <div className="p-6 border-b border-border/30">
            <h3 className="text-xs font-black text-stone-900 uppercase tracking-widest bg-stone-100 py-1.5 px-3 rounded-lg inline-block">
              First Semester Modules
            </h3>
            
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    <th className="pb-3 w-28">Course Code</th>
                    <th className="pb-3">Course Title</th>
                    <th className="pb-3 w-24">Credits</th>
                    <th className="pb-3 w-24">Category</th>
                    <th className="pb-3 w-24">Grade</th>
                    <th className="pb-3 w-32">Status</th>
                    <th className="pb-3 w-28 text-right">Simulation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {getCoursesForYear(activeYear)
                    .filter((c) => c.term.includes("1st Sem"))
                    .map((course) => (
                      <tr key={course.code} className="group hover:bg-stone-50/50 transition-colors">
                        <td className="py-4 font-mono text-[11px] font-bold text-stone-900">{course.code}</td>
                        <td className="py-4 text-xs font-semibold text-stone-800">{course.name}</td>
                        <td className="py-4 text-xs font-bold text-stone-900">{course.units.toFixed(1)} Units</td>
                        <td className="py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border capitalize ${
                            course.category === "core" 
                              ? "bg-indigo-50 text-indigo-700 border-indigo-100" 
                              : course.category === "gen_ed"
                              ? "bg-teal-50 text-teal-700 border-teal-100"
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          }`}>
                            {course.category.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-4 font-mono text-xs font-bold text-stone-850">
                          {course.grade || "--"}
                        </td>
                        <td className="py-4">{getStatusBadge(course.status)}</td>
                        <td className="py-4 text-right">
                          {course.status === "remaining" || (course.status === "completed" && course.grade === "1.50" && !initialCurriculum.find(ic => ic.code === course.code)?.grade) ? (
                            <button
                              onClick={() => toggleCourseStatus(course.code)}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all ${
                                course.status === "remaining"
                                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                  : "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100"
                              }`}
                            >
                              {course.status === "remaining" ? "Complete" : "Reset"}
                            </button>
                          ) : (
                            <span className="text-[10px] font-semibold text-stone-400">Locked</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2nd Semester Section */}
          <div className="p-6 bg-stone-50/20">
            <h3 className="text-xs font-black text-stone-900 uppercase tracking-widest bg-stone-100 py-1.5 px-3 rounded-lg inline-block">
              Second Semester Modules
            </h3>
            
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    <th className="pb-3 w-28">Course Code</th>
                    <th className="pb-3">Course Title</th>
                    <th className="pb-3 w-24">Credits</th>
                    <th className="pb-3 w-24">Category</th>
                    <th className="pb-3 w-24">Grade</th>
                    <th className="pb-3 w-32">Status</th>
                    <th className="pb-3 w-28 text-right">Simulation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {getCoursesForYear(activeYear)
                    .filter((c) => c.term.includes("2nd Sem"))
                    .map((course) => (
                      <tr key={course.code} className="group hover:bg-stone-50/50 transition-colors">
                        <td className="py-4 font-mono text-[11px] font-bold text-stone-900">{course.code}</td>
                        <td className="py-4 text-xs font-semibold text-stone-800">{course.name}</td>
                        <td className="py-4 text-xs font-bold text-stone-900">{course.units.toFixed(1)} Units</td>
                        <td className="py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border capitalize ${
                            course.category === "core" 
                              ? "bg-indigo-50 text-indigo-700 border-indigo-100" 
                              : course.category === "gen_ed"
                              ? "bg-teal-50 text-teal-700 border-teal-100"
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          }`}>
                            {course.category.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-4 font-mono text-xs font-bold text-stone-850">
                          {course.grade || "--"}
                        </td>
                        <td className="py-4">{getStatusBadge(course.status)}</td>
                        <td className="py-4 text-right">
                          {course.status === "remaining" || (course.status === "completed" && course.grade === "1.50" && !initialCurriculum.find(ic => ic.code === course.code)?.grade) ? (
                            <button
                              onClick={() => toggleCourseStatus(course.code)}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all ${
                                course.status === "remaining"
                                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                  : "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100"
                              }`}
                            >
                              {course.status === "remaining" ? "Complete" : "Reset"}
                            </button>
                          ) : (
                            <span className="text-[10px] font-semibold text-stone-400">Locked</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

        </CardContent>
      </Card>

    </div>
  );
}
export default CreditChecklistView;
