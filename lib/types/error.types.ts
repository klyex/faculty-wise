export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';
export type ErrorStatus = 'unresolved' | 'resolved' | 'ignored';

export interface ErrorLog {
  id: string;
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  status: ErrorStatus;
  createdAt: any; // Date or Firestore Timestamp
  url: string;
  userAgent?: string;
  componentName?: string;
  resolvedBy?: string;
  resolvedAt?: any;
  metadata?: {
    userId?: string;
    role?: string;
    activeTerm?: string;
    route?: string;
  };
}

export interface ErrorStats {
  totalCount: number;
  unresolvedCount: number;
  criticalCount: number;
  byRoute: Record<string, number>;
  bySeverity: Record<ErrorSeverity, number>;
}
