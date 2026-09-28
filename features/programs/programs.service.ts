import {
  collection,
  doc,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  onSnapshot,
  where,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { Program } from "@/lib/types/department-schedule.types";
import { User } from "@/lib/types/firestore.types";
import { auditService } from "@/features/audit/audit.service";

export const programsService = {
  subscribePrograms(
    onUpdate: (programs: Program[]) => void
  ): () => void {
    const db = getDb();
    const programsRef = collection(db, "programs");
    const q = query(programsRef, orderBy("code", "asc"));

    return onSnapshot(q, (querySnapshot) => {
      const programs = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          code: data.code || "",
          name: data.name || "",
          departmentId: data.departmentId || "",
        } as Program;
      });
      onUpdate(programs);
    });
  },

  subscribeProgramsByDepartment(
    departmentId: string,
    onUpdate: (programs: Program[]) => void
  ): () => void {
    const db = getDb();
    const programsRef = collection(db, "programs");
    const q = query(
      programsRef,
      where("departmentId", "==", departmentId),
      orderBy("code", "asc")
    );

    return onSnapshot(q, (querySnapshot) => {
      const programs = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          code: data.code || "",
          name: data.name || "",
          departmentId: data.departmentId || "",
        } as Program;
      });
      onUpdate(programs);
    });
  },

  async createProgram(
    data: Omit<Program, "id">,
    performingUser?: User
  ): Promise<Program> {
    const db = getDb();
    const programsRef = collection(db, "programs");
    const docRef = await addDoc(programsRef, {
      ...data,
      createdAt: serverTimestamp(),
    });

    const newProgram: Program = {
      id: docRef.id,
      ...data,
    };

    if (performingUser) {
      await auditService.logAction({
        action: "SETTINGS_UPDATE",
        targetId: docRef.id,
        targetType: "program",
        details: { code: data.code, name: data.name, departmentId: data.departmentId },
        performedBy: performingUser,
      });
    }

    return newProgram;
  },

  async updateProgram(
    programId: string,
    data: Partial<Program>,
    performingUser?: User
  ): Promise<void> {
    const db = getDb();
    const programRef = doc(db, "programs", programId);
    // Filter out undefined values
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    Object.keys(updateData).forEach(
      (key) => updateData[key as keyof typeof updateData] === undefined && delete updateData[key as keyof typeof updateData]
    );
    await updateDoc(programRef, updateData);

    if (performingUser) {
      await auditService.logAction({
        action: "SETTINGS_UPDATE",
        targetId: programId,
        targetType: "program",
        details: data,
        performedBy: performingUser,
      });
    }
  },

  async deleteProgram(
    programId: string,
    performingUser?: User
  ): Promise<void> {
    const db = getDb();
    const programRef = doc(db, "programs", programId);
    await deleteDoc(programRef);

    if (performingUser) {
      await auditService.logAction({
        action: "SETTINGS_UPDATE",
        targetId: programId,
        targetType: "program",
        details: { action: "deleted" },
        performedBy: performingUser,
      });
    }
  },
};
