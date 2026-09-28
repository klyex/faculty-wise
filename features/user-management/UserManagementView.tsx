"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Shield, 
  GraduationCap, 
  UserCircle,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AddUserModal } from "./components/AddUserModal";
import { userManagementService } from "./user-management.service";
import { User } from "@/lib/types/firestore.types";
import { FacultyMember } from "@/lib/types/faculty-load.types";
import { FacultyProfileDrawer } from "@/features/faculty-load/components/FacultyProfileDrawer";
import { facultyLoadService } from "@/features/faculty-load/faculty-load.service";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { getDb } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
export default function UserManagementView() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [departments, setDepartments] = useState<any[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const toast = useToast();
  
  // Categorization states (bound to URL parameters)
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("sub") as any) || "all";
  
  const setActiveTab = (tab: 'all' | 'admin' | 'teacher' | 'student') => {
    setSearchParams(prev => {
      prev.set("sub", tab);
      return prev;
    });
  };

  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  // Faculty Profile Drawer states
  const [facultyMembers, setFacultyMembers] = useState<FacultyMember[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<FacultyMember | null>(null);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  // Subscribe to faculty load for dynamic profiles
  useEffect(() => {
    const unsubscribe = facultyLoadService.subscribeFacultyLoad((data) => {
      setFacultyMembers(data);
      
      // Update selected teacher to reflect dynamic saves instantly
      if (selectedTeacher) {
        const updated = data.find(f => f.id === selectedTeacher.id);
        if (updated) setSelectedTeacher(updated);
      }
    });
    return () => unsubscribe();
  }, [selectedTeacher]);

  const handleViewTeacherProfile = (userId: string) => {
    const member = facultyMembers.find(f => f.id === userId);
    if (member) {
      setSelectedTeacher(member);
      setIsProfileDrawerOpen(true);
    }
  };

  useEffect(() => {
    setLoading(true);
    const unsubscribe = userManagementService.subscribeUsers((data) => {
      setUsers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch departments
  useEffect(() => {
    const db = getDb();
    if (!db) return;

    const deptRef = collection(db, "departments");
    const unsubscribe = onSnapshot(deptRef, (snapshot) => {
      const depts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDepartments(depts);
    });

    return () => unsubscribe();
  }, []);

  // Fetch supplementary directories (teachers, students, programs, sections)
  useEffect(() => {
    const db = getDb();
    if (!db) return;

    const unsubscribers: (() => void)[] = [];

    try {
      const teachUnsub = onSnapshot(collection(db, "teachers"), (snapshot) => {
        setTeachers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      unsubscribers.push(teachUnsub);

      const studUnsub = onSnapshot(collection(db, "students"), (snapshot) => {
        setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      unsubscribers.push(studUnsub);

      const progUnsub = onSnapshot(collection(db, "programs"), (snapshot) => {
        setPrograms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      unsubscribers.push(progUnsub);

      const sectUnsub = onSnapshot(collection(db, "sections"), (snapshot) => {
        setSections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      unsubscribers.push(sectUnsub);
    } catch (err) {
      console.error("Error subscribing to supplementary directories:", err);
    }

    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  const { profile } = useAuth();

  const handleAssignDepartment = async (userId: string, departmentId: string | null) => {
    try {
      await userManagementService.updateUserDepartment(userId, departmentId, profile || undefined);
    } catch (error) {
      console.error("Failed to assign department:", error);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await userManagementService.updateUserStatus(user.id, newStatus, profile || undefined);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setDeleteConfirmId(userId);
  };

  const confirmDeleteUser = async () => {
    if (!deleteConfirmId) return;
    try {
      await userManagementService.deleteUser(deleteConfirmId, profile || undefined);
      toast.success("User Deleted", "The user has been successfully deleted.");
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Deletion Failed", "Failed to delete the user.");
    }
  };

  const filteredUsers = users.filter(user => {
    const displayName = (user.displayName || (user as any).name || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return displayName.includes(query) || email.includes(query);
  });

  const displayedUsers = filteredUsers.filter(user => {
    if (activeTab === 'all') return true;
    return user.role === activeTab;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    teachers: users.filter(u => u.role === 'teacher').length,
    students: users.filter(u => u.role === 'student').length,
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif">User Management</h1>
          <p className="text-text-muted mt-1">Manage institutional access for administrators, faculty, and students.</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="gap-2 bg-primary hover:bg-primary-strong transition-all shadow-md h-12 px-6 rounded-2xl"
        >
          <Plus className="h-5 w-5" /> Add User
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats.total} icon={Users} color="bg-primary" />
        <StatCard label="Administrators" value={stats.admins} icon={Shield} color="bg-amber-500" />
        <StatCard label="Teachers" value={stats.teachers} icon={UserCircle} color="bg-blue-500" />
        <StatCard label="Students" value={stats.students} icon={GraduationCap} color="bg-emerald-500" />
      </div>

      <Card className="border-none shadow-xl bg-white/40 backdrop-blur-md overflow-hidden rounded-[2rem]">
        <CardHeader className="border-b border-border bg-white/50 px-8 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-xl font-semibold">Directory</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-full md:w-64"
                />
              </div>
              <Button variant="secondary" size="icon" className="rounded-xl h-11 w-11">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Visual Role Tabs Switcher */}
        <div className="flex border-b border-border bg-white/30 px-8 py-1.5 gap-6 overflow-x-auto shrink-0">
          {[
            { id: 'all', label: 'All Users', count: stats.total },
            { id: 'admin', label: 'Administrators', count: stats.admins },
            { id: 'teacher', label: 'Faculty', count: stats.teachers },
            { id: 'student', label: 'Students', count: stats.students },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                type="button"
                className={`py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? "border-primary text-primary font-black"
                    : "border-transparent text-text-muted hover:text-text"
                }`}
              >
                {tab.label}
                <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 rounded-full ${
                  isSelected ? "bg-primary text-white" : "bg-surface-alt text-text-muted"
                }`}>
                  {tab.count}
                </Badge>
              </button>
            );
          })}
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-alt/50">
                  {/* Dynamic Headers based on Active Tab */}
                  {activeTab === 'all' && (
                    <>
                      <th className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">User</th>
                      <th className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Role</th>
                      <th className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Department</th>
                      <th className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                      <th className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Joined</th>
                    </>
                  )}
                  {activeTab === 'admin' && (
                    <>
                      <th className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Administrator</th>
                      <th className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                      <th className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Joined</th>
                    </>
                  )}
                  {activeTab === 'teacher' && (
                    <>
                      <th className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Faculty Member</th>
                      <th className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Department assignment</th>
                      <th className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Designation & Load</th>
                      <th className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                      <th className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Joined</th>
                    </>
                  )}
                  {activeTab === 'student' && (
                    <>
                      <th className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Student Name & ID</th>
                      <th className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Academic Program</th>
                      <th className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Year / Section</th>
                      <th className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">GPA</th>
                      <th className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                    </>
                  )}
                  <th className="px-8 py-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-8 py-6 h-20 bg-surface/30" />
                    </tr>
                  ))
                ) : displayedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center text-text-muted italic">
                      No matching records found in this section.
                    </td>
                  </tr>
                ) : (
                  displayedUsers.map((user) => {
                    const joiningDate = user.createdAt?.toDate 
                      ? user.createdAt.toDate().toLocaleDateString() 
                      : 'Recent';

                    const isTeacher = user.role === 'teacher';
                    return (
                      <tr 
                        key={user.id} 
                        className={cn(
                          "group hover:bg-surface-alt/30 transition-colors",
                          isTeacher && "cursor-pointer animate-in duration-200"
                        )}
                        onClick={() => {
                          if (isTeacher) {
                            handleViewTeacherProfile(user.id);
                          }
                        }}
                      >
                        {/* CASE 1: ALL USER DIRECTORY VIEW */}
                        {activeTab === 'all' && (
                          <>
                            <td className="px-8 py-4">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                                  {user.displayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-text">{user.displayName}</span>
                                  <span className="text-xs text-text-muted flex items-center gap-1">
                                    <Mail className="h-3 w-3" /> {user.email || "No email"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-4">
                              <RoleBadge role={user.role} />
                            </td>
                            <td className="px-8 py-4">
                              {user.role === 'teacher' ? (
                                <div className="relative min-w-[160px]" onClick={(e) => e.stopPropagation()}>
                                  <select
                                    value={user.departmentId || ""}
                                    onChange={(e) => handleAssignDepartment(user.id, e.target.value || null)}
                                    className="w-full pl-3 pr-8 py-1.5 bg-white border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer appearance-none text-text"
                                  >
                                    <option value="">Unassigned</option>
                                    {departments.map((dept) => (
                                      <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                      </option>
                                    ))}
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-text-muted">
                                    <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-text-muted font-medium">
                                  {departments.find(d => d.id === user.departmentId)?.name || "-"}
                                </span>
                              )}
                            </td>
                            <td className="px-8 py-4">
                              <StatusBadge status={user.status} />
                            </td>
                            <td className="px-8 py-4">
                              <span className="text-sm text-text-muted flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {joiningDate}
                              </span>
                            </td>
                          </>
                        )}

                        {/* CASE 2: ADMINISTRATORS VIEW */}
                        {activeTab === 'admin' && (
                          <>
                            <td className="px-8 py-4">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold">
                                  {user.displayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-text">{user.displayName}</span>
                                  <span className="text-xs text-text-muted flex items-center gap-1">
                                    <Mail className="h-3 w-3" /> {user.email}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-4">
                              <StatusBadge status={user.status} />
                            </td>
                            <td className="px-8 py-4">
                              <span className="text-sm text-text-muted flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {joiningDate}
                              </span>
                            </td>
                          </>
                        )}

                        {/* CASE 3: FACULTY / TEACHERS VIEW */}
                        {activeTab === 'teacher' && (() => {
                          const details = teachers.find(t => t.uid === user.id) || {};
                          return (
                            <>
                              <td className="px-8 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                    {user.displayName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-semibold text-text truncate">{user.displayName}</span>
                                    <span className="text-xs text-text-muted truncate">
                                      ID: {details.employeeNo || "N/A"} • {user.email}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-4">
                                <div className="relative min-w-[160px]" onClick={(e) => e.stopPropagation()}>
                                  <select
                                    value={user.departmentId || ""}
                                    onChange={(e) => handleAssignDepartment(user.id, e.target.value || null)}
                                    className="w-full pl-3 pr-8 py-1.5 bg-white border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer appearance-none text-text"
                                  >
                                    <option value="">Unassigned</option>
                                    {departments.map((dept) => (
                                      <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                      </option>
                                    ))}
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-text-muted">
                                    <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-4">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-text">{details.designation || "Assistant Professor"}</span>
                                  <span className="text-[11px] text-text-muted mt-0.5">
                                    {details.employmentType || "Full-time"} • Target: {details.targetUnits || 18} Units
                                  </span>
                                </div>
                              </td>
                              <td className="px-8 py-4">
                                <StatusBadge status={user.status} />
                              </td>
                              <td className="px-8 py-4">
                                <span className="text-sm text-text-muted flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {joiningDate}
                                </span>
                              </td>
                            </>
                          );
                        })()}

                        {/* CASE 4: STUDENTS VIEW */}
                        {activeTab === 'student' && (() => {
                          const details = students.find(s => s.uid === user.id) || {};
                          const matchedProgram = programs.find(p => p.id === details.programId);
                          const matchedSection = sections.find(s => s.id === details.sectionId);
                          return (
                            <>
                              <td className="px-8 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold shrink-0">
                                    {user.displayName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-semibold text-text truncate">{user.displayName}</span>
                                    <span className="text-xs text-text-muted truncate">
                                      No: {details.studentNo || "N/A"} • {user.email}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-4">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-text truncate">
                                    {matchedProgram?.name || "General Program"}
                                  </span>
                                  <span className="text-[10px] text-text-muted uppercase font-semibold mt-0.5 shrink-0">
                                    Code: {matchedProgram?.code || details.programId || "N/A"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-8 py-4">
                                <div className="flex flex-col">
                                  <span className="text-xs font-semibold text-text">{matchedSection?.name || details.sectionId || "Unassigned"}</span>
                                  <span className="text-[10px] text-text-muted mt-0.5">Year {details.yearLevel || 1}</span>
                                </div>
                              </td>
                              <td className="px-8 py-4">
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold text-[11px] rounded-lg">
                                  {details.gpa ? Number(details.gpa).toFixed(2) : "4.00"} GPA
                                </Badge>
                              </td>
                              <td className="px-8 py-4">
                                <StatusBadge status={user.status} />
                              </td>
                            </>
                          );
                        })()}

                        {/* Standard Actions Column (shared) */}
                        <td className="px-8 py-4 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            {user.role === 'teacher' && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-primary hover:bg-primary/10 hover:text-primary rounded-xl"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewTeacherProfile(user.id);
                                }}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="h-8 px-3 text-xs rounded-xl"
                              onClick={() => handleToggleStatus(user)}
                            >
                              {user.status === 'active' ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="icon" 
                              className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AddUserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      <FacultyProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
        facultyMember={selectedTeacher}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDeleteUser}
        title="Delete User?"
        message="Are you sure you want to delete this user? This action cannot be undone."
      />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <Card className="border-none shadow-lg bg-white/60 backdrop-blur-md rounded-2xl p-6 flex items-center gap-4">
      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-white", color)}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-text-muted">{label}</p>
        <p className="text-2xl font-bold text-text">{value}</p>
      </div>
    </Card>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: "bg-amber-100 text-amber-700 border-amber-200",
    teacher: "bg-blue-100 text-blue-700 border-blue-200",
    student: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  
  return (
    <Badge className={cn("capitalize px-3 py-1 rounded-lg border", styles[role] || "bg-stone-100 text-stone-700 border-stone-200")}>
      {role}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'active';
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
      isActive ? "text-emerald-600 bg-emerald-50" : "text-stone-500 bg-stone-50"
    )}>
      {isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {isActive ? "Active" : "Inactive"}
    </div>
  );
}
