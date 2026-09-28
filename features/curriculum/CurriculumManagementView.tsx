"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BookOpen, Plus, AlertTriangle, X, Layers, Calendar, Hash, Star } from "lucide-react";
import { Curriculum, CurriculumCourse } from "@/lib/types/curriculum.types";
import { Course } from "@/lib/types/firestore.types";
import { curriculumService } from "./curriculum.service";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

const SEMESTERS = ["1st", "2nd", "Summer"] as const;

function subscribeCourses(onUpdate: (courses: Course[]) => void): () => void {
  const db = getDb();
  const ref = collection(db, "courses");
  const q = query(ref, orderBy("name", "asc"));
  return onSnapshot(q, (snapshot) => {
    const courses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Course[];
    onUpdate(courses);
  });
}

const semesterLabels: Record<string, string> = {
  "1st": "1st Sem",
  "2nd": "2nd Sem",
  Summer: "Summer",
};

export function CurriculumManagementView() {
  const { profile } = useAuth();
  const toast = useToast();

  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(true);

  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [curriculumToEdit, setCurriculumToEdit] = useState<Curriculum | undefined>();

  const [formName, setFormName] = useState("");
  const [formProgramId, setFormProgramId] = useState("");
  const [formAcademicYear, setFormAcademicYear] = useState("");
  const [formTotalYears, setFormTotalYears] = useState(4);
  const [formAssignments, setFormAssignments] = useState<CurriculumCourse[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const unsub = curriculumService.subscribeAll((data) => {
      setCurricula(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    setCoursesLoading(true);
    const unsub = subscribeCourses((data) => {
      setCourses(data);
      setCoursesLoading(false);
    });
    return unsub;
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) return;
    if (curriculumToEdit) {
      setFormName(curriculumToEdit.name);
      setFormProgramId(curriculumToEdit.programId);
      setFormAcademicYear(curriculumToEdit.academicYear);
      setFormTotalYears(curriculumToEdit.totalYears);
      setFormAssignments([...curriculumToEdit.courses]);
    } else {
      setFormName("");
      setFormProgramId("");
      setFormAcademicYear("");
      setFormTotalYears(4);
      setFormAssignments([]);
    }
    setFormError(null);
  }, [isModalOpen, curriculumToEdit]);

  useEffect(() => {
    setFormAssignments((prev) =>
      prev.filter((a) => a.yearLevel <= formTotalYears)
    );
  }, [formTotalYears]);

  const toggleCourse = useCallback(
    (yearLevel: number, semester: string, courseId: string) => {
      setFormAssignments((prev) => {
        const idx = prev.findIndex(
          (a) => a.yearLevel === yearLevel && a.semester === semester && a.courseId === courseId
        );
        if (idx >= 0) {
          const next = [...prev];
          next.splice(idx, 1);
          return next;
        }
        return [...prev, { courseId, yearLevel, semester: semester as CurriculumCourse["semester"], isCore: false }];
      });
    },
    []
  );

  const toggleCore = useCallback(
    (yearLevel: number, semester: string, courseId: string) => {
      setFormAssignments((prev) =>
        prev.map((a) =>
          a.yearLevel === yearLevel && a.semester === semester && a.courseId === courseId
            ? { ...a, isCore: !a.isCore }
            : a
        )
      );
    },
    []
  );

  const handleAdd = () => {
    setCurriculumToEdit(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (curriculum: Curriculum) => {
    setCurriculumToEdit(curriculum);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setCurriculumToEdit(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formProgramId.trim() || !formAcademicYear.trim()) {
      setFormError("Name, Program ID, and Academic Year are required.");
      return;
    }
    if (formTotalYears < 1) {
      setFormError("Total years must be at least 1.");
      return;
    }

    setFormSaving(true);
    setFormError(null);

    try {
      const data = {
        name: formName.trim(),
        programId: formProgramId.trim(),
        academicYear: formAcademicYear.trim(),
        totalYears: formTotalYears,
        courses: formAssignments,
      };

      if (curriculumToEdit) {
        await curriculumService.update(curriculumToEdit.id, data, profile || undefined);
        toast.success("Updated", "Curriculum updated successfully.");
      } else {
        await curriculumService.create(data, profile || undefined);
        toast.success("Created", "Curriculum created successfully.");
      }
      handleClose();
    } catch (err) {
      console.error("Error saving curriculum:", err);
      setFormError(err instanceof Error ? err.message : "Failed to save curriculum.");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteClick = async (id: string) => {
    setDeleting(true);
    try {
      await curriculumService.remove(id, profile || undefined);
      setDeleteConfirmId(null);
      toast.success("Deleted", "Curriculum deleted successfully.");
    } catch (err) {
      console.error("Error deleting curriculum:", err);
      toast.error("Deletion Failed", "Failed to delete curriculum.");
    } finally {
      setDeleting(false);
    }
  };

  const yearLevels = Array.from({ length: formTotalYears }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <Card className="border-border/50 shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-surface-alt/30 border-b border-border/50 flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Curriculum Management
          </CardTitle>
          <Button onClick={handleAdd} className="h-9 gap-2">
            <Plus className="h-4 w-4" />
            Add Curriculum
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-surface-alt/50 animate-pulse" />
              ))}
            </div>
          ) : curricula.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl bg-surface/50">
              <BookOpen className="h-12 w-12 text-text-muted/30 mx-auto mb-3" />
              <p className="text-text-muted mb-4">No curricula created yet</p>
              <Button onClick={handleAdd} variant="secondary">
                Create First Curriculum
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 font-semibold text-text-muted text-xs uppercase tracking-wider">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-text-muted text-xs uppercase tracking-wider">Program</th>
                    <th className="text-left py-3 px-4 font-semibold text-text-muted text-xs uppercase tracking-wider">Academic Year</th>
                    <th className="text-center py-3 px-4 font-semibold text-text-muted text-xs uppercase tracking-wider">Years</th>
                    <th className="text-center py-3 px-4 font-semibold text-text-muted text-xs uppercase tracking-wider">Courses</th>
                    <th className="text-right py-3 px-4 font-semibold text-text-muted text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {curricula.map((curriculum) => (
                    <tr key={curriculum.id} className="border-b border-border/30 hover:bg-surface-alt/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{curriculum.name}</td>
                      <td className="py-3 px-4 text-text-muted">{curriculum.programId}</td>
                      <td className="py-3 px-4 text-text-muted">{curriculum.academicYear}</td>
                      <td className="py-3 px-4 text-center">{curriculum.totalYears}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center h-6 min-w-[2rem] px-2 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                          {curriculum.courses?.length ?? 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(curriculum)}>Edit</Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteConfirmId(curriculum.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto animate-in fade-in duration-200">
          <Card className="w-full max-w-5xl border-border/50 shadow-2xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/50 flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                {curriculumToEdit ? "Edit Curriculum" : "Add New Curriculum"}
              </CardTitle>
              <button
                onClick={handleClose}
                className="h-8 w-8 rounded-lg hover:bg-surface transition-colors flex items-center justify-center"
              >
                <X className="h-4 w-4 text-text-muted" />
              </button>
            </CardHeader>

            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {formError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      Curriculum Name
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g., BSCS Curriculum 2024-2028"
                      className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                      <Hash className="h-3.5 w-3.5" />
                      Program ID
                    </label>
                    <input
                      type="text"
                      value={formProgramId}
                      onChange={(e) => setFormProgramId(e.target.value)}
                      placeholder="e.g., BSCS, BSIT, BSA"
                      className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Academic Year
                    </label>
                    <input
                      type="text"
                      value={formAcademicYear}
                      onChange={(e) => setFormAcademicYear(e.target.value)}
                      placeholder="e.g., 2024-2025"
                      className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" />
                      Total Years
                    </label>
                    <input
                      type="number"
                      value={formTotalYears}
                      onChange={(e) => setFormTotalYears(Math.max(1, parseInt(e.target.value) || 1))}
                      min={1}
                      max={8}
                      className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-text flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Course Assignments
                      <span className="text-xs font-normal text-text-muted ml-1">
                        ({formAssignments.length} assigned)
                      </span>
                    </h3>
                    {coursesLoading && (
                      <span className="text-xs text-text-muted animate-pulse">Loading courses...</span>
                    )}
                  </div>

                  {!coursesLoading && courses.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-surface/50 border border-border/30">
                      <p className="text-text-muted text-sm">No courses found in the system.</p>
                      <p className="text-text-muted/60 text-xs mt-1">Add courses first before assigning them to a curriculum.</p>
                    </div>
                  ) : coursesLoading ? (
                    <div className="h-32 rounded-xl bg-surface-alt/30 animate-pulse" />
                  ) : (
                    <div className="overflow-x-auto border border-border/30 rounded-xl">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-surface-alt/40 border-b border-border/30">
                            <th className="text-left py-2.5 px-3 font-semibold text-text-muted text-xs uppercase tracking-wider w-16">
                              Year
                            </th>
                            {SEMESTERS.map((sem) => (
                              <th key={sem} className="text-left py-2.5 px-3 font-semibold text-text-muted text-xs uppercase tracking-wider">
                                {semesterLabels[sem]}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {yearLevels.map((year) => (
                            <tr key={year} className="border-b border-border/20 last:border-b-0">
                              <td className="py-2.5 px-3 font-semibold text-text align-top whitespace-nowrap">
                                Year {year}
                              </td>
                              {SEMESTERS.map((sem) => {
                                const cellAssignments = formAssignments.filter(
                                  (a) => a.yearLevel === year && a.semester === sem
                                );
                                return (
                                  <td key={sem} className="py-2.5 px-3 align-top">
                                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                                      {courses.map((course) => {
                                        const assignment = cellAssignments.find(
                                          (a) => a.courseId === course.id
                                        );
                                        const selected = !!assignment;
                                        return (
                                          <div
                                            key={course.id}
                                            className={`flex items-center gap-1.5 py-0.5 px-1.5 rounded-lg transition-colors ${
                                              selected ? "bg-primary/5" : "hover:bg-surface-alt/50"
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              id={`cell-${year}-${sem}-${course.id}`}
                                              checked={selected}
                                              onChange={() => toggleCourse(year, sem, course.id)}
                                              className="w-3.5 h-3.5 cursor-pointer shrink-0"
                                            />
                                            <label
                                              htmlFor={`cell-${year}-${sem}-${course.id}`}
                                              className="text-xs cursor-pointer truncate flex-1 min-w-0"
                                            >
                                              <span className="font-medium">
                                                {course.code || course.id}
                                              </span>
                                              <span className="text-text-muted ml-1 hidden sm:inline">
                                                {course.name}
                                              </span>
                                            </label>
                                            {selected && (
                                              <button
                                                type="button"
                                                onClick={() => toggleCore(year, sem, course.id)}
                                                className={`shrink-0 p-0.5 rounded transition-colors ${
                                                  assignment.isCore
                                                    ? "text-amber-500 hover:text-amber-600"
                                                    : "text-text-muted/40 hover:text-text-muted/70"
                                                }`}
                                                title={assignment.isCore ? "Core course" : "Mark as core"}
                                              >
                                                <Star
                                                  className="h-3 w-3"
                                                  fill={assignment.isCore ? "currentColor" : "none"}
                                                />
                                              </button>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-border/50">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1 rounded-lg h-10"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 rounded-lg h-10"
                    disabled={formSaving}
                  >
                    {formSaving
                      ? "Saving..."
                      : curriculumToEdit
                        ? "Update"
                        : "Create"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-sm w-full border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-semibold text-text">Delete Curriculum?</h4>
                <p className="text-sm text-text-muted">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1 h-9"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 h-9 bg-red-600 hover:bg-red-700"
                disabled={deleting}
                onClick={() => handleDeleteClick(deleteConfirmId)}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CurriculumManagementView;
