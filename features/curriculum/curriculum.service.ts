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
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { Curriculum } from "@/lib/types/curriculum.types";
import { User } from "@/lib/types/firestore.types";
import { auditService } from "@/features/audit/audit.service";

export const curriculumService = {
  subscribeAll(onUpdate: (curricula: Curriculum[]) => void): () => void {
    const db = getDb();
    const ref = collection(db, "curricula");
    const q = query(ref, orderBy("name", "asc"));

    return onSnapshot(q, (snapshot) => {
      const curricula = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Curriculum[];
      onUpdate(curricula);
    });
  },

  async create(
    data: Omit<Curriculum, "id" | "createdAt">,
    performingUser?: User
  ): Promise<Curriculum> {
    const db = getDb();
    const ref = collection(db, "curricula");
    const docRef = await addDoc(ref, {
      ...data,
      createdAt: serverTimestamp(),
    });

    const newItem: Curriculum = { id: docRef.id, ...data };

    if (performingUser) {
      await auditService.logAction({
        action: "SETTINGS_UPDATE",
        targetId: docRef.id,
        targetType: "curriculum",
        details: { name: data.name, programId: data.programId },
        performedBy: performingUser,
      });
    }

    return newItem;
  },

  async update(
    id: string,
    data: Partial<Curriculum>,
    performingUser?: User
  ): Promise<void> {
    const db = getDb();
    const ref = doc(db, "curricula", id);
    const updateData = { ...data };
    Object.keys(updateData).forEach(
      (key) => updateData[key as keyof typeof updateData] === undefined && delete updateData[key as keyof typeof updateData]
    );
    await updateDoc(ref, updateData);

    if (performingUser) {
      await auditService.logAction({
        action: "SETTINGS_UPDATE",
        targetId: id,
        targetType: "curriculum",
        details: { name: data.name },
        performedBy: performingUser,
      });
    }
  },

  async remove(id: string, performingUser?: User): Promise<void> {
    const db = getDb();
    const ref = doc(db, "curricula", id);
    await deleteDoc(ref);

    if (performingUser) {
      await auditService.logAction({
        action: "SETTINGS_UPDATE",
        targetId: id,
        targetType: "curriculum",
        details: { action: "delete" },
        performedBy: performingUser,
      });
    }
  },
};
