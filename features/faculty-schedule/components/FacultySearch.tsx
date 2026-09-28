"use client";

import React from "react";
import { Search, Building2, User } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { useSearchParams } from "react-router-dom";

interface FacultySearchProps {
  departments: { id: string; name: string }[];
}

export function FacultySearch({ departments }: FacultySearchProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [query, setQuery] = React.useState(searchParams.get("instructor") || "");
  const [departmentId, setDepartmentId] = React.useState(searchParams.get("dept") || "all");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query) params.set("instructor", query);
    if (departmentId !== "all") params.set("dept", departmentId);
    
    setSearchParams(params);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 p-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 shadow-xl">
      <div className="flex-1 relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-indigo-600 transition-colors">
          <User className="h-5 w-5" />
        </div>
        <Input
          placeholder="Search instructor by name..."
          className="pl-12 h-12 bg-white/50 border-white/30 focus:bg-white transition-all text-base"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
      </div>
      
      <div className="w-full md:w-64 relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-indigo-600 transition-colors pointer-events-none">
          <Building2 className="h-5 w-5" />
        </div>
        <select 
          className="w-full pl-12 pr-4 h-12 bg-white/50 border border-white/30 rounded-xl text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:bg-white transition-all cursor-pointer"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
        >
          <option value="all">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <button 
        onClick={handleSearch}
        className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
      >
        <Search className="h-5 w-5" />
        Search
      </button>
    </div>
  );
}
