"use client";

import { Link, useNavigate } from "react-router-dom";

import { appRoutes } from "@/lib/constants/routes.constants";
import { Eye, EyeOff } from "lucide-react";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";

export default function LoginPageView() {
  const navigate = useNavigate();
  const { profile, login, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      const redirectPath =
        profile.role === 'admin' ? appRoutes.dashboard :
          profile.role === 'vpaa' ? appRoutes.vpaaDashboard :
            profile.role === 'program_head' ? appRoutes.programHeadDashboard :
              profile.role === 'dean' ? appRoutes.deanDashboard :
                profile.role === 'teacher' ? appRoutes.teacherDashboard :
                  appRoutes.studentDashboard;
      navigate(redirectPath);
    }
  }, [profile, navigate]);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.16),_transparent_34%),linear-gradient(180deg,_#fffaf1_0%,_#f3efe6_100%)] px-6 py-8 text-stone-900 sm:px-8 lg:px-10">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
            <p className="text-sm text-stone-500">Checking session...</p>
          </div>
        </div>
      </main>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      // Redirection is handled by the useEffect watching the profile
    } catch (err: any) {
      const code = err?.code || '';
      const messages: Record<string, string> = {
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-credential': 'Invalid email or password. Please try again.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Check your connection.',
      };
      setError(messages[code] || 'Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.16),_transparent_34%),linear-gradient(180deg,_#fffaf1_0%,_#f3efe6_100%)] px-6 py-8 text-stone-900 sm:px-8 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full items-center justify-center">
        <section className="w-full max-w-lg">
          <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_25px_70px_rgba(100,75,35,0.14)] backdrop-blur-xl sm:p-8 lg:p-10">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
                Welcome back
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-stone-950">
                Login to your account
              </h2>
              <p className="text-sm leading-6 text-stone-600">
                Use your institution email to continue.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleLogin}>
              {error && (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-stone-700"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-stone-700"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 pr-12 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 transition hover:text-stone-600 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-stone-600">
                  <input
                    type="checkbox"
                    name="remember"
                    className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                  />
                  Remember me
                </label>
                <a
                  href="#"
                  className="font-medium text-amber-700 transition hover:text-amber-800"
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

              <p className="text-center text-sm text-stone-600 mt-4.5">
                Don't have an account?{" "}
                <Link to="/register" className="font-semibold text-amber-700 hover:text-amber-800 transition-colors">
                  Create an account
                </Link>
              </p>

              <p className="text-center text-xs text-stone-500 mt-3">
                Looking for schedules?{" "}
                <Link to="/search" className="font-semibold text-amber-700 hover:text-amber-800 transition-colors">
                  🔍 Public Schedule Search
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

