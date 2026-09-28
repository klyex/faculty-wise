export interface BackupLog {
  id: string;
  fileName: string;
  status: 'success' | 'failed' | 'in_progress';
  createdAt: any; // Date or Firestore Timestamp
  sizeMb: number; // in MB
  collections: string[];
  triggerType: 'automated' | 'manual';
  storageLocation: string;
}

export interface BackupConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  bucketUri: string;
  active: boolean;
  lastUpdated?: any;
}
