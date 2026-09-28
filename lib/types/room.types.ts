export type RoomType = "lecture" | "laboratory" | "seminar" | "auditorium";
export type RoomStatus = "available" | "occupied" | "maintenance";

export interface Room {
  id: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  type: RoomType;
  status: RoomStatus;
  features: string[];
  currentClass?: string;
}

export interface RoomFilter {
  building?: string;
  type?: RoomType;
  status?: RoomStatus;
}
