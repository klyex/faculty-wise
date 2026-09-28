import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  writeBatch,
  getDocs,
  Unsubscribe 
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Notification, NotificationType } from '@/lib/types/notification.types';

// In-memory mock store for demo/sandbox offline mode
let mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'all',
    title: 'Semester Schedule Released',
    message: 'The official schedule for AY 2025-2026 First Semester has been published and is now active.',
    type: 'schedule_update',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
    metadata: { term: 'AY 2025-2026' }
  },
  {
    id: 'notif-2',
    userId: 'all',
    title: 'System Optimization Live',
    message: 'Admin triggered a new schedule optimization run. System is running at 94.2% efficiency.',
    type: 'system_alert',
    read: true,
    createdAt: new Date(Date.now() - 3600000 * 24), // 1 day ago
  }
];

class NotificationService {
  /**
   * Subscribe to notifications in real-time
   */
  subscribeNotifications(userId: string, onUpdate: (notifications: Notification[]) => void): Unsubscribe {
    const db = getDb();
    
    if (!db) {
      // Sandbox Offline Mode: Poll or trigger immediate callback, then set up interval
      onUpdate([...mockNotifications]);
      
      const interval = setInterval(() => {
        onUpdate([...mockNotifications]);
      }, 1500);

      return () => clearInterval(interval);
    }

    try {
      const notifRef = collection(db, 'notifications');
      // Query notifications that are for 'all' or specific user ID.
      // We sort in-memory to prevent requiring a Firestore composite index.
      const q = query(
        notifRef,
        where('userId', 'in', ['all', userId])
      );

      return onSnapshot(q, (snapshot) => {
        const notifications: Notification[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || (data.createdAt ? new Date(data.createdAt) : new Date())
          } as Notification;
        });
        
        // Sort in-memory by createdAt descending
        notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        onUpdate(notifications);
      }, (err) => {
        console.error("Error subscribing to notifications (falling back to mock):", err);
        onUpdate([...mockNotifications]);
      });
    } catch (err) {
      console.error("Failed to set up notifications listener:", err);
      onUpdate([...mockNotifications]);
      return () => {};
    }
  }

  /**
   * Send a new notification to a user, role, or 'all'
   */
  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    metadata?: Notification['metadata']
  ): Promise<string> {
    const db = getDb();

    if (!db) {
      const newNotif: Notification = {
        id: `notif-${Date.now()}`,
        userId,
        title,
        message,
        type,
        read: false,
        createdAt: new Date(),
        metadata
      };
      mockNotifications = [newNotif, ...mockNotifications];
      return newNotif.id;
    }

    try {
      const notifRef = collection(db, 'notifications');
      const docRef = await addDoc(notifRef, {
        userId,
        title,
        message,
        type,
        read: false,
        createdAt: serverTimestamp(),
        metadata: metadata || {}
      });
      return docRef.id;
    } catch (err) {
      console.error("Failed to create notification:", err);
      throw err;
    }
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const db = getDb();

    if (!db) {
      mockNotifications = mockNotifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      return;
    }

    try {
      const docRef = doc(db, 'notifications', notificationId);
      await updateDoc(docRef, { read: true });
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      throw err;
    }
  }

  /**
   * Mark all notifications for a user as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    const db = getDb();

    if (!db) {
      mockNotifications = mockNotifications.map(n => 
        (n.userId === 'all' || n.userId === userId) ? { ...n, read: true } : n
      );
      return;
    }

    try {
      const notifRef = collection(db, 'notifications');
      const q = query(notifRef, where('userId', 'in', ['all', userId]), where('read', '==', false));
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      snapshot.docs.forEach((document) => {
        batch.update(doc(db, 'notifications', document.id), { read: true });
      });

      await batch.commit();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      throw err;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
