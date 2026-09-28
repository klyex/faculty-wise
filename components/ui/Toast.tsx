"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info as InfoIcon, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (item: Omit<ToastItem, "id">) => void;
  success: (title: string, message: string) => void;
  error: (title: string, message: string) => void;
  warning: (title: string, message: string) => void;
  info: (title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, message, type, duration = 5000 }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, message, type, duration }]);
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  const success = useCallback((title: string, message: string) => {
    addToast({ title, message, type: "success" });
  }, [addToast]);

  const error = useCallback((title: string, message: string) => {
    addToast({ title, message, type: "error" });
  }, [addToast]);

  const warning = useCallback((title: string, message: string) => {
    addToast({ title, message, type: "warning" });
  }, [addToast]);

  const info = useCallback((title: string, message: string) => {
    addToast({ title, message, type: "info" });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, info }}>
      {children}
      {/* Toast Portal Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none no-print">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-lg transition-all duration-300 transform translate-y-0 animate-in slide-in-from-bottom-5 fade-in duration-300 ${
              t.type === "success"
                ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                : t.type === "error"
                ? "bg-red-50 border-red-100 text-red-800"
                : t.type === "warning"
                ? "bg-amber-50 border-amber-100 text-amber-800"
                : "bg-blue-50 border-blue-100 text-blue-800"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {t.type === "error" && <AlertCircle className="w-5 h-5 text-red-600" />}
              {t.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {t.type === "info" && <InfoIcon className="w-5 h-5 text-blue-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold truncate">{t.title}</h4>
              <p className="text-xs mt-1 leading-relaxed opacity-90">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 rounded-lg hover:bg-black/5 opacity-60 hover:opacity-100 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
