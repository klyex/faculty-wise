'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, Query, QueryConstraint, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { User, Schedule, Course, Room } from '@/lib/types/firestore.types';

export function useFirestoreCollection<T>(
  collectionName: string,
  queryConstraints?: QueryConstraint[],
  realtime: boolean = false
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const db = getDb();
      if (!db) {
        setError(new Error('Firestore not initialized'));
        return;
      }

      const collectionRef = collection(db, collectionName);
      const q = queryConstraints && queryConstraints.length > 0 
        ? query(collectionRef, ...queryConstraints)
        : collectionRef;
      
      const snapshot = await getDocs(q);
      const documents: T[] = [];
      
      snapshot.forEach(doc => {
        documents.push({
          ...(doc.data() as T),
          id: doc.id,
        });
      });
      
      setData(documents);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [collectionName, queryConstraints]);

  useEffect(() => {
    if (realtime) {
      try {
        const db = getDb();
        if (!db) {
          setError(new Error('Firestore not initialized'));
          return;
        }

        const collectionRef = collection(db, collectionName);
        const q = queryConstraints && queryConstraints.length > 0 
          ? query(collectionRef, ...queryConstraints)
          : collectionRef;

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const documents: T[] = [];
          snapshot.forEach(doc => {
            documents.push({
              ...(doc.data() as T),
              id: doc.id,
            });
          });
          setData(documents);
          setError(null);
          setLoading(false);
        }, (err) => {
          setError(err);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setLoading(false);
      }
    } else {
      fetchData();
    }
  }, [collectionName, queryConstraints, realtime, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useUsers(realtime: boolean = false) {
  return useFirestoreCollection<User>('users', undefined, realtime);
}

export function useSchedules(realtime: boolean = false) {
  return useFirestoreCollection<Schedule>('schedules', undefined, realtime);
}

export function useCourses(realtime: boolean = false) {
  return useFirestoreCollection<Course>('courses', undefined, realtime);
}

export function useRooms(realtime: boolean = false) {
  return useFirestoreCollection<Room>('rooms', undefined, realtime);
}

