"use client";

import React, { useState, useEffect } from "react";
import { X, BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Course, CourseCategory } from "@/lib/types/course.types";
import { coursesService } from "../courses.service";
import { useAuth } from "@/lib/context/AuthContext";
import { getDb } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
interface AddEditCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseToEdit?: Course | null;
}

export function AddEditCourseModal({ isOpen, onClose, courseToEdit }: AddEditCourseModalProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [units, setUnits] = useState(3);
  const [lectureHours, setLectureHours] = useState(3);
  const [labHours, setLabHours] = useState(0);
  const [category, setCategory] = useState<CourseCategory>("major");
  const [departmentId, setDepartmentId] = useState("");
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { profile } = useAuth();

  useEffect(() => {
    const db = getDb();
    if (!db) return;
    const deptRef = collection(db, "departments");
    const unsubscribe = onSnapshot(deptRef, (snapshot) => {
      const depts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDepartments(depts);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (courseToEdit) {
      setCode(courseToEdit.code);
      setName(courseToEdit.name);
      setDescription(courseToEdit.description);
      setUnits(courseToEdit.units);
      setLectureHours(courseToEdit.lectureHours);
      setLabHours(courseToEdit.labHours);
      setCategory(courseToEdit.category);
      setDepartmentId(courseToEdit.departmentId || "");
    } else {
      setCode("");
      setName("");
      setDescription("");
      setUnits(3);
      setLectureHours(3);
      setLabHours(0);
      setCategory("major");
      setDepartmentId("");
    }
  }, [courseToEdit, isOpen]);

  // Try to pre-select the first department if none is selected
  useEffect(() => {
    if (departments.length > 0 && !departmentId) {
      setDepartmentId(departments[0].id);
    }
  }, [departments, departmentId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!code.trim()) {
      setError("Course Code is required.");
      setLoading(false);
      return;
    }

    if (!name.trim()) {
      setError("Course Name is required.");
      setLoading(false);
      return;
    }

    if (!departmentId) {
      setError("Please assign a Department.");
      setLoading(false);
      return;
    }

    try {
      const selectedDept = departments.find(d => d.id === departmentId);
      const deptName = selectedDept ? selectedDept.name : "";

      if (courseToEdit) {
        await coursesService.updateCourse(
          courseToEdit.id,
          {
            code: code.trim().toUpperCase(),
            name: name.trim(),
            description: description.trim(),
            units: Number(units),
            lectureHours: Number(lectureHours),
            labHours: Number(labHours),
            category,
            departmentId,
            department: deptName,
          },
          profile || undefined
        );
      } else {
        await coursesService.createCourse({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim(),
          units: Number(units),
          lectureHours: Number(lectureHours),
          labHours: Number(labHours),
          category,
          departmentId,
          department: deptName,
        },
        profile || undefined
      );
    }
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save course.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-surface rounded-[2rem] border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="relative p-8">
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 p-2 rounded-full hover:bg-surface-alt transition-colors"
          >
            <X className="h-5 w-5 text-text-muted" />
          </button>

          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-text font-source-serif">
                {courseToEdit ? "Edit Course Catalog" : "Add New Course"}
              </h2>
              <p className="text-text-muted text-sm">Define dynamic curriculum courses and requirements.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2 col-span-1">
                <label className="text-sm font-medium text-text-muted px-1">Code</label>
                <input
                  type="text"
                  required
                  placeholder="CS205"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-12 px-4 bg-surface-alt border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text uppercase"
                />
              </div>

              <div className="space-y-2 col-span-1 sm:col-span-2">
                <label className="text-sm font-medium text-text-muted px-1">Course Name</label>
                <input
                  type="text"
                  required
                  placeholder="Data Structures"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 px-4 bg-surface-alt border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted px-1">Course Description</label>
              <textarea
                rows={2}
                placeholder="Brief course curriculum description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 bg-surface-alt border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted px-1">Total Units</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={units}
                  onChange={(e) => setUnits(Number(e.target.value))}
                  className="w-full h-12 px-4 bg-surface-alt border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted px-1">Lecture Hours</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={lectureHours}
                  onChange={(e) => setLectureHours(Number(e.target.value))}
                  className="w-full h-12 px-4 bg-surface-alt border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted px-1">Lab Hours</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={labHours}
                  onChange={(e) => setLabHours(Number(e.target.value))}
                  className="w-full h-12 px-4 bg-surface-alt border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted px-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CourseCategory)}
                  className="w-full h-12 px-4 bg-surface-alt border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text appearance-none cursor-pointer"
                >
                  <option value="major">Major Course</option>
                  <option value="minor">Minor Course</option>
                  <option value="general">General Education</option>
                  <option value="elective">Elective</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted px-1">Department</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full h-12 px-4 bg-surface-alt border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text appearance-none cursor-pointer"
                >
                  <option value="">-- Select department --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.code} - {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button 
                type="button" 
                variant="secondary" 
                className="flex-1 rounded-xl h-12"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 rounded-xl h-12"
                disabled={loading}
              >
                {loading ? "Saving..." : courseToEdit ? "Update Course" : "Add Course"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
