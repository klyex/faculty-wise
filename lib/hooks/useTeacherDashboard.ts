'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAuth } from './useAuth';
import type { TeacherDashboardData, UpcomingSession, TeacherCourse, TeacherStats } from '@/lib/types/teacher-dashboard.types';
import type { Course, Schedule } from '@/lib/types/firestore.types';

export function useTeacherDashboard() {
  const { profile } = useAuth();
  const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!profile || !profile.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const db = getDb();
      if (!db) {
        setError(new Error('Firestore not initialized'));
        return;
      }

      const unsubscribers: Unsubscribe[] = [];

      // Listen to schedules in real-time
      const schedulesRef = collection(db, 'schedules');
      const schedulesQ = query(schedulesRef, where('teacherId', '==', profile.id));
      
      const unsubSchedules = onSnapshot(schedulesQ, async (schedulesSnapshot) => {
        try {
          const schedules: Schedule[] = schedulesSnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          } as Schedule));

          // Listen to courses in real-time
          const coursesRef = collection(db, 'courses');
          const unsubCourses = onSnapshot(coursesRef, async (coursesSnapshot) => {
            try {
              const courses: Course[] = coursesSnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
              } as Course));

              // Listen to teacher availability
              const teachersRef = collection(db, 'teachers');
              const teachersQ = query(teachersRef, where('uid', '==', profile.id));
              
              const unsubTeachers = onSnapshot(teachersQ, (teachersSnapshot) => {
                const teacherDoc = teachersSnapshot.docs[0];
                const teacherData = teacherDoc?.data() || {};

                // Calculate upcoming sessions
                const now = new Date();
                const upcomingSessions: UpcomingSession[] = schedules
                  .filter((schedule: Schedule) => {
                    const sessionDate = new Date(schedule.date?.toDate?.() || schedule.date);
                    return sessionDate > now;
                  })
                  .sort((a: Schedule, b: Schedule) => {
                    const dateA = new Date(a.date?.toDate?.() || a.date);
                    const dateB = new Date(b.date?.toDate?.() || b.date);
                    return dateA.getTime() - dateB.getTime();
                  })
                  .map((schedule: Schedule) => ({
                    id: schedule.id,
                    courseId: schedule.courseId,
                    courseName: schedule.courseName || 'Course',
                    courseCode: schedule.courseCode || 'N/A',
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    dayOfWeek: schedule.dayOfWeek,
                    date: new Date(schedule.date?.toDate?.() || schedule.date),
                    room: schedule.room,
                    building: schedule.building,
                    isOnline: schedule.isOnline || false,
                  }));

                // Get the next session
                const nextSession = upcomingSessions[0] || null;
                if (nextSession) {
                  const sessionTime = new Date(nextSession.date);
                  nextSession.minutesUntilStart = Math.round((sessionTime.getTime() - now.getTime()) / 60000);
                }

                // Calculate teacher courses
                const teacherCourses: TeacherCourse[] = schedules
                  .reduce((acc: TeacherCourse[], schedule: Schedule) => {
                    const course = courses.find((c: Course) => c.id === schedule.courseId);
                    if (course) {
                      const existing = acc.find((c: TeacherCourse) => c.id === course.id);
                      if (!existing) {
                        acc.push({
                          id: course.id,
                          code: course.code || 'N/A',
                          name: course.name || 'Course',
                          units: course.units || (course as any).credits || 0,
                          sections: schedules.filter((s: Schedule) => s.courseId === course.id).length,
                          sessionDays: [schedule.dayOfWeek || 'N/A'],
                          studentCount: (course as any).studentCount || 0,
                          status: 'active',
                        });
                      } else if (!existing.sessionDays.includes(schedule.dayOfWeek)) {
                        existing.sessionDays.push(schedule.dayOfWeek);
                      }
                    }
                    return acc;
                  }, []);

                // Calculate stats
                const stats: TeacherStats = {
                  totalAssignedUnits: teacherCourses.reduce((sum: number, c: TeacherCourse) => sum + (c.units || 0), 0),
                  targetUnits: teacherData.targetUnits || 18,
                  teachingHoursPerWeek: calculateWeeklyTeachingHours(schedules),
                  scheduleStatus: teacherData.scheduleStatus || 'finalized',
                  availabilityStatus: teacherData.availabilityStatus || 'submitted',
                  lastAvailabilityUpdate: teacherData.lastAvailabilityUpdate?.toDate?.() || new Date(),
                };

                setDashboardData({
                  stats,
                  upcomingSession: nextSession,
                  courses: teacherCourses,
                  lastUpdated: new Date(),
                });

                setError(null);
                setLoading(false);
              });

              unsubscribers.push(unsubTeachers);
            } catch (err) {
              setError(err instanceof Error ? err : new Error('Failed to load courses'));
              setLoading(false);
            }
          });

          unsubscribers.push(unsubCourses);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to load schedules'));
          setLoading(false);
        }
      });

      unsubscribers.push(unsubSchedules);

      // Cleanup function
      return () => {
        unsubscribers.forEach(unsub => unsub());
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
    }
  }, [profile?.id]);

  return { dashboardData, loading, error };
}

function calculateWeeklyTeachingHours(schedules: Schedule[]): number {
  const days = new Set<string>();
  let totalHours = 0;

  schedules.forEach((schedule: Schedule) => {
    const dayKey = schedule.dayOfWeek;
    if (!days.has(dayKey)) {
      days.add(dayKey);
      // Parse times like "09:00" to calculate hours
      if (schedule.startTime && schedule.endTime) {
        const [startH, startM] = schedule.startTime.split(':').map(Number);
        const [endH, endM] = schedule.endTime.split(':').map(Number);
        const hours = (endH - startH) + ((endM - startM) / 60);
        totalHours += Math.max(0, hours);
      }
    }
  });

  return Math.round(totalHours * 10) / 10;
}
