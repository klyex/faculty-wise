"use client";

import React, { useState, useEffect } from "react";
import { X, BookOpen, Users, Layers } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Section } from "@/lib/types/section-term.types";
import { User } from "@/lib/types/firestore.types";
import { sectionsService, termsService } from "../sections.service";

interface AddEditSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  programId: string;
  sectionToEdit?: Section;
  onSuccess?: () => void;
}

export function AddEditSectionModal({
  isOpen,
  onClose,
  programId,
  sectionToEdit,
  onSuccess,
}: AddEditSectionModalProps) {
  const [name, setName] = useState("");
  const [yearLevel, setYearLevel] = useState(1);
  const [studentCount, setStudentCount] = useState(0);
  const [advisorUid, setAdvisorUid] = useState("");
  const [minUnits, setMinUnits] = useState(12);
  const [maxUnits, setMaxUnits] = useState(18);

  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Load teachers
    const loadTeachers = async () => {
      setLoadingTeachers(true);
      try {
        const teachersData = await termsService.getTeachers();
        setTeachers(teachersData);
      } catch (err) {
        console.error("Error loading teachers:", err);
        setError("Failed to load teacher list");
      } finally {
        setLoadingTeachers(false);
      }
    };

    loadTeachers();

    // Pre-fill form if editing
    if (sectionToEdit) {
      setName(sectionToEdit.name);
      setYearLevel(sectionToEdit.yearLevel);
      setStudentCount(sectionToEdit.studentCount);
      setAdvisorUid(sectionToEdit.advisorUid || "");
      if (sectionToEdit.targets) {
        setMinUnits(sectionToEdit.targets.minUnits || 12);
        setMaxUnits(sectionToEdit.targets.maxUnits || 18);
      }
    } else {
      setName("");
      setYearLevel(1);
      setStudentCount(0);
      setAdvisorUid("");
      setMinUnits(12);
      setMaxUnits(18);
    }
  }, [isOpen, sectionToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Section name is required");
      return;
    }

    if (studentCount < 0) {
      setError("Student count cannot be negative");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = {
        name,
        yearLevel,
        studentCount,
        advisorUid: advisorUid || null,
        programId,
        targets: { minUnits, maxUnits },
      };

      if (sectionToEdit) {
        await sectionsService.updateSection(sectionToEdit.id, data);
      } else {
        await sectionsService.createSection(data);
      }

      setName("");
      setYearLevel(1);
      setStudentCount(0);
      setAdvisorUid("");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error saving section:", err);
      setError(err instanceof Error ? err.message : "Failed to save section");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md border-border/50 shadow-2xl bg-white/95 backdrop-blur-sm max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/50 flex items-center justify-between sticky top-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            {sectionToEdit ? "Edit Section" : "Add New Section"}
          </CardTitle>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-surface transition-colors flex items-center justify-center"
          >
            <X className="h-4 w-4 text-text-muted" />
          </button>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                Section Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., BSCS-3A"
                className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted">
                  Year Level
                </label>
                <select
                  value={yearLevel}
                  onChange={(e) => setYearLevel(Number(e.target.value))}
                  className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none cursor-pointer"
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                  <option value={5}>5th Year</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Student Count
                </label>
                <input
                  type="number"
                  value={studentCount}
                  onChange={(e) => setStudentCount(Number(e.target.value))}
                  min="0"
                  max="200"
                  className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                Section Advisor (Optional)
              </label>
              <select
                value={advisorUid}
                onChange={(e) => setAdvisorUid(e.target.value)}
                disabled={loadingTeachers}
                className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingTeachers ? "Loading teachers..." : "-- Select a teacher --"}
                </option>
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
              {loadingTeachers && (
                <p className="text-xs text-text-muted">Loading available teachers...</p>
              )}
            </div>

            <div className="pt-3 border-t border-border/50 space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Unit Targets
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-text-muted">Minimum</label>
                  <input
                    type="number"
                    value={minUnits}
                    onChange={(e) => setMinUnits(Number(e.target.value))}
                    min="0"
                    max="30"
                    className="w-full h-9 px-2 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-muted">Maximum</label>
                  <input
                    type="number"
                    value={maxUnits}
                    onChange={(e) => setMaxUnits(Number(e.target.value))}
                    min="0"
                    max="30"
                    className="w-full h-9 px-2 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-border/50">
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
                className="flex-1 rounded-lg h-10"
                disabled={loading}
              >
                {loading ? "Saving..." : sectionToEdit ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
