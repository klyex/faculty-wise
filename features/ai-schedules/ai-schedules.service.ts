/**
 * AI Schedule Proposals Service
 * Persists, retrieves, and manages AI-generated schedule draft proposals.
 * Uses localStorage for offline/demo mode and Firestore (ai_proposals collection) in production.
 */

import { getDb } from "@/lib/firebase";
import {
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { AiScheduleReport } from "@/lib/ai-scheduler";

const LS_KEY = "fw_ai_proposals";

export interface AiScheduleEntry {
  /** Raw schedule objects ready to write to Firestore / mockData */
  schedules: any[];
  /** Enriched TimetableEntry objects for display in the grid */
  entries: any[];
}

export type ProposalStatus = "draft" | "applied" | "accepted" | "rejected";

export interface AiProposal {
  id: string;
  name: string;
  createdAt: string; // ISO date string
  status: ProposalStatus;
  filteredDepts: string[];
  filteredCourses: string[];
  filteredTeachers: string[];
  totalScheduled: number;
  totalSkipped: number;
  conflictsAvoided: number;
  data: AiScheduleEntry;
  report: AiScheduleReport;
}

// ─── LOCAL STORAGE HELPERS ──────────────────────────────────────────────────

function loadFromLS(): AiProposal[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToLS(proposals: AiProposal[]): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_KEY, JSON.stringify(proposals));
  } catch {
    // silently fail if storage is full
  }
}

// ─── SERVICE ────────────────────────────────────────────────────────────────

export const aiSchedulesService = {
  /**
   * Save a newly generated AI proposal.
   */
  async saveProposal(proposal: Omit<AiProposal, "id">): Promise<AiProposal> {
    const db = getDb();

    if (!db) {
      // Offline / Demo mode – persist to localStorage
      const existing = loadFromLS();
      const newProposal: AiProposal = {
        ...proposal,
        id: `proposal-${Date.now()}`,
      };
      saveToLS([newProposal, ...existing]);
      return newProposal;
    }

    // Firestore mode
    const colRef = collection(db, "ai_proposals");
    const docRef = await addDoc(colRef, {
      ...proposal,
      data: JSON.stringify(proposal.data), // Firestore can't nest arbitrary arrays well
      report: JSON.stringify(proposal.report),
      createdAt: serverTimestamp(),
    });
    return { ...proposal, id: docRef.id };
  },

  /**
   * List all saved proposals, newest first.
   */
  async listProposals(): Promise<AiProposal[]> {
    const db = getDb();

    if (!db) {
      return loadFromLS();
    }

    const colRef = collection(db, "ai_proposals");
    const q = query(colRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const raw = d.data();
      return {
        id: d.id,
        name: raw.name,
        createdAt: raw.createdAt?.toDate?.()?.toISOString() ?? raw.createdAt,
        status: raw.status,
        filteredDepts: raw.filteredDepts ?? [],
        filteredCourses: raw.filteredCourses ?? [],
        filteredTeachers: raw.filteredTeachers ?? [],
        totalScheduled: raw.totalScheduled,
        totalSkipped: raw.totalSkipped,
        conflictsAvoided: raw.conflictsAvoided,
        data: typeof raw.data === "string" ? JSON.parse(raw.data) : raw.data,
        report: typeof raw.report === "string" ? JSON.parse(raw.report) : raw.report,
      } as AiProposal;
    });
  },

  /**
   * Update the name of a proposal.
   */
  async renameProposal(id: string, name: string): Promise<void> {
    const db = getDb();

    if (!db) {
      const existing = loadFromLS();
      const updated = existing.map((p) =>
        p.id === id ? { ...p, name } : p
      );
      saveToLS(updated);
      return;
    }

    await updateDoc(doc(db, "ai_proposals", id), { name });
  },

  /**
   * Update the status of a proposal.
   */
  async markStatus(id: string, status: ProposalStatus): Promise<void> {
    const db = getDb();

    if (!db) {
      const existing = loadFromLS();
      const updated = existing.map((p) =>
        p.id === id ? { ...p, status } : p
      );
      saveToLS(updated);
      return;
    }

    await updateDoc(doc(db, "ai_proposals", id), { status });
  },

  /**
   * Mark a proposal as applied.
   */
  async markApplied(id: string): Promise<void> {
    return aiSchedulesService.markStatus(id, "applied");
  },

  /**
   * Delete a proposal by ID.
   */
  async deleteProposal(id: string): Promise<void> {
    const db = getDb();

    if (!db) {
      const existing = loadFromLS();
      saveToLS(existing.filter((p) => p.id !== id));
      return;
    }

    await deleteDoc(doc(db, "ai_proposals", id));
  },
};
