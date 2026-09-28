"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  serverTimestamp, 
  onSnapshot 
} from 'firebase/firestore';
import { getAuthInstance, getDb } from '@/lib/firebase';
import { User as UserProfile } from '@/lib/types/firestore.types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  login: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuthInstance();
    const db = getDb();

    if (!auth || !db) {
      setLoading(false);
      return;
    }

    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (user && db) {
        const userDocRef = doc(db, 'users', user.uid);
        
        unsubscribeProfile = onSnapshot(userDocRef, async (userDoc) => {
          if (userDoc.exists()) {
            const userData = { id: userDoc.id, uid: userDoc.id, ...userDoc.data() } as any;
            if (!userData.displayName) {
              userData.displayName = user.displayName || user.email?.split('@')[0] || 'User';
            }
            setProfile(userData);
            setLoading(false);
          } else {
            const displayNameFallback = user.displayName || user.email?.split('@')[0] || 'User';
            const newProfile: UserProfile = {
              id: user.uid,
              email: user.email || '',
              displayName: displayNameFallback,
              photoURL: user.photoURL,
              role: 'student',
              status: 'active',
              departmentId: null,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            try {
              await setDoc(userDocRef, newProfile);
            } catch (err) {
              console.error("Error creating profile:", err);
              setLoading(false);
            }
          }
        }, (err) => {
          console.error("Profile subscription error:", err);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const auth = getAuthInstance();
    if (!auth) {
      throw new Error('Firebase is not configured. Please set up Firebase authentication.');
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    const auth = getAuthInstance();
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (error) {
        console.error("Error signing out:", error);
      }
    }
    setUser(null);
    setProfile(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, login }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
