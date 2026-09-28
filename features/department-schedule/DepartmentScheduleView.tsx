"use client";

import React, { useState, useEffect } from "react";
import { TimetableGrid } from "@/features/timetables/components/TimetableGrid";
import { DepartmentSelector } from "./components/DepartmentSelector";
import { TimetableEntry } from "@/lib/types/timetable.types";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Calendar } from "lucide-react";
import { useSystemInfo } from "@/lib/context/SystemContext";
import { Department, Program, Section } from "@/lib/types/department-schedule.types";
import { departmentsService } from "@/features/departments/departments.service";
import { programsService } from "@/features/programs/programs.service";
import { sectionsService } from "@/features/sections/sections.service";

export function DepartmentScheduleView() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { currentTerm, academicYear } = useSystemInfo();

  // Subscribe to real-time updates
  useEffect(() => {
    // Subscribe to departments
    const unsubscribeDepts = departmentsService.subscribeDepartments((data) => {
      setDepartments(data);
      if (data.length > 0 && !selectedDepartmentId) {
        setSelectedDepartmentId(data[0].id);
      }
    });

    // Subscribe to all programs
    const unsubscribePrograms = programsService.subscribePrograms((data) => {
      setPrograms(data);
      if (data.length > 0 && !selectedProgramId) {
        setSelectedProgramId(data[0].id);
      }
    });

    // Subscribe to sections
    const unsubscribeSections = sectionsService.subscribeAll((data) => {
      setSections(data);
      if (data.length > 0 && !selectedSectionId) {
        setSelectedSectionId(data[0].id);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeDepts();
      unsubscribePrograms();
      unsubscribeSections();
    };
  }, []);

  // Mock schedules - replace with real schedule queries when available
  const SCHEDULES: TimetableEntry[] = [
    {
      id: "1",
      courseCode: "CS101",
      courseName: "Introduction to Computer Science",
      teacherName: "Dr. Smith",
      room: "RM-201",
      day: "Monday",
      startTime: "09:00",
      endTime: "10:30",
      type: "lecture",
    },
    {
      id: "2",
      courseCode: "MATH202",
      courseName: "Calculus II",
      teacherName: "Prof. Johnson",
      room: "LAB-102",
      day: "Monday",
      startTime: "11:00",
      endTime: "13:00",
      type: "lab",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-surface-alt rounded-xl" />
        <div className="h-[400px] bg-surface-alt rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif">Department Schedule</h1>
          <p className="text-text-muted mt-1">Browse published timetables across all academic departments and sections.</p>
        </div>
        <div className="flex items-center gap-2">
          {currentTerm && (
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 flex items-center gap-1.5 py-1 px-3">
              <Calendar className="h-3 w-3" />
              AY {currentTerm.academicYear || academicYear}
            </Badge>
          )}
        </div>
      </div>

      <DepartmentSelector 
        departments={departments} 
        programs={programs} 
        sections={sections}
        selectedDepartmentId={selectedDepartmentId}
        selectedProgramId={selectedProgramId}
        selectedSectionId={selectedSectionId}
        onDepartmentChange={setSelectedDepartmentId}
        onProgramChange={setSelectedProgramId}
        onSectionChange={setSelectedSectionId}
      />

      <Card className="border-none shadow-md overflow-hidden bg-white/40 backdrop-blur-md">
        <CardContent className="p-0">
          <TimetableGrid entries={SCHEDULES} />
        </CardContent>
      </Card>
      
      <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-100/50 flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-bold text-amber-900">Schedule Notice</h4>
          <p className="text-sm text-amber-800/80 leading-relaxed mt-1">
            The schedules displayed here are published and finalized. For any concerns regarding room assignments or time conflicts, please contact your respective Department Head.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DepartmentScheduleView;
