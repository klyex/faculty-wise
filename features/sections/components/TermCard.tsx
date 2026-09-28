"use client";

import React from "react";
import { Calendar, Trash2, Edit2 } from "lucide-react";
import { Term } from "@/lib/types/section-term.types";

interface TermCardProps {
  term: Term;
  isAdmin?: boolean;
  onEdit?: (term: Term) => void;
  onDelete?: (term: Term) => void;
}

export function TermCard({ term, isAdmin, onEdit, onDelete }: TermCardProps) {
  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-lg">
            {term.semester}
          </span>
          <h3 className="font-semibold text-text">{term.academicYear}</h3>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit?.(term)}
              className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary hover:text-primary transition-colors flex items-center justify-center"
              title="Edit term"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete?.(term)}
              className="h-8 w-8 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors flex items-center justify-center"
              title="Delete term"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {formatDate(term.startDate)} to {formatDate(term.endDate)}
          </span>
        </div>
      </div>

      {/* Status badge */}
      {term.isCurrent && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          <span className="text-xs font-semibold text-emerald-700">
            Current Term
          </span>
        </div>
      )}
    </div>
  );
}
