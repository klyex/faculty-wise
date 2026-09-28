import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  getDocs,
  writeBatch,
  Unsubscribe 
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { ErrorLog, ErrorSeverity, ErrorStatus } from '@/lib/types/error.types';

// Mock logs store for sandbox / offline mode
let mockErrorLogs: ErrorLog[] = [
  {
    id: 'err-1',
    message: 'TypeError: Cannot read properties of undefined (reading \'scheduleOfferings\')',
    stack: 'TypeError: Cannot read properties of undefined (reading \'scheduleOfferings\')\n  at CourseOfferingsView.tsx:114:24\n  at commitHookEffectListMount (react-dom.development.js:23150:26)',
    severity: 'error',
    status: 'unresolved',
    createdAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
    url: 'http://localhost:3000/dashboard/course-offerings',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    componentName: 'CourseOfferingsView',
    metadata: { route: '/dashboard/course-offerings', role: 'admin' }
  },
  {
    id: 'err-2',
    message: 'FirebaseError: [code=resource-exhausted]: Quota exceeded for firestore.googleapis.com',
    stack: 'FirebaseError: Quota exceeded for firestore.googleapis.com\n  at FirestoreClient.getDocs (firestore.js:342:12)\n  at useAdminDashboard.ts:285:31',
    severity: 'critical',
    status: 'unresolved',
    createdAt: new Date(Date.now() - 3600000 * 5), // 5 hours ago
    url: 'http://localhost:3000/dashboard',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0 Safari/537.36',
    componentName: 'useAdminDashboard',
    metadata: { route: '/dashboard', role: 'admin' }
  },
  {
    id: 'err-3',
    message: 'Warning: Failed to load schedule constraints: Room RM-302 capacity exceeded.',
    severity: 'warning',
    status: 'resolved',
    createdAt: new Date(Date.now() - 3600000 * 24), // 1 day ago
    url: 'http://localhost:3000/dashboard',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    componentName: 'SchedulerRunEngine',
    resolvedBy: 'Super Admin',
    resolvedAt: new Date(Date.now() - 3600000 * 23),
    metadata: { route: '/dashboard', role: 'admin', activeTerm: 'AY 2025-2026' }
  }
];

class ErrorMonitoringService {
  /**
   * Log an exception dynamically and stream to Firestore or local mock array
   */
  async captureException(
    error: Error | string | unknown,
    severity: ErrorSeverity = 'error',
    componentName?: string,
    metadata?: ErrorLog['metadata']
  ): Promise<string> {
    const db = getDb();
    
    // Extract message & stack
    let message = 'An unknown system exception occurred';
    let stack = '';
    
    if (error instanceof Error) {
      message = error.message;
      stack = error.stack || '';
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object') {
      message = (error as any).message || JSON.stringify(error);
    }

    const url = typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000';
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'Server Edge Runtime';

    const errorRecord: Omit<ErrorLog, 'id'> = {
      message,
      stack,
      severity,
      status: 'unresolved',
      createdAt: new Date(),
      url,
      userAgent,
      componentName: componentName || 'UnknownComponent',
      metadata: metadata || {}
    };

    console.warn(`[SENTRY TELEMETRY CAPTURED - ${severity.toUpperCase()}]: ${message}`, errorRecord);

    if (!db) {
      // Sandbox Offline Mode: Append locally
      const id = `err-${Date.now()}`;
      const newRecord: ErrorLog = { id, ...errorRecord };
      mockErrorLogs = [newRecord, ...mockErrorLogs];
      return id;
    }

    try {
      const errorRef = collection(db, 'error_logs');
      const docRef = await addDoc(errorRef, {
        ...errorRecord,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (err) {
      console.error("Failed to write error to Firestore telemetry:", err);
      // Fallback locally
      const id = `err-${Date.now()}`;
      mockErrorLogs = [ { id, ...errorRecord }, ...mockErrorLogs ];
      return id;
    }
  }

  /**
   * Subscribe to live Sentry error telemetry logs in real-time
   */
  subscribeErrorLogs(onUpdate: (logs: ErrorLog[]) => void): Unsubscribe {
    const db = getDb();

    if (!db) {
      onUpdate([...mockErrorLogs]);
      
      const interval = setInterval(() => {
        onUpdate([...mockErrorLogs]);
      }, 1500);

      return () => clearInterval(interval);
    }

    try {
      const errorRef = collection(db, 'error_logs');
      const q = query(errorRef, orderBy('createdAt', 'desc'));

      return onSnapshot(q, (snapshot) => {
        const logs: ErrorLog[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
            resolvedAt: data.resolvedAt ? (data.resolvedAt?.toDate?.() || new Date(data.resolvedAt)) : undefined
          } as ErrorLog;
        });
        onUpdate(logs);
      }, (err) => {
        console.error("Error logs subscription error:", err);
      });
    } catch (err) {
      console.error("Failed to subscribe to error logs telemetry:", err);
      onUpdate([...mockErrorLogs]);
      return () => {};
    }
  }

  /**
   * Resolve a pending unresolved error ticket
   */
  async resolveError(errorId: string, resolvedBy: string = 'Super Admin'): Promise<void> {
    const db = getDb();

    if (!db) {
      mockErrorLogs = mockErrorLogs.map(err => 
        err.id === errorId ? { 
          ...err, 
          status: 'resolved' as ErrorStatus,
          resolvedBy,
          resolvedAt: new Date()
        } : err
      );
      return;
    }

    try {
      const docRef = doc(db, 'error_logs', errorId);
      await updateDoc(docRef, {
        status: 'resolved',
        resolvedBy,
        resolvedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to resolve error ticket:", err);
      throw err;
    }
  }

  /**
   * Ignore a pending unresolved error ticket
   */
  async ignoreError(errorId: string): Promise<void> {
    const db = getDb();

    if (!db) {
      mockErrorLogs = mockErrorLogs.map(err => 
        err.id === errorId ? { ...err, status: 'ignored' as ErrorStatus } : err
      );
      return;
    }

    try {
      const docRef = doc(db, 'error_logs', errorId);
      await updateDoc(docRef, {
        status: 'ignored'
      });
    } catch (err) {
      console.error("Failed to ignore error ticket:", err);
      throw err;
    }
  }

  /**
   * Clear all error logs for testing purposes
   */
  async clearAllErrors(): Promise<void> {
    const db = getDb();

    if (!db) {
      mockErrorLogs = [];
      return;
    }

    try {
      const errorRef = collection(db, 'error_logs');
      const snapshot = await getDocs(errorRef);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (err) {
      console.error("Failed to clear error logs:", err);
      throw err;
    }
  }
}

export const errorMonitoringService = new ErrorMonitoringService();
export default errorMonitoringService;
