import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Initialize Firebase Admin using service account
// For this demo, we'll use the client SDK approach with environment variables
import axios from 'axios';

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const firestoreEndpoint = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Sample data for collections
const collections = {
  users: [
    {
      id: 'user-001',
      name: 'Dr. John Smith',
      email: 'john.smith@university.edu',
      role: 'teacher',
      department: 'Computer Science',
      createdAt: new Date(),
    },
    {
      id: 'user-002',
      name: 'Prof. Sarah Johnson',
      email: 'sarah.johnson@university.edu',
      role: 'teacher',
      department: 'Mathematics',
      createdAt: new Date(),
    },
    {
      id: 'user-003',
      name: 'Alice Brown',
      email: 'alice.brown@university.edu',
      role: 'student',
      department: 'Computer Science',
      createdAt: new Date(),
    },
  ],
  schedules: [
    {
      id: 'schedule-001',
      courseId: 'CS-101',
      teacherId: 'user-001',
      roomId: 'room-001',
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '10:30',
      semester: 'Spring 2026',
    },
    {
      id: 'schedule-002',
      courseId: 'MATH-101',
      teacherId: 'user-002',
      roomId: 'room-002',
      dayOfWeek: 'Tuesday',
      startTime: '10:00',
      endTime: '11:30',
      semester: 'Spring 2026',
    },
  ],
  courses: [
    {
      id: 'CS-101',
      name: 'Introduction to Computer Science',
      department: 'Computer Science',
      credits: 3,
      capacity: 30,
    },
    {
      id: 'MATH-101',
      name: 'Calculus I',
      department: 'Mathematics',
      credits: 4,
      capacity: 35,
    },
  ],
  rooms: [
    {
      id: 'room-001',
      name: 'Lab 101',
      capacity: 30,
      type: 'laboratory',
      building: 'Science Building',
    },
    {
      id: 'room-002',
      name: 'Lecture Hall A',
      capacity: 100,
      type: 'lecture',
      building: 'Main Building',
    },
  ],
};

async function insertData() {
  console.log('🔄 Starting Firebase Firestore data insertion...\n');

  for (const [collectionName, documents] of Object.entries(collections)) {
    console.log(`📝 Inserting into collection: ${collectionName}`);
    
    for (const doc of documents) {
      const docId = doc.id || Math.random().toString(36).substr(2, 9);
      const url = `${firestoreEndpoint}/${collectionName}/${docId}?key=${API_KEY}`;
      
      try {
        const response = await axios.patch(
          url,
          {
            fields: Object.entries(doc).reduce((acc, [key, value]: [string, any]) => {
              if (key === 'id') return acc;
              
              let fieldValue: any = {};
              if (typeof value === 'string') {
                fieldValue = { stringValue: value };
              } else if (typeof value === 'number') {
                fieldValue = { integerValue: value };
              } else if (typeof value === 'boolean') {
                fieldValue = { booleanValue: value };
              } else if (value instanceof Date) {
                fieldValue = { timestampValue: value.toISOString() };
              }
              
              acc[key] = fieldValue;
              return acc;
            }, {} as any),
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        console.log(`   ✅ ${collectionName}/${docId}`);
      } catch (error: any) {
        console.error(`   ❌ Error inserting ${collectionName}/${docId}:`, error.response?.data || error.message);
      }
    }
    console.log();
  }

  console.log('✨ Data insertion complete! Check your Firebase Console to see the collections.');
}

insertData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
