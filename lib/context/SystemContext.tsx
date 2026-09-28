"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Term } from "@/lib/types/section-term.types";
import { termsService } from "@/features/sections/sections.service";
import { institutionService } from "@/features/settings/institution.service";

interface SystemContextType {
  currentTerm: Term | null;
  allTerms: Term[];
  academicYear: string;
  loading: boolean;
}

const SystemContext = createContext<SystemContextType>({
  currentTerm: null,
  allTerms: [],
  academicYear: "",
  loading: true,
});

export function SystemProvider({ children }: { children: React.ReactNode }) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [academicYear, setAcademicYear] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubTerms = termsService.subscribeAll((data) => {
      setTerms(data);
      setLoading(false);
    });

    const unsubSettings = institutionService.subscribeSettings((settings) => {
      if (settings?.currentAcademicYear) {
        setAcademicYear(settings.currentAcademicYear);
      }
    });

    return () => {
      unsubTerms();
      unsubSettings();
    };
  }, []);

  const currentTerm = terms.find((t) => t.isCurrent) || terms[0] || null;
  const year = academicYear || currentTerm?.academicYear || "";

  return (
    <SystemContext.Provider value={{ currentTerm, allTerms: terms, academicYear: year, loading }}>
      {children}
    </SystemContext.Provider>
  );
}

export const useSystemInfo = () => useContext(SystemContext);
