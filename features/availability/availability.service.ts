import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { User } from "@/lib/types/firestore.types";
import { auditService } from "@/features/audit/audit.service";

export type AvailabilityStatus = "preferred" | "available" | "unavailable";

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";

export interface AvailabilitySlot {
  day: DayOfWeek;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: AvailabilityStatus;
}

export interface TeacherAvailability {
  id?: string;
  teacherId: string;
  termId: string;
  academicYear: string;
  semester: string;
  slots: AvailabilitySlot[];
  submittedAt?: Date;
  lastUpdated: Date;
  minHoursRequired?: number;
  currentHoursAvailable?: number;
}

export interface AvailabilitySubmissionResult {
  success: boolean;
  error?: string;
  data?: TeacherAvailability;
  validationWarnings?: string[];
}

// Validation constants
const WORK_DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const WORK_HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM (one hour slots)

export const availabilityService = {
  /**
   * Calculate total available hours from slots
   */
  calculateAvailableHours(slots: AvailabilitySlot[]): number {
    return slots
      .filter((s) => s.status === "available" || s.status === "preferred")
      .reduce((total, slot) => {
        const [startH, startM] = slot.startTime.split(":").map(Number);
        const [endH, endM] = slot.endTime.split(":").map(Number);
        const hours = endH - startH + (endM - startM) / 60;
        return total + Math.max(0, hours);
      }, 0);
  },

  /**
   * Validate availability submission
   */
  validateAvailability(
    availability: TeacherAvailability,
    minHoursRequired: number = 12
  ): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if slots exist
    if (!availability.slots || availability.slots.length === 0) {
      errors.push("Please select at least one available time slot");
    }

    // Calculate hours
    const availableHours = this.calculateAvailableHours(availability.slots);
    if (availableHours < minHoursRequired) {
      errors.push(
        `Minimum ${minHoursRequired} hours required. Currently selected: ${availableHours.toFixed(1)} hours`
      );
    } else if (availableHours < minHoursRequired * 1.5) {
      warnings.push(
        `You have ${availableHours.toFixed(1)} hours available. Consider adding more slots for flexibility.`
      );
    }

    // Check for continuous work blocks
    const consecutiveDays = this.getConsecutiveDayCount(availability.slots);
    if (consecutiveDays > 5) {
      warnings.push(
        "You have availability for all 5 work days. Consider having at least one day off."
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Get consecutive work days with availability
   */
  getConsecutiveDayCount(slots: AvailabilitySlot[]): number {
    const daysWithAvailability = new Set(
      slots
        .filter((s) => s.status === "available" || s.status === "preferred")
        .map((s) => s.day)
    );
    return daysWithAvailability.size;
  },

  /**
   * Subscribe to teacher availability for a specific term
   */
  subscribeTeacherAvailability(
    teacherId: string,
    termId: string,
    onUpdate: (availability: TeacherAvailability | null) => void
  ): () => void {
    const db = getDb();

    try {
      const docId = `${teacherId}-${termId}`;
      const docRef = doc(db, "teacherAvailability", docId);

      return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          onUpdate({
            id: docSnap.id,
            teacherId: data.teacherId,
            termId: data.termId,
            academicYear: data.academicYear,
            semester: data.semester,
            slots: data.slots || [],
            lastUpdated: data.lastUpdated?.toDate?.() || new Date(),
            submittedAt: data.submittedAt?.toDate?.(),
          } as TeacherAvailability);
        } else {
          onUpdate(null);
        }
      });
    } catch (err) {
      console.error("Error subscribing to availability:", err);
      return () => {};
    }
  },

  /**
   * Submit or update availability
   */
  async submitAvailability(
    availability: TeacherAvailability,
    performingUser?: User
  ): Promise<AvailabilitySubmissionResult> {
    const db = getDb();
    const minHours = availability.minHoursRequired || 12;

    // Validate
    const validation = this.validateAvailability(availability, minHours);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join("; "),
        validationWarnings: validation.warnings,
      };
    }

    try {
      const docId = `${availability.teacherId}-${availability.termId}`;
      const availRef = doc(db, "teacherAvailability", docId);

      const dataToSave = {
        teacherId: availability.teacherId,
        termId: availability.termId,
        academicYear: availability.academicYear,
        semester: availability.semester,
        slots: availability.slots,
        submittedAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      };

      await setDoc(availRef, dataToSave, { merge: true });

      // Log audit entry
      if (performingUser) {
        await auditService.logAction({
          action: "SETTINGS_UPDATE",
          targetId: docId,
          targetType: "teacher_availability",
          details: {
            termId: availability.termId,
            hoursAvailable: this.calculateAvailableHours(availability.slots),
            slotsCount: availability.slots.length,
          },
          performedBy: performingUser,
        });
      }

      return {
        success: true,
        data: {
          ...availability,
          submittedAt: new Date(),
          currentHoursAvailable: this.calculateAvailableHours(availability.slots),
        },
        validationWarnings: validation.warnings,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to submit availability",
        validationWarnings: validation.warnings,
      };
    }
  },

  /**
   * Generate default availability slots (all day, all unavailable)
   */
  generateDefaultSlots(): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];

    for (const day of WORK_DAYS) {
      for (let hour = 7; hour < 20; hour++) {
        slots.push({
          day,
          startTime: `${hour.toString().padStart(2, "0")}:00`,
          endTime: `${(hour + 1).toString().padStart(2, "0")}:00`,
          status: "unavailable",
        });
      }
    }

    return slots;
  },

  /**
   * Get slot key for lookup
   */
  getSlotKey(day: DayOfWeek, hour: number): string {
    return `${day}-${hour}:00`;
  },

  /**
   * Toggle slot status
   */
  toggleSlotStatus(status: AvailabilityStatus): AvailabilityStatus {
    switch (status) {
      case "unavailable":
        return "available";
      case "available":
        return "preferred";
      case "preferred":
        return "unavailable";
      default:
        return "unavailable";
    }
  },

  /**
   * Get color class for status
   */
  getStatusColor(status: AvailabilityStatus): string {
    switch (status) {
      case "preferred":
        return "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600";
      case "available":
        return "bg-blue-400 text-white border-blue-400 hover:bg-blue-500";
      case "unavailable":
        return "bg-gray-200 text-gray-600 border-gray-300 hover:bg-gray-300";
      default:
        return "bg-gray-200";
    }
  },

  /**
   * Get description for status
   */
  getStatusDescription(status: AvailabilityStatus): string {
    switch (status) {
      case "preferred":
        return "Preferred time";
      case "available":
        return "Available";
      case "unavailable":
        return "Unavailable";
      default:
        return "Unknown";
    }
  },

  /**
   * Export availability as CSV
   */
  exportAsCSV(availability: TeacherAvailability): string {
    const headers = ["Day", "Start Time", "End Time", "Status"];
    const rows = availability.slots.map((slot) => [
      slot.day,
      slot.startTime,
      slot.endTime,
      slot.status,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    return csv;
  },
};
