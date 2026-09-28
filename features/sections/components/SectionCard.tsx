"use client";

import React from "react";
import { Edit2, Trash2, Users, Layers } from "lucide-react";
import { Section } from "@/lib/types/section-term.types";

interface SectionCardProps {
  section: Section;
  advisorName?: string;
  isAdmin?: boolean;
  onEdit?: (section: Section) => void;
  onDelete?: (section: Section) => void;
}

export function SectionCard({
  section,
  advisorName,
  isAdmin,
  onEdit,
  onDelete,
}: SectionCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 p-5">
      {/* Header with name and actions */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <h3 className="font-bold text-lg text-primary">{section.name}</h3>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider bg-surface-alt px-2 py-1 rounded">
            Year {section.yearLevel}
          </span>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit?.(section)}
              className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary hover:text-primary transition-colors flex items-center justify-center"
              title="Edit section"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete?.(section)}
              className="h-8 w-8 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors flex items-center justify-center"
              title="Delete section"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Student count */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
        <Users className="h-4 w-4 text-text-muted" />
        <span className="text-sm text-text-muted">
          <span className="font-semibold text-text">{section.studentCount}</span>{" "}
          students enrolled
        </span>
      </div>

      {/* Unit targets */}
      {section.targets && (
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
          <Layers className="h-4 w-4 text-text-muted" />
          <span className="text-sm text-text-muted">
            Units:{" "}
            <span className="font-semibold text-text">
              {section.targets.minUnits}-{section.targets.maxUnits}
            </span>
          </span>
        </div>
      )}

      {/* Advisor info */}
      {advisorName ? (
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>Advisor:</span>
          <span className="font-medium text-text">
            {advisorName}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-text-muted italic">
          <span>No advisor assigned</span>
        </div>
      )}
    </div>
  );
}
