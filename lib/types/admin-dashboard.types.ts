export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  teachers: number;
  students: number;
}

export interface SchedulerRun {
  id: string;
  term: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0 to 100
  startedAt: any; // Date or Firestore Timestamp
  completedAt?: any; // Date or Firestore Timestamp
  conflicts: number;
  efficiency: number; // e.g. 94.2
  startedBy: string;
}

export interface HealthService {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number; // in ms
  description: string;
}

export interface ServerMetrics {
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  requestRate: number; // req/s
  uptime: string; // e.g., "15 days, 4 hours"
}

export interface SystemHealth {
  overallStatus: 'healthy' | 'degraded' | 'critical';
  services: HealthService[];
  metrics: ServerMetrics;
}

export interface AdminDashboardData {
  userStats: UserStats;
  activeRuns: SchedulerRun[];
  systemHealth: SystemHealth;
  scheduleConflictsCount: number;
  unassignedClassesCount: number;
  overloadedFacultyCount: number;
  optimizationScore: number;
  lastUpdated: Date;
}
