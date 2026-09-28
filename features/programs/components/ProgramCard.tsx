"use client";

import React from "react";
import { Edit2, Trash2, BookOpen } from "lucide-react";
import { Program } from "@/lib/types/department-schedule.types";

interface ProgramCardProps {
  program: Program;
  departmentName?: string;
  isAdmin?: boolean;
  onEdit?: (program: Program) => void;
  onDelete?: (program: Program) => void;
}

export function ProgramCard({
  program,
  departmentName,
  isAdmin,
  onEdit,
  onDelete,
}: ProgramCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 p-5">
      {/* Header with code and actions */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-lg">
            {program.code}
          </span>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit?.(program)}
              className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary hover:text-primary transition-colors flex items-center justify-center"
              title="Edit program"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete?.(program)}
              className="h-8 w-8 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors flex items-center justify-center"
              title="Delete program"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="font-semibold text-text mb-4 leading-snug line-clamp-2">
        {program.name}
      </h3>

      {/* Department info */}
      {departmentName ? (
        <div className="flex items-center gap-2 pt-3 border-t border-border/50">
          <BookOpen className="h-3.5 w-3.5 text-text-muted" />
          <span className="text-xs text-text-muted">
            Department:{" "}
            <span className="font-medium text-text">
              {departmentName}
            </span>
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 pt-3 border-t border-border/50">
          <BookOpen className="h-3.5 w-3.5 text-text-muted" />
          <span className="text-xs text-text-muted italic">
            Department not found
          </span>
        </div>
      )}
    </div>
  );
}
