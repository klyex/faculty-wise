import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "undefined";

// Initialize Firebase only if config is valid to prevent runtime crashes
const app = isConfigValid ? initializeApp(firebaseConfig) : null;

// Lazy initialization of services to avoid prerendering errors
let _db: any = null;
let _auth: any = null;

export const getDb = () => {
  if (!_db && app) {
    _db = getFirestore(app);
  }
  return _db;
};

export const getAuthInstance = () => {
  if (!_auth && app) {
    _auth = getAuth(app);
  }
  return _auth;
};

// For backward compatibility while we refactor, but it's better to use the getters
export const db = typeof window !== "undefined" ? (app ? getDb() : null) : null;
export const auth = typeof window !== "undefined" ? (app ? getAuthInstance() : null as any) : null as any;

if (!isConfigValid) {
  console.warn("Firebase API key is missing. Authentication and Firestore will be disabled.");
}

export default app;
