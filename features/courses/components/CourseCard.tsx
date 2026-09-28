"use client";

import React from "react";
import { Course } from "@/lib/types/course.types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Book, Clock, Layers, Pencil, Trash2 } from "lucide-react";

interface CourseCardProps {
  course: Course;
  isAdmin?: boolean;
  onEdit?: (course: Course) => void;
  onDelete?: (courseId: string) => void;
}

const categoryColors = {
  major: "bg-primary/10 text-primary border-primary/20",
  minor: "bg-indigo-50 text-indigo-700 border-indigo-200",
  general: "bg-emerald-50 text-emerald-700 border-emerald-200",
  elective: "bg-amber-50 text-amber-700 border-amber-200",
};

export function CourseCard({ course, isAdmin, onEdit, onDelete }: CourseCardProps) {
  return (
    <Card className="group h-full flex flex-col hover:shadow-lg transition-all duration-300 border-border/50 bg-white/80 backdrop-blur-sm relative">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={categoryColors[course.category]}>
              {course.category}
            </Badge>
            {isAdmin && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => onEdit?.(course)}
                  className="p-1.5 rounded-lg bg-white border border-border hover:border-primary hover:text-primary transition-all text-text-muted"
                  title="Edit Course"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => onDelete?.(course.id)}
                  className="p-1.5 rounded-lg bg-white border border-border hover:border-danger hover:text-danger transition-all text-text-muted"
                  title="Delete Course"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
          <span className="text-[10px] font-bold text-text-muted tracking-widest uppercase">
            {course.code}
          </span>
        </div>
        <CardTitle className="text-lg font-bold text-text group-hover:text-primary transition-colors leading-tight">
          {course.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <p className="text-xs text-text-muted line-clamp-2">
          {course.description}
        </p>
        
        <div className="mt-auto pt-4 border-t border-border/50 grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-surface-alt/50">
            <Book className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-bold text-text">{course.units} U</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-surface-alt/50">
            <Clock className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-bold text-text">{course.lectureHours}L</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-surface-alt/50">
            <Layers className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-bold text-text">{course.labHours}B</span>
          </div>
        </div>
        
        <div className="text-[10px] text-text-muted italic flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
          {course.department}
        </div>
      </CardContent>
    </Card>
  );
}
