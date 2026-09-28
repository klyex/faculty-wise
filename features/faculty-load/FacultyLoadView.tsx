import React, { useState, useEffect } from "react";
import { FacultyLoadTable } from "./components/FacultyLoadTable";
import { FacultyLoadStats } from "./components/FacultyLoadStats";
import { NewAssignmentModal } from "./components/NewAssignmentModal";
import { FacultyProfileDrawer } from "./components/FacultyProfileDrawer";
import { FacultyMember } from "@/lib/types/faculty-load.types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Filter, Download, Plus, Loader2 } from "lucide-react";
import { facultyLoadService } from "./faculty-load.service";

export function FacultyLoadView() {
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [filteredFaculty, setFilteredFaculty] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  
  const [selectedMember, setSelectedMember] = useState<FacultyMember | null>(null);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  useEffect(() => {
    // Subscribe to real-time faculty load updates
    const unsubscribe = facultyLoadService.subscribeFacultyLoad((data) => {
      setFaculty(data);
      setLoading(false);

      // Extract unique departments
      const depts = Array.from(new Set(data.map((f) => f.department))).sort();
      setDepartments(depts);
      
      // Update selected member if it exists in the new dataset to reflect live edits
      if (selectedMember) {
        const updated = data.find(f => f.id === selectedMember.id);
        if (updated) setSelectedMember(updated);
      }
    });

    return () => unsubscribe();
  }, [selectedMember]);

  // Filter faculty based on selected department
  useEffect(() => {
    if (selectedDepartment === "All") {
      setFilteredFaculty(faculty);
    } else {
      setFilteredFaculty(faculty.filter((f) => f.department === selectedDepartment));
    }
  }, [faculty, selectedDepartment]);

  const stats = {
    totalFaculty: filteredFaculty.length,
    totalUnits: filteredFaculty.reduce((acc, curr) => acc + curr.totalUnits, 0),
    excessLoadCount: filteredFaculty.filter((f) => f.status === "excess_load").length,
    underloadedCount: filteredFaculty.filter((f) => f.status === "underloaded").length,
  };

  const handleExport = () => {
    facultyLoadService.downloadAsCSV(filteredFaculty);
  };

  const handleAssignmentSuccess = () => {
    // Refresh data will happen automatically via subscription
    setIsAssignmentModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif">
            Faculty Load
          </h1>
          <p className="text-text-muted mt-1">
            Manage teaching assignments and track faculty utilization across departments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="gap-2"
            onClick={handleExport}
            disabled={loading}
          >
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-primary hover:bg-primary-strong transition-all shadow-md"
            onClick={() => setIsAssignmentModalOpen(true)}
            disabled={loading}
          >
            <Plus className="h-4 w-4" /> New Assignment
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-text-muted">Loading faculty load data...</span>
        </div>
      ) : (
        <>
          <FacultyLoadStats {...stats} />

          <Card className="border-none shadow-md bg-white/40 backdrop-blur-md overflow-hidden">
            <CardHeader className="border-b border-border bg-white/50 px-6 py-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-lg">Faculty Utilization List</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer min-w-[160px]"
                    >
                      <option value="All">All Departments</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredFaculty.length === 0 ? (
                <div className="p-8 text-center text-text-muted">
                  <p>No faculty members found for the selected department.</p>
                </div>
              ) : (
                <FacultyLoadTable 
                  faculty={filteredFaculty} 
                  onSelect={(member) => {
                    setSelectedMember(member);
                    setIsProfileDrawerOpen(true);
                  }}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}

      <NewAssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        onSuccess={handleAssignmentSuccess}
      />

      <FacultyProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
        facultyMember={selectedMember}
      />
    </div>
  );
}

export default FacultyLoadView;
