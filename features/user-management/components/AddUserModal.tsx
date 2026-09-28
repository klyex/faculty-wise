"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, Mail, Lock, Shield, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { userManagementService } from "../user-management.service";
import { useAuth } from "@/lib/context/AuthContext";
import { getDb } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useToast } from "@/components/ui/Toast";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddUserModal({ isOpen, onClose }: AddUserModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<'admin' | 'teacher' | 'student' | 'program_head' | 'dean' | 'vpaa'>('student');
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();
  const toast = useToast();

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const newUser = await userManagementService.createManagedUser({
        email,
        displayName,
        role,
        password,
        departmentId: (role === 'teacher' || role === 'program_head' || role === 'dean' || role === 'vpaa') && departmentId ? departmentId : null,
      }, profile || undefined);

      onClose();

      toast.success(
        "User Created Successfully",
        `Account for ${displayName} (${role}) has been created.`
      );

      // Reset form
      setEmail("");
      setPassword("");
      setDisplayName("");
      setRole("student");
      setDepartmentId("");
    } catch (err: any) {
      setError(err.message || "Failed to create user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-surface rounded-[2rem] border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="relative p-8">
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 p-2 rounded-full hover:bg-surface-alt transition-colors"
          >
            <X className="h-5 w-5 text-text-muted" />
          </button>

          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-text font-source-serif">Add New User</h2>
              <p className="text-text-muted text-sm">Create a new account or send an email invitation.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted px-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-surface-alt border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted px-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="email"
                  required
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-surface-alt border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted px-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input
                    type="password"
                    required
                    placeholder="Enter a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 bg-surface-alt border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted px-1">Role</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full h-12 pl-11 pr-4 bg-surface-alt border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text appearance-none cursor-pointer"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="vpaa">VPAA</option>
                    <option value="program_head">Program Head</option>
                    <option value="dean">Dean</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
            </div>

            {(role === 'teacher' || role === 'program_head') && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                <label className="text-sm font-medium text-text-muted px-1">Department Assignment</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full h-12 px-4 bg-surface-alt border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <Button 
                type="button" 
                variant="secondary" 
                className="flex-1 rounded-xl h-12"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 rounded-xl h-12"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
