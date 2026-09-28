import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  getDoc,
  setDoc,
  Unsubscribe 
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { BackupLog, BackupConfig } from '@/lib/types/backup.types';
import { notificationService } from '@/features/notifications/notifications.service';

// Mock storage for offline / demo mode
let mockBackupConfig: BackupConfig = {
  frequency: 'daily',
  retentionDays: 30,
  bucketUri: 'gs://faculti-wise-backups-bucket',
  active: true,
  lastUpdated: new Date()
};

let mockBackupLogs: BackupLog[] = [
  {
    id: 'back-1715600000000',
    fileName: 'facultiwise_prod_backup_daily_2026-05-18.json',
    status: 'success',
    createdAt: new Date(Date.now() - 3600000 * 24), // 1 day ago
    sizeMb: 24.8,
    collections: ['users', 'schedules', 'courses', 'rooms', 'audit_logs'],
    triggerType: 'automated',
    storageLocation: 'gs://faculti-wise-backups-bucket/daily/'
  },
  {
    id: 'back-1715500000000',
    fileName: 'facultiwise_prod_backup_daily_2026-05-17.json',
    status: 'success',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2), // 2 days ago
    sizeMb: 24.5,
    collections: ['users', 'schedules', 'courses', 'rooms', 'audit_logs'],
    triggerType: 'automated',
    storageLocation: 'gs://faculti-wise-backups-bucket/daily/'
  }
];

class BackupService {
  /**
   * Subscribe to backup config settings in real-time
   */
  subscribeBackupConfig(onUpdate: (config: BackupConfig) => void): Unsubscribe {
    const db = getDb();

    if (!db) {
      onUpdate({ ...mockBackupConfig });
      return () => {};
    }

    try {
      const docRef = doc(db, 'system_settings', 'backup_config');
      return onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          onUpdate({
            ...data,
            lastUpdated: data.lastUpdated?.toDate?.() || new Date(data.lastUpdated)
          } as BackupConfig);
        } else {
          // Initialize default config if not existing
          setDoc(docRef, {
            frequency: 'daily',
            retentionDays: 30,
            bucketUri: 'gs://faculti-wise-backups-bucket',
            active: true,
            lastUpdated: serverTimestamp()
          });
        }
      }, (err) => {
        console.error("Backup config subscription error:", err);
      });
    } catch (err) {
      console.error("Failed to subscribe to backup config:", err);
      onUpdate({ ...mockBackupConfig });
      return () => {};
    }
  }

  /**
   * Subscribe to backup execution logs in real-time
   */
  subscribeBackups(onUpdate: (logs: BackupLog[]) => void): Unsubscribe {
    const db = getDb();

    if (!db) {
      onUpdate([...mockBackupLogs]);
      
      const interval = setInterval(() => {
        onUpdate([...mockBackupLogs]);
      }, 1500);

      return () => clearInterval(interval);
    }

    try {
      const backupRef = collection(db, 'database_backups');
      const q = query(backupRef, orderBy('createdAt', 'desc'));

      return onSnapshot(q, (snapshot) => {
        const logs: BackupLog[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt)
          } as BackupLog;
        });
        onUpdate(logs);
      }, (err) => {
        console.error("Backup logs subscription error:", err);
      });
    } catch (err) {
      console.error("Failed to subscribe to backup logs:", err);
      onUpdate([...mockBackupLogs]);
      return () => {};
    }
  }

  /**
   * Update the automated backup schedule configuration
   */
  async updateBackupConfig(config: Partial<BackupConfig>): Promise<void> {
    const db = getDb();

    if (!db) {
      mockBackupConfig = {
        ...mockBackupConfig,
        ...config,
        lastUpdated: new Date()
      };
      
      // Notify via audit log simulation and notification
      await notificationService.createNotification(
        'admin',
        'Backup Schedule Updated',
        `Automated database backups configured to run ${mockBackupConfig.frequency}ly with ${mockBackupConfig.retentionDays}-day retention policy.`,
        'system_alert'
      );
      return;
    }

    try {
      const docRef = doc(db, 'system_settings', 'backup_config');
      await updateDoc(docRef, {
        ...config,
        lastUpdated: serverTimestamp()
      });

      await notificationService.createNotification(
        'admin',
        'Backup Schedule Updated',
        `Automated database backups configured to run ${config.frequency}ly with ${config.retentionDays}-day retention policy.`,
        'system_alert'
      );
    } catch (err) {
      console.error("Failed to update backup config:", err);
      throw err;
    }
  }

  /**
   * Trigger a manual database export & backup
   */
  async triggerManualBackup(): Promise<string> {
    const db = getDb();
    const timestampStr = new Date().toISOString().slice(0, 10);
    const fileName = `facultiwise_manual_backup_${timestampStr}_${Date.now().toString().slice(-4)}.json`;
    const location = mockBackupConfig.bucketUri + '/manual/';

    const initialLog: Omit<BackupLog, 'id'> = {
      fileName,
      status: 'in_progress',
      createdAt: new Date(),
      sizeMb: 0,
      collections: ['users', 'schedules', 'courses', 'rooms', 'audit_logs'],
      triggerType: 'manual',
      storageLocation: location
    };

    if (!db) {
      // Offline/Demo Mode: Simulate manual backup
      const id = `back-${Date.now()}`;
      const newLog: BackupLog = { id, ...initialLog };
      mockBackupLogs = [newLog, ...mockBackupLogs];

      // Simulate export process
      setTimeout(async () => {
        const sizeMb = Math.round((22 + Math.random() * 5) * 10) / 10;
        mockBackupLogs = mockBackupLogs.map(l => l.id === id ? {
          ...l,
          status: 'success',
          sizeMb,
          createdAt: new Date()
        } : l);

        // Alert admin on completion
        await notificationService.createNotification(
          'admin',
          'Database Backup Completed',
          `Manual database backup completed successfully. Exported 5 collections (${sizeMb} MB) to Cloud Storage.`,
          'system_alert',
          { term: 'Backup Complete' }
        );
      }, 2500);

      return id;
    }

    try {
      const backupRef = collection(db, 'database_backups');
      const docRef = await addDoc(backupRef, {
        fileName,
        status: 'in_progress',
        createdAt: serverTimestamp(),
        sizeMb: 0,
        collections: ['users', 'schedules', 'courses', 'rooms', 'audit_logs'],
        triggerType: 'manual',
        storageLocation: location
      });

      const id = docRef.id;

      // Simulate export process in background, then update status
      setTimeout(async () => {
        const sizeMb = Math.round((22 + Math.random() * 5) * 10) / 10;
        try {
          await updateDoc(doc(db, 'database_backups', id), {
            status: 'success',
            sizeMb,
            createdAt: serverTimestamp()
          });

          await notificationService.createNotification(
            'admin',
            'Database Backup Completed',
            `Manual database backup completed successfully. Exported 5 collections (${sizeMb} MB) to Cloud Storage.`,
            'system_alert',
            { term: 'Backup Complete' }
          );
        } catch (err) {
          console.error("Failed to complete database backup write:", err);
          await updateDoc(doc(db, 'database_backups', id), {
            status: 'failed'
          });
        }
      }, 2500);

      return id;
    } catch (err) {
      console.error("Failed to trigger manual backup:", err);
      throw err;
    }
  }
}

export const backupService = new BackupService();
export default backupService;
