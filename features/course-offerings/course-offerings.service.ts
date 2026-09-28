import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  Query,
  QuerySnapshot,
  writeBatch,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { CourseOffering, CourseOfferingWithCourse, OfferingFilter, OfferingStatus } from "@/lib/types/offering.types";
import { Course } from "@/lib/types/course.types";
import { Term } from "@/lib/types/section-term.types";
import { User } from "@/lib/types/firestore.types";
import { auditService } from "../audit/audit.service";
import { coursesService } from "../courses/courses.service";

export const courseOfferingsService = {
  /**
   * Subscribe to course offerings for a specific term with real-time updates
   */
  subscribeOfferingsByTerm(
    termId: string,
    onUpdate: (offerings: CourseOfferingWithCourse[]) => void
  ): () => void {
    const db = getDb();
    const offeringsRef = collection(db, "courseOfferings");
    const q = query(
      offeringsRef,
      where("termId", "==", termId),
      orderBy("status", "asc"),
      orderBy("courseId", "asc")
    );

    return onSnapshot(q, async (querySnapshot) => {
      const offerings = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const offering = this.parseOfferingDoc(doc);
          return await this.enrichOfferingWithCourse(offering);
        })
      );
      onUpdate(offerings);
    });
  },

  /**
   * Get all offerings for a term (non-real-time)
   */
  async getOfferingsByTerm(termId: string): Promise<CourseOfferingWithCourse[]> {
    const db = getDb();
    const offeringsRef = collection(db, "courseOfferings");
    const q = query(offeringsRef, where("termId", "==", termId));
    const snapshot = await getDocs(q);

    const offerings = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const offering = this.parseOfferingDoc(doc);
        return await this.enrichOfferingWithCourse(offering);
      })
    );

    return offerings;
  },

  /**
   * Get all available courses for offering (courses not yet offered in this term)
   */
  async getAvailableCoursesForTerm(
    termId: string,
    allCourses: Course[]
  ): Promise<Course[]> {
    const offerings = await this.getOfferingsByTerm(termId);
    const offeredCourseIds = new Set(offerings.map((o) => o.courseId));

    return allCourses.filter((course) => !offeredCourseIds.has(course.id));
  },

  /**
   * Create a new course offering
   */
  async createOffering(
    data: Omit<CourseOffering, "id" | "createdAt" | "updatedAt">,
    performingUser?: User
  ): Promise<CourseOffering> {
    // Validate that this subject is not already offered for the selected section/set in this term
    const existingOfferings = await this.getOfferingsByTerm(data.termId);
    if (
      existingOfferings.some(
        (o) => o.courseId === data.courseId && o.sectionId === data.sectionId
      )
    ) {
      throw new Error(`This subject is already offered for the selected section/set in this term`);
    }

    const db = getDb();
    const offeringsRef = collection(db, "courseOfferings");
    // Filter out undefined values from input data first
    const filteredData: Record<string, any> = {};
    Object.keys(data).forEach(
      (key) => data[key as keyof typeof data] !== undefined && (filteredData[key] = data[key as keyof typeof data])
    );
    // Then add system fields with undefined-filtering
    const documentData = {
      ...filteredData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: performingUser?.id,
    };
    // Remove undefined fields
    Object.keys(documentData).forEach(
      (key) => documentData[key as keyof typeof documentData] === undefined && delete documentData[key as keyof typeof documentData]
    );
    const docRef = await addDoc(offeringsRef, documentData);

    const newOffering: CourseOffering = {
      id: docRef.id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: performingUser?.id,
    };

    if (performingUser) {
      await auditService.logAction({
        action: "SETTINGS_UPDATE",
        targetId: docRef.id,
        targetType: "courseOffering",
        details: { courseId: data.courseId, termId: data.termId, status: data.status },
        performedBy: performingUser,
      });
    }

    return newOffering;
  },

  /**
   * Update an existing course offering
   */
  async updateOffering(
    offeringId: string,
    data: Partial<CourseOffering>,
    performingUser?: User
  ): Promise<void> {
    const db = getDb();
    const offeringRef = doc(db, "courseOfferings", offeringId);
    // Filter out undefined values
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    Object.keys(updateData).forEach(
      (key) => updateData[key as keyof typeof updateData] === undefined && delete updateData[key as keyof typeof updateData]
    );
    await updateDoc(offeringRef, updateData);

    if (performingUser) {
      await auditService.logAction({
        action: "SETTINGS_UPDATE",
        targetId: offeringId,
        targetType: "courseOffering",
        details: data,
        performedBy: performingUser,
      });
    }
  },

  /**
   * Delete a course offering
   */
  async deleteOffering(offeringId: string, performingUser?: User): Promise<void> {
    const db = getDb();
    const offeringRef = doc(db, "courseOfferings", offeringId);
    await deleteDoc(offeringRef);

    if (performingUser) {
      await auditService.logAction({
        action: "SETTINGS_UPDATE",
        targetId: offeringId,
        targetType: "courseOffering",
        details: { deleted: true },
        performedBy: performingUser,
      });
    }
  },

  /**
   * Publish all draft offerings for a term
   */
  async publishOfferingsForTerm(termId: string, performingUser?: User): Promise<void> {
    const db = getDb();
    const offerings = await this.getOfferingsByTerm(termId);
    const draftOfferings = offerings.filter((o) => o.status === "draft");

    if (draftOfferings.length === 0) {
      return;
    }

    // Use batch write for atomic operation
    const batch = writeBatch(db);
    draftOfferings.forEach((offering) => {
      const offeringRef = doc(db, "courseOfferings", offering.id);
      batch.update(offeringRef, { status: "published", updatedAt: serverTimestamp() });
    });
    await batch.commit();

    if (performingUser) {
      await auditService.logAction({
        action: "SETTINGS_UPDATE",
        targetId: termId,
        targetType: "term",
        details: { action: "publishOfferings", count: draftOfferings.length },
        performedBy: performingUser,
      });
    }
  },

  /**
   * Get offering statistics for a term
   */
  async getOfferingStats(termId: string): Promise<{
    total: number;
    draft: number;
    published: number;
    archived: number;
    totalUnits: number;
  }> {
    const offerings = await this.getOfferingsByTerm(termId);

    return {
      total: offerings.length,
      draft: offerings.filter((o) => o.status === "draft").length,
      published: offerings.filter((o) => o.status === "published").length,
      archived: offerings.filter((o) => o.status === "archived").length,
      totalUnits: offerings.reduce((sum, o) => sum + o.assignedUnits, 0),
    };
  },

  /**
   * Validate offerings for completeness
   */
  validateOfferings(offerings: CourseOfferingWithCourse[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (offerings.length === 0) {
      errors.push("At least one course must be offered in the term");
    }

    offerings.forEach((offering, index) => {
      if (!offering.courseId) {
        errors.push(`Offering ${index + 1}: Missing course`);
      }
      if (!offering.assignedUnits || offering.assignedUnits <= 0) {
        errors.push(`Offering ${index + 1}: Must have positive assigned units`);
      }
      if (offering.assignedUnits > offering.courseUnits) {
        warnings.push(
          `Offering ${index + 1}: Assigned units (${offering.assignedUnits}) exceed course units (${offering.courseUnits})`
        );
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Helper: Enrich offering with course details
   */
  async enrichOfferingWithCourse(offering: CourseOffering): Promise<CourseOfferingWithCourse> {
    const courseId = offering.courseId;
    let course = null;

    const db = getDb();
    
    // Try to fetch from Firestore first
    if (db) {
      try {
        const courseRef = doc(db, "courses", courseId);
        const courseSnap = await getDoc(courseRef);
        if (courseSnap.exists()) {
          const data = courseSnap.data();
          course = {
            id: courseSnap.id,
            code: data.code || "",
            name: data.name || "",
            description: data.description || "",
            units: Number(data.units) || 0,
            lectureHours: Number(data.lectureHours) || 0,
            labHours: Number(data.labHours) || 0,
            category: data.category || "major",
            department: data.department || "",
          } as Course;
        }
      } catch (error) {
        console.error(`Failed to fetch course ${courseId} from Firestore:`, error);
      }
    }

    // Fetch Section and Program details
    let sectionName = "";
    let programCode = "";
    const sectionId = offering.sectionId;

    if (sectionId) {
      if (db) {
        try {
          const sectionRef = doc(db, "sections", sectionId);
          const sectionSnap = await getDoc(sectionRef);
          if (sectionSnap.exists()) {
            const sectionData = sectionSnap.data();
            sectionName = sectionData.name || "";
            const progId = sectionData.programId;
            if (progId) {
              const programRef = doc(db, "programs", progId);
              const programSnap = await getDoc(programRef);
              if (programSnap.exists()) {
                programCode = programSnap.data().code || "";
              }
            }
          }
        } catch (error) {
          console.error(`Failed to fetch section/program details for ${sectionId}:`, error);
        }
      }

    }

    if (!course) {
      // Fallback for missing course data
      return {
        ...offering,
        courseName: "Unknown Course",
        courseCode: "N/A",
        courseLectureHours: 0,
        courseLabHours: 0,
        courseUnits: 0,
        sectionName: sectionName || undefined,
        programCode: programCode || undefined,
      };
    }

    return {
      ...offering,
      courseName: course.name,
      courseCode: course.code,
      courseLectureHours: course.lectureHours,
      courseLabHours: course.labHours,
      courseUnits: course.units,
      sectionName: sectionName || undefined,
      programCode: programCode || undefined,
    };
  },

  /**
   * Helper: Parse Firestore document to CourseOffering
   */
  parseOfferingDoc(doc: any): CourseOffering {
    const data = doc.data();
    return {
      id: doc.id,
      courseId: data.courseId || "",
      termId: data.termId || "",
      sectionId: data.sectionId,
      programId: data.programId,
      maxSlots: data.maxSlots,
      assignedUnits: Number(data.assignedUnits) || 0,
      status: (data.status || "draft") as OfferingStatus,
      notes: data.notes,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      createdBy: data.createdBy,
    };
  },

  /**
   * Copy all offerings from a source term into a target term.
   * Skips offerings that already exist in the target (same courseId + sectionId).
   * All copied offerings are created with status "draft".
   */
  async copyOfferingsFromTerm(
    sourceTermId: string,
    targetTermId: string,
    performingUser?: User
  ): Promise<{ copied: number; skipped: number }> {
    const sourceOfferings = await this.getOfferingsByTerm(sourceTermId);
    const targetOfferings = await this.getOfferingsByTerm(targetTermId);

    // Build a set of existing keys in the target term for fast duplicate detection
    const existingKeys = new Set(
      targetOfferings.map((o) => `${o.courseId}__${o.sectionId || ""}`)
    );

    const toCopy = sourceOfferings.filter(
      (o) => !existingKeys.has(`${o.courseId}__${o.sectionId || ""}`)
    );
    const skipped = sourceOfferings.length - toCopy.length;

    const db = getDb();

    // Firestore batch write (batches of 500 max for Firestore limits)
      const BATCH_SIZE = 450;
      for (let i = 0; i < toCopy.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = toCopy.slice(i, i + BATCH_SIZE);

        for (const offering of chunk) {
          const newDocRef = doc(collection(db, "courseOfferings"));
          const docData: Record<string, any> = {
            courseId: offering.courseId,
            termId: targetTermId,
            assignedUnits: offering.assignedUnits,
            status: "draft",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          if (offering.sectionId) docData.sectionId = offering.sectionId;
          if (offering.programId) docData.programId = offering.programId;
          if (offering.maxSlots) docData.maxSlots = offering.maxSlots;
          if (offering.notes) docData.notes = offering.notes;
          if (performingUser?.id) docData.createdBy = performingUser.id;

          batch.set(newDocRef, docData);
        }

        await batch.commit();
      }

    if (performingUser && toCopy.length > 0) {
      await auditService.logAction({
        action: "SETTINGS_UPDATE",
        targetId: targetTermId,
        targetType: "term",
        details: {
          action: "copyOfferings",
          sourceTermId,
          copied: toCopy.length,
          skipped,
        },
        performedBy: performingUser,
      });
    }

    return { copied: toCopy.length, skipped };
  },

  /**
   * Export offerings as CSV
   */
  exportAsCSV(offerings: CourseOfferingWithCourse[]): string {
    const headers = ["Subject Code", "Subject Name", "Section/Set", "Status", "Units", "Notes"];
    const rows = offerings.map((o) => [
      o.courseCode,
      o.courseName,
      o.sectionName || "-",
      o.status,
      o.assignedUnits,
      o.notes || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    return csv;
  },
};
