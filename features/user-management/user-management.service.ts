import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  deleteUser,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp,
  getDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  where
} from "firebase/firestore";
import { initializeApp, getApp, getApps } from "firebase/app";
import { getDb } from "@/lib/firebase";
import { User } from "@/lib/types/firestore.types";
import { auditService } from "../audit/audit.service";

// Secondary Firebase app for administrative user creation
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const getSecondaryAuth = () => {
  const secondaryAppName = "AdminUserManagement";
  const app = getApps().find(a => a.name === secondaryAppName) 
    || initializeApp(firebaseConfig, secondaryAppName);
  return getAuth(app);
};

export const userManagementService = {
  async fetchUsers(): Promise<User[]> {
    const db = getDb();
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        displayName: data.displayName || data.name || "Unknown User",
        email: data.email || "",
      } as User;
    });
  },

  subscribeUsers(onUpdate: (users: User[]) => void): () => void {
    const db = getDb();
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("createdAt", "desc"));
    
    return onSnapshot(q, (querySnapshot) => {
      const users = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          displayName: data.displayName || data.name || "Unknown User",
          email: data.email || "",
        } as User;
      });
      onUpdate(users);
    });
  },

  async createManagedUser(data: {
    email: string;
    displayName: string;
    role: 'admin' | 'teacher' | 'student' | 'program_head' | 'dean' | 'vpaa';
    password: string;
    departmentId?: string | null;
  }, performingUser?: User): Promise<User> {
    // 1. Validation
    if (!data.displayName || data.displayName.trim() === "") {
      throw new Error("Display name is required.");
    }

    if (!data.email || !data.email.includes("@")) {
      throw new Error("A valid email address is required.");
    }

    const db = getDb();
    const secondaryAuth = getSecondaryAuth();
    
    try {
      // 2. Create account in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        data.email, 
        data.password
      );
      const fbUser = userCredential.user;

      // 3. Set display name in Auth profile
      await updateProfile(fbUser, { displayName: data.displayName });

      // 4. Create profile in Firestore
      const newUser: User = {
        id: fbUser.uid,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        status: "active",
        departmentId: data.departmentId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", fbUser.uid), newUser);

      // 5. Sign out from secondary auth
      await secondaryAuth.signOut();

      // 6. Audit Log
      if (performingUser) {
        await auditService.logAction({
          action: 'USER_CREATE',
          targetId: fbUser.uid,
          targetType: 'user',
          details: { role: newUser.role, email: newUser.email },
          performedBy: performingUser
        });
      }

      return newUser;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("This email is already registered.");
      }
      if (error.code === 'auth/weak-password') {
        throw new Error("The password is too weak.");
      }
      throw error;
    }
  },

  async deleteUser(userId: string, performingUser?: User): Promise<void> {
    const db = getDb();
    await deleteDoc(doc(db, "users", userId));

    if (performingUser) {
      await auditService.logAction({
        action: 'USER_DELETE',
        targetId: userId,
        targetType: 'user',
        details: { },
        performedBy: performingUser
      });
    }
  },

  async updateUserStatus(userId: string, status: 'active' | 'inactive', performingUser?: User): Promise<void> {
    const db = getDb();
    await updateDoc(doc(db, "users", userId), {
      status,
      updatedAt: serverTimestamp(),
    });

    if (performingUser) {
      await auditService.logAction({
        action: 'USER_STATUS_CHANGE',
        targetId: userId,
        targetType: 'user',
        details: { status },
        performedBy: performingUser
      });
    }
  },

  async updateUserRole(userId: string, role: 'admin' | 'teacher' | 'student', performingUser?: User): Promise<void> {
    const db = getDb();
    await updateDoc(doc(db, "users", userId), {
      role,
      updatedAt: serverTimestamp(),
    });

    if (performingUser) {
      await auditService.logAction({
        action: 'USER_ROLE_CHANGE',
        targetId: userId,
        targetType: 'user',
        details: { role },
        performedBy: performingUser
      });
    }
  },

  async updateUserDepartment(userId: string, departmentId: string | null, performingUser?: User): Promise<void> {
    const db = getDb();
    // Firestore Mode: Update user document
    await updateDoc(doc(db, "users", userId), {
      departmentId,
      updatedAt: serverTimestamp(),
    });

    // If teacher role, also update or sync in the teachers collection
    try {
      const teachersRef = collection(db, "teachers");
      const q = query(teachersRef, where("uid", "==", userId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const teacherDocRef = doc(db, "teachers", querySnapshot.docs[0].id);
        await updateDoc(teacherDocRef, {
          departmentId: departmentId || "",
        });
      }
    } catch (err) {
      console.error("Error updating teacher collection department:", err);
    }

    if (performingUser) {
      await auditService.logAction({
        action: 'SETTINGS_UPDATE',
        targetId: userId,
        targetType: 'user',
        details: { departmentId },
        performedBy: performingUser
      });
    }
  },

  async activateUserPassword(email: string, token: string, newPassword?: string): Promise<void> {
    const db = getDb();
    // Firestore mode
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const snap = await getDocs(q);
    if (snap.empty) {
      throw new Error("No user found with the provided email.");
    }
    const userDoc = snap.docs[0];
    const userData = userDoc.data();
    if (userData.activationToken !== token) {
      throw new Error("Invalid activation token.");
    }

    await updateDoc(doc(db, "users", userDoc.id), {
      status: "active",
      activationToken: null,
      updatedAt: serverTimestamp()
    });
  }
};

