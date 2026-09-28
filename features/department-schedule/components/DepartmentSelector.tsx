"use client";

import React from "react";
import { Department, Program, Section } from "@/lib/types/department-schedule.types";
import { Filter, ChevronDown } from "lucide-react";

interface DepartmentSelectorProps {
  departments: Department[];
  programs: Program[];
  sections: Section[];
  selectedDepartmentId?: string;
  selectedProgramId?: string;
  selectedSectionId?: string;
  onDepartmentChange?: (departmentId: string) => void;
  onProgramChange?: (programId: string) => void;
  onSectionChange?: (sectionId: string) => void;
}

export function DepartmentSelector({ 
  departments, 
  programs, 
  sections,
  selectedDepartmentId,
  selectedProgramId,
  selectedSectionId,
  onDepartmentChange,
  onProgramChange,
  onSectionChange,
}: DepartmentSelectorProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl bg-white/50 backdrop-blur-md border border-border/50 shadow-sm">
      <div className="flex items-center gap-3 px-3 py-2 border-r border-border/50">
        <Filter className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Filter By</span>
      </div>
      
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative group">
          <select 
            value={selectedDepartmentId || ""}
            onChange={(e) => onDepartmentChange?.(e.target.value)}
            className="w-full pl-4 pr-10 py-2 bg-surface border border-border rounded-xl text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none group-hover:text-primary transition-colors" />
        </div>

        <div className="relative group">
          <select 
            value={selectedProgramId || ""}
            onChange={(e) => onProgramChange?.(e.target.value)}
            className="w-full pl-4 pr-10 py-2 bg-surface border border-border rounded-xl text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
          >
            <option value="">All Programs</option>
            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none group-hover:text-primary transition-colors" />
        </div>

        <div className="relative group">
          <select 
            value={selectedSectionId || ""}
            onChange={(e) => onSectionChange?.(e.target.value)}
            className="w-full pl-4 pr-10 py-2 bg-surface border border-border rounded-xl text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
          >
            <option value="">All Sections</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none group-hover:text-primary transition-colors" />
        </div>
      </div>
    </div>
  );
}
