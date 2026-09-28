"use client";

import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { appRoutes } from "@/lib/constants/routes.constants";

export default function HomePageView() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      const redirectPath = 
        profile.role === 'admin' ? appRoutes.dashboard :
        profile.role === 'teacher' ? appRoutes.teacherDashboard :
        appRoutes.studentDashboard;
      navigate(redirectPath);
    }
  }, [profile, navigate]);
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.14),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(15,118,110,0.12),_transparent_30%),linear-gradient(180deg,_#fffdf8_0%,_#f6f1e7_100%)] text-stone-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between rounded-full border border-white/60 bg-white/70 px-4 py-3 shadow-[0_20px_60px_rgba(120,90,40,0.08)] backdrop-blur-xl">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-700">
              Faculty Wise
            </p>
            <p className="text-sm text-stone-500">
              Scheduling that respects faculty load.
            </p>
          </div>
          <Link
            to={appRoutes.login}
            className="inline-flex h-11 items-center justify-center rounded-full bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            Sign in
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:py-16">
          <div className="max-w-2xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-sm font-medium text-amber-900 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Faculty scheduling, load balancing, and assignment tracking
            </div>

            <div className="space-y-5">
              <h1 className="max-w-xl text-5xl font-semibold tracking-tight text-stone-950 sm:text-6xl">
                Bring clarity to every class assignment.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-stone-600 sm:text-xl">
                Faculty Wise helps academic teams organize teaching loads,
                surface conflicts early, and keep schedules readable without
                endless spreadsheet edits.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to={appRoutes.login}
                className="inline-flex h-12 items-center justify-center rounded-full bg-amber-500 px-6 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(245,158,11,0.35)] transition hover:bg-amber-600"
              >
                Open login
              </Link>
              <a
                href="#capabilities"
                className="inline-flex h-12 items-center justify-center rounded-full border border-stone-300 bg-white/80 px-6 text-sm font-semibold text-stone-800 transition hover:border-stone-400 hover:bg-white"
              >
                See what it does
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-8 h-24 w-24 rounded-full bg-amber-300/40 blur-3xl" />
            <div className="absolute -bottom-10 right-4 h-32 w-32 rounded-full bg-teal-300/30 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-stone-950 p-8 text-stone-50 shadow-[0_28px_80px_rgba(42,32,17,0.22)]">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_45%)]" />
              <div className="relative space-y-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-amber-300">
                    Quick snapshot
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    Centralized control for the semester.
                  </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-stone-300">Faculty load</p>
                    <p className="mt-2 text-3xl font-semibold">Balanced</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-stone-300">Conflict alerts</p>
                    <p className="mt-2 text-3xl font-semibold">Live</p>
                  </div>
                </div>

                <div
                  id="capabilities"
                  className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <p className="text-sm font-medium text-stone-300">
                    Built for academic operations
                  </p>
                  <ul className="space-y-3 text-sm text-stone-200">
                    <li>• View faculty assignments in one place</li>
                    <li>• Surface overloads before schedules are published</li>
                    <li>• Keep teams aligned with a single source of truth</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
