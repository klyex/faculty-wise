"use client";

import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Check, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { userManagementService } from "@/features/user-management/user-management.service";

export default function ActivateAccountView() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !token) {
      setError("Invalid activation link details.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await userManagementService.activateUserPassword(email, token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Failed to activate account. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 p-4 font-manrope">
        <div className="w-full max-w-md rounded-[2.5rem] bg-white border border-stone-200 p-8 shadow-xl text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600">
            <ShieldCheck size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-stone-900 font-source-serif">Account Activated!</h1>
            <p className="text-sm text-stone-500">
              Your password has been successfully configured. You can now access your account dashboard.
            </p>
          </div>
          <Button
            onClick={() => navigate("/login")}
            className="w-full h-12 rounded-2xl bg-stone-950 hover:bg-stone-800 text-white font-semibold"
          >
            Go to Login
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 p-4 font-manrope">
      <div className="w-full max-w-md rounded-[2.5rem] bg-white border border-stone-200 p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Lock size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-source-serif">Activate Account</h1>
            <p className="text-xs text-stone-500">Set a new password for {email || "your account"}</p>
          </div>
        </div>

        {(!email || !token) ? (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-800 text-xs flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Invalid activation link. Please request a new invitation from your administrator.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-800 text-xs flex gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-600 px-1">New Password</label>
              <input
                type="password"
                required
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-stone-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 placeholder:text-stone-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-600 px-1">Confirm Password</label>
              <input
                type="password"
                required
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-stone-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 placeholder:text-stone-400"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-stone-950 hover:bg-stone-800 text-white font-semibold gap-2 mt-4"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Activate Account
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
