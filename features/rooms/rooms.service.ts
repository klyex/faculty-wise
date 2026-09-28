import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp,
  getDoc,
  deleteDoc,
  updateDoc,
  onSnapshot
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { Room } from "@/lib/types/room.types";
import { User } from "@/lib/types/firestore.types";
import { auditService } from "../audit/audit.service";

export const roomsService = {
  subscribeRooms(onUpdate: (rooms: Room[]) => void): () => void {
    const db = getDb();
    const roomsRef = collection(db, "rooms");
    const q = query(roomsRef, orderBy("name", "asc"));
    
    return onSnapshot(q, (querySnapshot) => {
      const rooms = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "",
          building: data.building || "",
          floor: Number(data.floor) || 1,
          capacity: Number(data.capacity) || 0,
          type: data.type || "lecture",
          status: data.status || "available",
          features: data.features || [],
          currentClass: data.currentClass || "",
        } as Room;
      });
      onUpdate(rooms);
    });
  },

  async createRoom(data: Omit<Room, 'id'>, performingUser?: User): Promise<Room> {
    const db = getDb();
    const roomsRef = collection(db, "rooms");
    const docRef = await addDoc(roomsRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const newRoom: Room = {
      id: docRef.id,
      ...data,
    };

    if (performingUser) {
      await auditService.logAction({
        action: 'SETTINGS_UPDATE', // We can use SETTINGS_UPDATE for room modifications
        targetId: docRef.id,
        targetType: 'room',
        details: { name: data.name, building: data.building },
        performedBy: performingUser
      });
    }

    return newRoom;
  },

  async updateRoom(roomId: string, data: Partial<Room>, performingUser?: User): Promise<void> {
    const db = getDb();
    const roomRef = doc(db, "rooms", roomId);
    // Filter out undefined values
    const updateData = { 
      ...data,
      updatedAt: serverTimestamp(),
    };
    Object.keys(updateData).forEach(
      (key) => updateData[key as keyof typeof updateData] === undefined && delete updateData[key as keyof typeof updateData]
    );
    await updateDoc(roomRef, updateData);

    if (performingUser) {
      await auditService.logAction({
        action: 'SETTINGS_UPDATE',
        targetId: roomId,
        targetType: 'room',
        details: { name: data.name, building: data.building },
        performedBy: performingUser
      });
    }
  },

  async deleteRoom(roomId: string, performingUser?: User): Promise<void> {
    const db = getDb();
    const roomRef = doc(db, "rooms", roomId);
    await deleteDoc(roomRef);

    if (performingUser) {
      await auditService.logAction({
        action: 'SETTINGS_UPDATE',
        targetId: roomId,
        targetType: 'room',
        details: { action: 'delete' },
        performedBy: performingUser
      });
    }
  }
};
