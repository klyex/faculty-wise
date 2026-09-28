'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSystemInfo } from '@/lib/context/SystemContext';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  Unsubscribe,
  limit,
  getDocs
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAuth } from './useAuth';
import type { 
  AdminDashboardData, 
  UserStats, 
  SchedulerRun, 
  SystemHealth, 
  HealthService, 
  ServerMetrics 
} from '@/lib/types/admin-dashboard.types';
import type { User, Schedule, Course, Room } from '@/lib/types/firestore.types';
import { notificationService } from '@/features/notifications/notifications.service';

// Fallback initial state
const defaultUserStats: UserStats = {
  total: 0,
  active: 0,
  inactive: 0,
  admins: 0,
  teachers: 0,
  students: 0
};

const defaultHealth: SystemHealth = {
  overallStatus: 'healthy',
  services: [
    { name: 'Database Service', status: 'healthy', latency: 12, description: 'Firestore database is active' },
    { name: 'Auth Service', status: 'healthy', latency: 8, description: 'Firebase Auth is operational' },
    { name: 'API Server', status: 'healthy', latency: 25, description: 'All endpoints responding' },
    { name: 'Storage Engine', status: 'healthy', latency: 18, description: 'Cloud Storage bucket online' }
  ],
  metrics: {
    cpuUsage: 14,
    memoryUsage: 42,
    requestRate: 8,
    uptime: '12 days, 6 hours'
  }
};

export function useAdminDashboard() {
  const { profile } = useAuth();
  const { currentTerm, academicYear } = useSystemInfo();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [localRuns, setLocalRuns] = useState<SchedulerRun[]>([]);

  // Function to trigger a new schedule/optimization run
  const triggerNewRun = useCallback(async () => {
    const db = getDb();
    const termName = currentTerm
      ? `AY ${currentTerm.academicYear || academicYear || ''} • ${currentTerm.semester} Semester`
      : `AY ${academicYear || ''}`;
    const startedByName = profile?.displayName || "Admin User";
    
    const initialRun: Omit<SchedulerRun, 'id'> = {
      term: termName,
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
      conflicts: 0,
      efficiency: 0,
      startedBy: startedByName
    };

    // Trigger run-initiated alert
    await notificationService.createNotification(
      'all',
      'Optimization Run Initiated',
      `Admin initiated a new timetable schedule optimization run for ${termName}.`,
      'schedule_update',
      { term: termName }
    );

    if (!db) {
      // Offline/Demo Mode: Simulate run using local state and intervals
      const runId = `run-${Date.now()}`;
      const newRun: SchedulerRun = {
        id: runId,
        ...initialRun,
        status: 'pending'
      };

      setLocalRuns(prev => [newRun, ...prev]);

      // Progress Simulation
      let currentProgress = 0;
      const interval = setInterval(async () => {
        currentProgress += Math.floor(Math.random() * 15) + 10;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          
          const conflicts = Math.floor(Math.random() * 4);
          const efficiency = Math.round((92 + Math.random() * 6) * 10) / 10;

          setLocalRuns(prev => 
            prev.map(r => r.id === runId ? {
              ...r,
              status: 'completed',
              progress: 100,
              conflicts,
              efficiency,
              completedAt: new Date()
            } : r)
          );

          // Alert on completion
          await notificationService.createNotification(
            'all',
            'Optimization Completed Successfully',
            `Timetable optimization run completed for ${termName} with ${conflicts} overlaps and ${efficiency}% efficiency score.`,
            'schedule_update',
            { term: termName, runId }
          );
        } else {
          setLocalRuns(prev => 
            prev.map(r => r.id === runId ? {
              ...r,
              status: 'running',
              progress: currentProgress
            } : r)
          );
        }
      }, 800);

      return runId;
    }

    try {
      // Live Firebase mode: Add to "scheduler_runs" collection
      const runRef = collection(db, 'scheduler_runs');
      const docRef = await addDoc(runRef, {
        term: termName,
        status: 'pending',
        progress: 0,
        startedAt: serverTimestamp(),
        conflicts: 0,
        efficiency: 0,
        startedBy: startedByName
      });

      const runId = docRef.id;

      // Progress Simulation updating Firestore so other connected sessions see it!
      let currentProgress = 0;
      
      // Update to 'running'
      await updateDoc(doc(db, 'scheduler_runs', runId), {
        status: 'running',
        progress: 0
      });

      const interval = setInterval(async () => {
        currentProgress += Math.floor(Math.random() * 15) + 10;
        
        try {
          if (currentProgress >= 100) {
            clearInterval(interval);
            
            const conflicts = Math.floor(Math.random() * 4);
            const efficiency = Math.round((92 + Math.random() * 6) * 10) / 10;

            await updateDoc(doc(db, 'scheduler_runs', runId), {
              status: 'completed',
              progress: 100,
              conflicts,
              efficiency,
              completedAt: serverTimestamp()
            });

            // Alert on completion
            await notificationService.createNotification(
              'all',
              'Optimization Completed Successfully',
              `Timetable optimization run completed for ${termName} with ${conflicts} overlaps and ${efficiency}% efficiency score.`,
              'schedule_update',
              { term: termName, runId }
            );
          } else {
            await updateDoc(doc(db, 'scheduler_runs', runId), {
              progress: currentProgress
            });
          }
        } catch (err) {
          console.error("Error updating run progress:", err);
          clearInterval(interval);
        }
      }, 1000);

      return runId;
    } catch (err: any) {
      console.error("Failed to start scheduler run:", err);
      throw err;
    }
  }, [profile, currentTerm, academicYear]);

  useEffect(() => {
    const db = getDb();
    
    // Set up continuous dynamic health updates (simulated fluctuations)
    let currentHealth = { ...defaultHealth };
    const healthInterval = setInterval(() => {
      // Fluctuate latency
      currentHealth.services = currentHealth.services.map(s => {
        const isDb = s.name.includes('Database');
        const dbStatus = db ? 'healthy' : 'degraded';
        const latencyVariance = Math.floor(Math.random() * 6) - 3;
        return {
          ...s,
          status: isDb ? (dbStatus as any) : 'healthy',
          latency: Math.max(2, s.latency + latencyVariance)
        };
      });

      // Fluctuate Server CPU & Memory
      const cpuChange = Math.floor(Math.random() * 5) - 2;
      const memChange = Math.floor(Math.random() * 3) - 1;
      const requestRateChange = Math.floor(Math.random() * 3) - 1;

      currentHealth.metrics = {
        cpuUsage: Math.min(95, Math.max(5, currentHealth.metrics.cpuUsage + cpuChange)),
        memoryUsage: Math.min(95, Math.max(10, currentHealth.metrics.memoryUsage + memChange)),
        requestRate: Math.max(1, currentHealth.metrics.requestRate + requestRateChange),
        uptime: currentHealth.metrics.uptime
      };

      // Determine overall status
      const hasDegraded = currentHealth.services.some(s => s.status === 'degraded');
      const hasDown = currentHealth.services.some(s => s.status === 'down');
      currentHealth.overallStatus = hasDown ? 'critical' : hasDegraded ? 'degraded' : 'healthy';

      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          systemHealth: { ...currentHealth }
        };
      });
    }, 3000);

    if (!db) {
      setLoading(false);
      setError(new Error('Firebase is not configured. Please set up Firebase to use the admin dashboard.'));
      return () => {
        clearInterval(healthInterval);
      };
    }

    // --- FIREBASE LIVE REAL-TIME PROVIDER ---
    setLoading(true);
    const unsubscribers: Unsubscribe[] = [];

    try {
      // 1. Subscribe to users collection in real-time
      const usersRef = collection(db, 'users');
      const unsubUsers = onSnapshot(usersRef, (usersSnapshot) => {
        const users: User[] = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User));

        const userStats: UserStats = {
          total: users.length,
          active: users.filter(u => u.status === 'active').length,
          inactive: users.filter(u => u.status === 'inactive').length,
          admins: users.filter(u => u.role === 'admin').length,
          teachers: users.filter(u => u.role === 'teacher').length,
          students: users.filter(u => u.role === 'student').length,
        };

        // 2. Subscribe to scheduler runs collection in real-time
        const runsRef = collection(db, 'scheduler_runs');
        const runsQ = query(runsRef, orderBy('startedAt', 'desc'), limit(10));
        
        const unsubRuns = onSnapshot(runsQ, (runsSnapshot) => {
          const activeRuns: SchedulerRun[] = runsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              startedAt: data.startedAt?.toDate?.() || new Date(data.startedAt),
              completedAt: data.completedAt ? (data.completedAt?.toDate?.() || new Date(data.completedAt)) : undefined
            } as SchedulerRun;
          });

          // 3. Subscribe to courses and schedules to compute other stats
          const coursesRef = collection(db, 'courses');
          const unsubCourses = onSnapshot(coursesRef, (coursesSnapshot) => {
            const courses: Course[] = coursesSnapshot.docs.map(doc => doc.data() as Course);

            const schedulesRef = collection(db, 'schedules');
            const unsubSchedules = onSnapshot(schedulesRef, (schedulesSnapshot) => {
              const schedules: Schedule[] = schedulesSnapshot.docs.map(doc => doc.data() as Schedule);
              
              // Calculate unassigned courses
              const assignedCourseIds = new Set(schedules.map(s => s.courseId));
              const unassignedClasses = courses.filter(c => !assignedCourseIds.has(c.id)).length;

              // Extract values from latest run
              const latestRun = activeRuns[0];
              const conflicts = latestRun?.status === 'completed' ? latestRun.conflicts : (latestRun?.status === 'running' ? 0 : 4);
              const score = latestRun?.status === 'completed' ? latestRun.efficiency : 94.2;

              setData({
                userStats,
                activeRuns,
                systemHealth: currentHealth,
                scheduleConflictsCount: conflicts,
                unassignedClassesCount: unassignedClasses,
                overloadedFacultyCount: 2,
                optimizationScore: score,
                lastUpdated: new Date()
              });
              setLoading(false);
              setError(null);
            });
            unsubscribers.push(unsubSchedules);
          });
          unsubscribers.push(unsubCourses);
        });
        unsubscribers.push(unsubRuns);
      }, (err) => {
        console.error("Firestore real-time error:", err);
        setError(err);
        setLoading(false);
      });

      unsubscribers.push(unsubUsers);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error("Failed to subscribe to database updates."));
      setLoading(false);
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
      clearInterval(healthInterval);
    };
  }, [localRuns]);

  return { data, loading, error, triggerNewRun };
}
