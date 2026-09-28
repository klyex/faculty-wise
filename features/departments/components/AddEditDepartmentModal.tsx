"use client";

import React, { useState, useEffect } from "react";
import { X, Code, BookOpen, Users, GraduationCap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Department } from "@/lib/types/department.types";
import { User } from "@/lib/types/firestore.types";
import { departmentsService } from "../departments.service";

const INSTITUTES = [
  "Institute of Computing",
  "Institute of Engineering and Architecture",
  "Institute of Arts and Sciences",
  "Institute of Business and Accountancy",
  "Institute of Education"
];

interface AddEditDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentToEdit?: Department;
  onSuccess?: () => void;
}

export function AddEditDepartmentModal({
  isOpen,
  onClose,
  departmentToEdit,
  onSuccess,
}: AddEditDepartmentModalProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [institute, setInstitute] = useState("");
  const [chairUid, setChairUid] = useState("");

  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Load teachers
    const loadTeachers = async () => {
      try {
        const teachersData = await departmentsService.getTeachers();
        setTeachers(teachersData);
      } catch (err) {
        console.error("Error loading teachers:", err);
      }
    };

    loadTeachers();

    // Pre-fill form if editing
    if (departmentToEdit) {
      setCode(departmentToEdit.code);
      setName(departmentToEdit.name);
      setInstitute(departmentToEdit.institute || "");
      setChairUid(departmentToEdit.chairUid || "");
    } else {
      setCode("");
      setName("");
      setInstitute("");
      setChairUid("");
    }
  }, [isOpen, departmentToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || !name.trim()) {
      setError("Department code and name are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (departmentToEdit) {
        // Update existing department
        await departmentsService.updateDepartment(departmentToEdit.id, {
          code,
          name,
          institute: institute || undefined,
          chairUid: chairUid || null,
        });
      } else {
        // Create new department
        await departmentsService.createDepartment({
          code,
          name,
          institute: institute || undefined,
          chairUid: chairUid || null,
        });
      }

      setCode("");
      setName("");
      setInstitute("");
      setChairUid("");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error saving department:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save department"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md border-border/50 shadow-2xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/50 flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {departmentToEdit ? "Edit Department" : "Add New Department"}
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
                <Code className="h-3.5 w-3.5" />
                Department Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g., CS, MATH, ENG"
                className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                Department Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Computer Science Department"
                className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" />
                Institute
              </label>
              <select
                value={institute}
                onChange={(e) => setInstitute(e.target.value)}
                className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="">-- Select an Institute --</option>
                {INSTITUTES.map((inst) => (
                  <option key={inst} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                Department Chair (Optional)
              </label>
              <select
                value={chairUid}
                onChange={(e) => setChairUid(e.target.value)}
                className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="">-- Select a teacher --</option>
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
                {loading
                  ? "Saving..."
                  : departmentToEdit
                    ? "Update"
                    : "Create"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
