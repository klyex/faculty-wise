"use client";

import React, { useState } from "react";
import { 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  updatePassword 
} from "firebase/auth";
import { getAuthInstance } from "@/lib/firebase";
import { useAuth } from "@/lib/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChangePasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ChangePasswordForm({ onSuccess, onCancel }: ChangePasswordFormProps) {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const auth = getAuthInstance();
      if (!auth) throw new Error("Auth instance not found");

      // 1. Re-authenticate the user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Update the password
      await updatePassword(user, newPassword);

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }
    } catch (err: any) {
      console.error("Change password error:", err);
      if (err.code === "auth/wrong-password") {
        setError("The current password you entered is incorrect.");
      } else {
        setError(err.message || "Failed to update password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 text-center space-y-4 animate-in zoom-in-95 duration-300">
        <div className="mx-auto h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-sm">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-text">Password Updated!</h3>
          <p className="text-text-muted text-sm">Your security credentials have been successfully updated.</p>
        </div>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} className="mt-4">
            Close
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-1 animate-in fade-in slide-in-from-top-2 duration-400">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-text flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-text-muted" />
          Current Password
        </label>
        <div className="relative">
          <input
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full h-11 px-4 pr-12 rounded-xl border border-border bg-white text-text focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text transition-colors"
          >
            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-text flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-text-muted" />
          New Password
        </label>
        <div className="relative">
          <input
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full h-11 px-4 pr-12 rounded-xl border border-border bg-white text-text focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
            placeholder="Min. 6 characters"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text transition-colors"
          >
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-text flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-text-muted" />
          Confirm New Password
        </label>
        <input
          type={showNew ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full h-11 px-4 rounded-xl border border-border bg-white text-text focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/5 border border-danger/20 text-danger text-sm animate-in slide-in-from-left-2 duration-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button 
          type="submit" 
          disabled={loading} 
          className="flex-1 h-11"
        >
          {loading ? "Updating..." : "Update Password"}
        </Button>
        {onCancel && (
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel}
            disabled={loading}
            className="px-6 h-11"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
