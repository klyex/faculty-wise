"use client";

import React from "react";
import { CourseOfferingWithCourse, OfferingStatus } from "@/lib/types/offering.types";
import { Card, CardContent } from "@/components/ui/Card";
import { Trash2, FileText } from "lucide-react";

interface OfferingsListProps {
  offerings: CourseOfferingWithCourse[];
  onDelete: (offeringId: string) => void;
  onStatusChange?: (offeringId: string, newStatus: OfferingStatus) => void;
}

const statusConfig: Record<OfferingStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: "Draft", color: "text-blue-700", bgColor: "bg-blue-50" },
  published: { label: "Published", color: "text-emerald-700", bgColor: "bg-emerald-50" },
  archived: { label: "Archived", color: "text-gray-700", bgColor: "bg-gray-50" },
};

export function OfferingsList({ offerings, onDelete, onStatusChange }: OfferingsListProps) {
  const handleStatusClick = (offeringId: string, currentStatus: OfferingStatus) => {
    if (!onStatusChange) return;
    
    // Cycle through statuses: draft -> published -> archived -> draft
    const statusSequence: OfferingStatus[] = ["draft", "published", "archived"];
    const currentIndex = statusSequence.indexOf(currentStatus);
    const nextStatus = statusSequence[(currentIndex + 1) % statusSequence.length];
    
    onStatusChange(offeringId, nextStatus);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-text mb-4">Course Offerings</h3>

      {/* Table View on Desktop */}
      <div className="hidden md:block overflow-x-auto border border-border/65 rounded-2xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-surface-alt/25">
              <th className="text-left px-5 py-4 font-bold text-text-muted uppercase tracking-wider text-xs">Subject Code</th>
              <th className="text-left px-5 py-4 font-bold text-text-muted uppercase tracking-wider text-xs">Subject Name</th>
              <th className="text-left px-5 py-4 font-bold text-text-muted uppercase tracking-wider text-xs">Section / Set</th>
              <th className="text-left px-5 py-4 font-bold text-text-muted uppercase tracking-wider text-xs">Units</th>
              <th className="text-left px-5 py-4 font-bold text-text-muted uppercase tracking-wider text-xs">Status</th>
              <th className="text-left px-5 py-4 font-bold text-text-muted uppercase tracking-wider text-xs">Notes</th>
              <th className="text-right px-5 py-4 font-bold text-text-muted uppercase tracking-wider text-xs">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {offerings.map((offering) => (
              <tr
                key={offering.id}
                className="hover:bg-primary/5 transition-all"
              >
                <td className="px-5 py-4">
                  <span className="font-semibold text-text">{offering.courseCode}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-text font-medium">{offering.courseName}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="font-bold text-primary">{offering.sectionName || "—"}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="font-medium text-text-muted">{offering.assignedUnits}</span>
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => handleStatusClick(offering.id, offering.status)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all hover:opacity-85 ${
                      statusConfig[offering.status].bgColor
                    } ${statusConfig[offering.status].color}`}
                  >
                    {statusConfig[offering.status].label}
                  </button>
                </td>
                <td className="px-5 py-4">
                  {offering.notes ? (
                    <div className="flex items-center gap-1.5 text-text-muted group relative cursor-help">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-xs truncate max-w-[120px]">{offering.notes}</span>
                    </div>
                  ) : (
                    <span className="text-text-muted text-xs">—</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onDelete(offering.id)}
                      className="p-2 text-danger hover:bg-danger/10 rounded-xl transition-all"
                      title="Delete offering"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card View on Mobile */}
      <div className="md:hidden space-y-3">
        {offerings.map((offering) => (
          <Card key={offering.id} className="hover:shadow-md transition-all border border-border/50">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-text text-sm">{offering.courseCode}</p>
                    <p className="text-xs text-text-muted mt-0.5">{offering.courseName}</p>
                  </div>
                  <button
                    onClick={() => onDelete(offering.id)}
                    className="p-2 text-danger hover:bg-danger/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs border-t border-b border-border/20 py-3">
                  <div>
                    <p className="text-text-muted uppercase font-bold tracking-wider text-[9px]">Section / Set</p>
                    <p className="font-bold text-primary text-sm mt-0.5">{offering.sectionName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-text-muted uppercase font-bold tracking-wider text-[9px]">Units</p>
                    <p className="font-bold text-text text-sm mt-0.5">{offering.assignedUnits}</p>
                  </div>
                  <div>
                    <p className="text-text-muted uppercase font-bold tracking-wider text-[9px]">Lecture Hours</p>
                    <p className="font-semibold text-text mt-0.5">{offering.courseLectureHours}h</p>
                  </div>
                  <div>
                    <p className="text-text-muted uppercase font-bold tracking-wider text-[9px]">Lab Hours</p>
                    <p className="font-semibold text-text mt-0.5">{offering.courseLabHours}h</p>
                  </div>
                </div>

                {/* Bottom Row: Status */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] text-text-muted">Tap label to change status:</span>
                  <button
                    onClick={() => handleStatusClick(offering.id, offering.status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      statusConfig[offering.status].bgColor
                    } ${statusConfig[offering.status].color} hover:opacity-85`}
                  >
                    {statusConfig[offering.status].label}
                  </button>
                </div>

                {/* Notes */}
                {offering.notes && (
                  <div className="bg-primary/5 border border-primary/10 p-3 rounded-2xl text-xs text-text-muted leading-relaxed">
                    <p className="font-bold text-[9px] uppercase tracking-wider text-primary mb-1">Notes</p>
                    {offering.notes}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
