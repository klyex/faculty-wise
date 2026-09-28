import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  onSnapshot,
  where,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { Department } from "@/lib/types/department.types";
import { User } from "@/lib/types/firestore.types";
import { auditService } from "@/features/audit/audit.service";

export const departmentsService = {
  subscribeDepartments(
    onUpdate: (departments: Department[]) => void
  ): () => void {
    const db = getDb();
    const departmentsRef = collection(db, "departments");
    const q = query(departmentsRef, orderBy("code", "asc"));

    return onSnapshot(q, (querySnapshot) => {
      const departments = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          code: data.code || "",
          name: data.name || "",
          institute: data.institute || "",
          chairUid: data.chairUid || null,
          createdAt: data.createdAt,
        } as Department;
      });
      onUpdate(departments);
    });
  },

  async createDepartment(
    data: Omit<Department, "id">,
    performingUser?: User
  ): Promise<Department> {
    const db = getDb();
    const departmentsRef = collection(db, "departments");
    const docRef = await addDoc(departmentsRef, {
      ...data,
      createdAt: serverTimestamp(),
    });

    const newDepartment: Department = {
      id: docRef.id,
      ...data,
    };

    if (performingUser) {
      await auditService.logAction({
        action: "SETTINGS_UPDATE",
        targetId: docRef.id,
        targetType: "department",
        details: { code: data.code, name: data.name },
        performedBy: performingUser,
      });
    }

    return newDepartment;
  },

  async updateDepartment(
    departmentId: string,
    data: Partial<Department>,
    performingUser?: User
  ): Promise<void> {
    const db = getDb();
    const departmentRef = doc(db, "departments", departmentId);
    // Filter out undefined values
    const updateData = { ...data };
    Object.keys(updateData).forEach(
      (key) => updateData[key as keyof typeof updateData] === undefined && delete updateData[key as keyof typeof updateData]
    );
    await updateDoc(departmentRef, updateData);

    if (performingUser) {
      await auditService.logAction({
        action: "SETTINGS_UPDATE",
        targetId: departmentId,
        targetType: "department",
        details: { code: data.code, name: data.name },
        performedBy: performingUser,
      });
    }
  },

  async deleteDepartment(
    departmentId: string,
    performingUser?: User
  ): Promise<void> {
    const db = getDb();
    const departmentRef = doc(db, "departments", departmentId);
    await deleteDoc(departmentRef);

    if (performingUser) {
      await auditService.logAction({
        action: "SETTINGS_UPDATE",
        targetId: departmentId,
        targetType: "department",
        details: { action: "delete" },
        performedBy: performingUser,
      });
    }
  },

  async getTeachers(): Promise<User[]> {
    const db = getDb();
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("role", "==", "teacher"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
  },
};
