"use client";

import React, { useState } from "react";
import { AvailabilitySubmissionView } from "./components/AvailabilitySubmissionView";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Calendar, AlertCircle } from "lucide-react";

// Mock terms data - would come from props or context in real app
const AVAILABLE_TERMS = [
  {
    id: "term-2026-s1",
    academicYear: "2025-2026",
    semester: "1st",
    label: "First Semester",
    isOpen: true,
  },
  {
    id: "term-2026-s2",
    academicYear: "2025-2026",
    semester: "2nd",
    label: "Second Semester",
    isOpen: false,
  },
  {
    id: "term-2026-summer",
    academicYear: "2025-2026",
    semester: "Summer",
    label: "Summer Session",
    isOpen: false,
  },
];

export default function AvailabilityView() {
  const [selectedTermId, setSelectedTermId] = useState(AVAILABLE_TERMS[0].id);

  const selectedTerm = AVAILABLE_TERMS.find((t) => t.id === selectedTermId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif">
          Availability Submission
        </h1>
        <p className="text-text-muted mt-2">
          Submit your preferred and available teaching hours per term. Your preferences help the scheduling algorithm find optimal assignments.
        </p>
      </div>

      {/* Term Selector */}
      {AVAILABLE_TERMS.length > 1 && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-text-muted">Select Academic Term</label>
          <div className="flex flex-wrap gap-3">
            {AVAILABLE_TERMS.map((term) => (
              <button
                key={term.id}
                onClick={() => setSelectedTermId(term.id)}
                className={`px-4 py-3 rounded-xl border-2 transition-all font-medium text-sm ${
                  selectedTermId === term.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface-alt text-text-muted hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{term.label}</span>
                  {term.isOpen && (
                    <Badge variant="outline" className="ml-1 text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                      Open
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status Alert */}
      {selectedTerm && !selectedTerm.isOpen && (
        <Card className="bg-amber-50 border border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Availability window closed</p>
                <p className="text-sm text-amber-800 mt-1">
                  Submission for this term is no longer open. Contact your department chair for assistance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Submission View */}
      {selectedTerm && (
        <AvailabilitySubmissionView
          key={selectedTerm.id}
          termId={selectedTerm.id}
          academicYear={selectedTerm.academicYear}
          semester={selectedTerm.semester}
          minHoursRequired={12}
        />
      )}
    </div>
  );
}
