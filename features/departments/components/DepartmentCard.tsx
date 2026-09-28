"use client";

import React from "react";
import { Edit2, Trash2, Users } from "lucide-react";
import { Department } from "@/lib/types/department.types";

interface DepartmentCardProps {
  department: Department;
  chairName?: string;
  isAdmin?: boolean;
  onEdit?: (dept: Department) => void;
  onDelete?: (dept: Department) => void;
}

export function DepartmentCard({
  department,
  chairName,
  isAdmin,
  onEdit,
  onDelete,
}: DepartmentCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 p-5">
      {/* Header with code and actions */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-lg">
            {department.code}
          </span>
          {department.institute && (
            <span className="text-[10px] font-semibold text-text-muted bg-surface-alt border border-border/60 px-2 py-1 rounded-lg">
              {department.institute}
            </span>
          )}
        </div>

        {isAdmin && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit?.(department)}
              className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary hover:text-primary transition-colors flex items-center justify-center"
              title="Edit department"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete?.(department)}
              className="h-8 w-8 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors flex items-center justify-center"
              title="Delete department"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="font-semibold text-text mb-4 leading-snug line-clamp-2">
        {department.name}
      </h3>

      {/* Chair info */}
      {department.chairUid || chairName ? (
        <div className="flex items-center gap-2 pt-3 border-t border-border/50">
          <Users className="h-3.5 w-3.5 text-text-muted" />
          <span className="text-xs text-text-muted">
            Chair:{" "}
            <span className="font-medium text-text">
              {chairName || "Not assigned"}
            </span>
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 pt-3 border-t border-border/50">
          <Users className="h-3.5 w-3.5 text-text-muted" />
          <span className="text-xs text-text-muted italic">
            No chair assigned
          </span>
        </div>
      )}
    </div>
  );
}
