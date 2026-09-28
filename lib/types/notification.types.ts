export type NotificationType = 'schedule_update' | 'assignment_change' | 'system_alert';

export interface Notification {
  id: string;
  userId: string; // 'all', 'admin', or specific user Uid
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: any; // Date or Firestore Timestamp
  metadata?: {
    scheduleId?: string;
    courseId?: string;
    term?: string;
    runId?: string;
  };
}
