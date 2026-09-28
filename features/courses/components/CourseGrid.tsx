"use client";

import React from "react";
import { Course } from "@/lib/types/course.types";
import { CourseCard } from "./CourseCard";

interface CourseGridProps {
  courses: Course[];
  isAdmin?: boolean;
  onEdit?: (course: Course) => void;
  onDelete?: (courseId: string) => void;
}

export function CourseGrid({ courses, isAdmin, onEdit, onDelete }: CourseGridProps) {
  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-surface-alt/20 rounded-2xl border border-dashed border-border">
        <p className="text-text-muted">No courses found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {courses.map((course) => (
        <CourseCard 
          key={course.id} 
          course={course} 
          isAdmin={isAdmin}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
