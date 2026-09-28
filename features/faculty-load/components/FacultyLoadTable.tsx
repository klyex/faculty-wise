"use client";

import React from "react";
import { FacultyMember, LoadStatus } from "@/lib/types/faculty-load.types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MoreHorizontal, ExternalLink } from "lucide-react";

interface FacultyLoadTableProps {
  faculty: FacultyMember[];
  onSelect: (member: FacultyMember) => void;
}

const statusConfig: Record<LoadStatus, { label: string; className: string }> = {
  underloaded: { label: "Underloaded", className: "bg-amber-100 text-amber-700 border-amber-200" },
  normal: { label: "Normal", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  excess_load: { label: "Excess Load", className: "bg-rose-100 text-rose-700 border-rose-200" },
};

export function FacultyLoadTable({ faculty, onSelect }: FacultyLoadTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border bg-surface-alt/50 text-[10px] uppercase tracking-wider text-text-muted font-bold">
            <th className="px-6 py-4">Faculty Member</th>
            <th className="px-6 py-4">Designation</th>
            <th className="px-6 py-4">Total Units</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {faculty.map((member) => (
            <tr
              key={member.id}
              className="hover:bg-primary/5 transition-colors group cursor-pointer"
              onClick={() => onSelect(member)}
            >
              <td className="px-6 py-4">
                <div>
                  <p className="font-semibold text-text group-hover:text-primary transition-colors">{member.name}</p>
                  <p className="text-xs text-text-muted">{member.department}</p>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-text-muted">
                {member.designation}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text">{member.totalUnits}</span>
                  <span className="text-[10px] text-text-muted">/ {member.targetUnits}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <Badge variant="outline" className={statusConfig[member.status].className}>
                  {statusConfig[member.status].label}
                </Badge>
              </td>
              <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary rounded-lg"
                    onClick={() => onSelect(member)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
