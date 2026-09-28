export interface TeacherStats {
  totalAssignedUnits: number;
  targetUnits: number;
  teachingHoursPerWeek: number;
  scheduleStatus: 'finalized' | 'pending' | 'draft';
  availabilityStatus: 'submitted' | 'pending' | 'expired';
  lastAvailabilityUpdate: Date;
}

export interface UpcomingSession {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  date: Date;
  room?: string;
  building?: string;
  isOnline: boolean;
  minutesUntilStart?: number;
}

export interface TeacherCourse {
  id: string;
  code: string;
  name: string;
  units: number;
  sections: number;
  sessionDays: string[];
  studentCount: number;
  status: 'active' | 'completed' | 'pending';
}

export interface TeacherDashboardData {
  stats: TeacherStats;
  upcomingSession: UpcomingSession | null;
  courses: TeacherCourse[];
  lastUpdated: Date;
}
