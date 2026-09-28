"use client";

import React, { useState, useEffect } from "react";
import { Course } from "@/lib/types/course.types";
import { Program } from "@/lib/types/department-schedule.types";
import { Section } from "@/lib/types/section-term.types";
import { CourseOfferingWithCourse } from "@/lib/types/offering.types";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { programsService } from "@/features/programs/programs.service";
import { sectionsService } from "@/features/sections/sections.service";
import { X, Search, BookOpen, Layers, Award, AlertCircle } from "lucide-react";

interface AddOfferingModalProps {
  termId: string;
  allCourses: Course[]; // Subjects
  existingOfferings: CourseOfferingWithCourse[];
  onAdd: (
    courseId: string,
    assignedUnits: number,
    sectionId: string,
    programId: string,
    notes?: string
  ) => void;
  onClose: () => void;
}

export function AddOfferingModal({
  termId,
  allCourses,
  existingOfferings,
  onAdd,
  onClose,
}: AddOfferingModalProps) {
  // State for selections
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<Course | null>(null);
  
  const [assignedUnits, setAssignedUnits] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Subscribe to programs (Courses/Degrees)
  useEffect(() => {
    const unsubscribe = programsService.subscribePrograms(setPrograms);
    return unsubscribe;
  }, []);

  // Subscribe to sections for selected program
  useEffect(() => {
    if (!selectedProgramId) {
      setSections([]);
      setSelectedSectionId("");
      return;
    }
    const unsubscribe = sectionsService.subscribeByProgram(selectedProgramId, setSections);
    return unsubscribe;
  }, [selectedProgramId]);

  // Set default units when subject is selected
  useEffect(() => {
    if (selectedSubject) {
      setAssignedUnits(selectedSubject.units);
    } else {
      setAssignedUnits("");
    }
    setErrorMsg(null);
  }, [selectedSubject]);

  // Check unique validation when subject or section changes
  useEffect(() => {
    if (selectedSubject && selectedSectionId) {
      const isDuplicate = existingOfferings.some(
        (o) => o.courseId === selectedSubject.id && o.sectionId === selectedSectionId
      );
      if (isDuplicate) {
        setErrorMsg("This subject is already offered for the selected section/set in this term.");
      } else {
        setErrorMsg(null);
      }
    } else {
      setErrorMsg(null);
    }
  }, [selectedSubject, selectedSectionId, existingOfferings]);

  // Filter available subjects based on search
  const filteredSubjects = allCourses.filter(
    (c) =>
      c.code.toLowerCase().includes(subjectSearch.toLowerCase()) ||
      c.name.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  const handleAdd = () => {
    if (!selectedSubject || !selectedSectionId || !selectedProgramId || !assignedUnits || assignedUnits <= 0 || errorMsg) {
      return;
    }
    
    onAdd(
      selectedSubject.id,
      Number(assignedUnits),
      selectedSectionId,
      selectedProgramId,
      notes.trim() || undefined
    );
    
    // Reset states
    setSelectedSubject(null);
    setNotes("");
  };

  const selectedProgram = programs.find((p) => p.id === selectedProgramId);
  const selectedSection = sections.find((s) => s.id === selectedSectionId);

  const isValid =
    selectedProgramId &&
    selectedSectionId &&
    selectedSubject &&
    assignedUnits &&
    assignedUnits > 0 &&
    !errorMsg;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-in zoom-in-95 duration-300">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-border bg-white shadow-2xl rounded-3xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/50 bg-surface-alt/30">
            <div>
              <h2 className="text-2xl font-bold text-text">Create Course Offering</h2>
              <p className="text-xs text-text-muted mt-1">
                Offer subjects for specific sections/sets to initialize the schedule.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-100 rounded-full transition-all text-text-muted hover:text-text"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1: Select Academic Course (Program) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary" />
                1. Select Degree Course (Program)
              </label>
              <select
                value={selectedProgramId}
                onChange={(e) => {
                  setSelectedProgramId(e.target.value);
                  setSelectedSectionId("");
                }}
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text font-medium"
              >
                <option value="">-- Choose a Degree Program --</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* STEP 2: Select Section / Set */}
            {selectedProgramId && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-primary" />
                  2. Select Section / Set
                </label>
                {sections.length > 0 ? (
                  <select
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text font-medium"
                  >
                    <option value="">-- Select a Section/Set --</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.studentCount} Students)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-4 border border-dashed border-border rounded-2xl text-center text-xs text-text-muted">
                    No sections created for {selectedProgram?.code}. Manage sections separately first.
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Select Subject */}
            {selectedSectionId && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-primary" />
                  3. Select Subject
                </label>

                {!selectedSubject ? (
                  <div className="space-y-2">
                    {/* Search Field */}
                    <div className="relative">
                      <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
                      <Input
                        type="text"
                        placeholder="Search subject code or name..."
                        value={subjectSearch}
                        onChange={(e) => setSubjectSearch(e.target.value)}
                        className="pl-10 h-11 rounded-xl text-sm"
                      />
                    </div>

                    {/* Subjects Listing */}
                    <div className="max-h-48 overflow-y-auto border border-border/80 rounded-2xl divide-y divide-border/40">
                      {filteredSubjects.length > 0 ? (
                        filteredSubjects.map((subject) => (
                          <button
                            key={subject.id}
                            type="button"
                            onClick={() => setSelectedSubject(subject)}
                            className="w-full text-left px-4 py-3 hover:bg-primary/5 border-b border-border/10 last:border-b-0 transition-all flex items-center justify-between"
                          >
                            <div>
                              <p className="font-semibold text-sm text-text">{subject.code}</p>
                              <p className="text-xs text-text-muted truncate max-w-[340px]">
                                {subject.name}
                              </p>
                            </div>
                            <div className="text-right text-xs shrink-0">
                              <span className="font-bold text-primary">{subject.units} Units</span>
                              <p className="text-[10px] text-text-muted">
                                {subject.lectureHours}L • {subject.labHours}Lab
                              </p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-xs text-text-muted italic">
                          No subjects matching search in prospectus.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between animate-in zoom-in-95 duration-200">
                    <div>
                      <p className="font-bold text-primary">{selectedSubject.code}</p>
                      <p className="text-sm font-semibold text-text">{selectedSubject.name}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {selectedSubject.lectureHours} Lecture Hours • {selectedSubject.labHours} Lab Hours
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedSubject(null)}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-border hover:bg-stone-50 rounded-xl transition-all shadow-sm shrink-0"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: Review Units & Notes */}
            {selectedSubject && selectedSectionId && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200 border-t border-border/30 pt-4">
                {/* Units Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text uppercase tracking-wider">
                    Units (Def: {selectedSubject.units})
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max={selectedSubject.units}
                    value={assignedUnits}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAssignedUnits(val === "" ? "" : Math.min(Number(val), selectedSubject.units));
                    }}
                    placeholder="Enter units"
                    className="h-11 rounded-xl"
                  />
                </div>

                {/* Notes Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text uppercase tracking-wider">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add special requests or section details for scheduling..."
                    rows={2.5}
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text resize-none bg-surface"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-border/50 bg-surface-alt/30 flex items-center justify-end gap-3 shrink-0">
            <button
              onClick={onClose}
              type="button"
              className="px-5 py-2.5 border border-border rounded-xl hover:bg-stone-50 transition-all text-sm font-semibold text-text"
            >
              Cancel
            </button>
            <Button
              onClick={handleAdd}
              disabled={!isValid}
              className="px-6 py-2.5 bg-primary hover:bg-primary-strong disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl"
            >
              Add Offering
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
