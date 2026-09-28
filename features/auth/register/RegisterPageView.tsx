"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuthInstance, getDb } from "@/lib/firebase";
import { appRoutes } from "@/lib/constants/routes.constants";
export default function RegisterPageView() {
  const navigate = useNavigate();
  const [role] = useState<'student' | 'teacher'>('teacher');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // School Email validation for Teacher
    if (role === 'teacher') {
      const emailDomain = email.split("@")[1]?.toLowerCase();
      if (!emailDomain || !(emailDomain.endsWith(".edu") || emailDomain === "university.edu")) {
        setError("Teachers must register using a valid school email address (ending in .edu).");
        setLoading(false);
        return;
      }
    }

    try {
      const auth = getAuthInstance();
      const db = getDb();

      if (!auth || !db) return;

      // Real Firebase Mode
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 1. Create main profile in Firestore users collection
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        email: user.email,
        displayName: displayName,
        role: role,
        status: 'active',
        departmentId: 'cs-dept',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Seed role-specific collections in Firestore
      if (role === 'teacher') {
        const employeeNo = `EMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        await setDoc(doc(db, 'teachers', user.uid), {
          uid: user.uid,
          employeeNo: employeeNo,
          fullName: displayName,
          designation: 'Faculty',
          employmentType: 'Full-time',
          targetUnits: 18,
          specialization: 'Computer Science',
          major: 'Software Engineering',
          certifications: [],
          skills: [],
          teachingExperience: '1 Year',
          eligibleSubjects: [],
          officeLocation: 'Science Building, Room 204',
          createdAt: serverTimestamp(),
        });
      } else {
        const studentNo = `STUD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        await setDoc(doc(db, 'students', user.uid), {
          uid: user.uid,
          studentNo: studentNo,
          fullName: displayName,
          programId: 'bscs',
          sectionId: 'section-bscs-3a', // Default BSCS-3A
          yearLevel: 1,
          major: 'General Computer Science',
          gpa: 4.0,
          createdAt: serverTimestamp(),
        });
      }

      const redirectPath = role === 'teacher' ? appRoutes.teacherDashboard : appRoutes.studentDashboard;
      navigate(redirectPath);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered.");
      } else if (err.code === 'auth/weak-password') {
        setError("The password is too weak. Please use at least 6 characters.");
      } else {
        setError(err.message || "Failed to create account.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.16),_transparent_34%),linear-gradient(180deg,_#fffaf1_0%,_#f3efe6_100%)] px-6 py-8 text-stone-900 sm:px-8 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl gap-8 lg:grid-cols-[1fr_0.95fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-stone-950 p-8 text-white shadow-[0_30px_90px_rgba(43,30,12,0.24)] sm:p-10 lg:p-12">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.1),transparent_40%)]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="max-w-xl space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">
                Faculty Wise
              </p>
              <div className="space-y-4">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl transition-all duration-300">
                  {role === 'student' ? 'Student Portal Registration' : 'Faculty Portal Registration'}
                </h1>
                <p className="max-w-lg text-base leading-7 text-stone-300 sm:text-lg transition-all duration-300">
                  {role === 'student'
                    ? 'Create your student account to access your academic schedule, view department announcements, and manage your enrollment.'
                    : 'Create your professional teaching profile to coordinate timetables, manage teaching workloads, submit preferred availabilities, and check course details.'}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-stone-300">Schedules</p>
                <p className="mt-2 text-2xl font-semibold">Real-time</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-stone-300">Updates</p>
                <p className="mt-2 text-2xl font-semibold">Instant</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-stone-300">Support</p>
                <p className="mt-2 text-2xl font-semibold">Direct</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-lg rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_25px_70px_rgba(100,75,35,0.14)] backdrop-blur-xl sm:p-8 lg:p-10">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
                Get started
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-stone-950 transition-all duration-300">
                {role === 'student' ? 'Student Registration' : 'Faculty Registration'}
              </h2>
              <p className="text-sm leading-6 text-stone-600 transition-all duration-300">
                {role === 'student'
                  ? 'Access your section timetable and class calendars.'
                  : 'Requires a valid school email address (ending in .edu).'}
              </p>
            </div>


            <form className="mt-6 space-y-5" onSubmit={handleRegister}>
              {error && (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="displayName" className="text-sm font-medium text-stone-700">
                  Full Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  required
                  placeholder="e.g. Jane Smith"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-stone-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={role === 'student' ? "student@university.edu" : "teacher@university.edu"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-stone-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Registering..." : role === 'student' ? "Register as Student" : "Register as Teacher"}
              </button>

              <p className="text-center text-sm text-stone-600">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-amber-700">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
