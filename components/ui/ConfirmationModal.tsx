"use client";

import React, { useState } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
}: ConfirmationModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error("Confirmation modal error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconBg: "bg-red-50 text-red-600 border border-red-100",
          confirmBtn: "bg-red-600 hover:bg-red-700 text-white",
        };
      case "warning":
        return {
          iconBg: "bg-amber-50 text-amber-600 border border-amber-100",
          confirmBtn: "bg-amber-600 hover:bg-amber-700 text-white",
        };
      case "info":
      default:
        return {
          iconBg: "bg-blue-50 text-blue-600 border border-blue-100",
          confirmBtn: "bg-primary hover:bg-primary/95 text-white",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="relative p-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-surface-alt transition-colors"
          >
            <X className="h-4 w-4 text-text-muted" />
          </button>

          <div className="flex items-start gap-4 mt-2">
            <div className={`p-3 rounded-2xl shrink-0 ${styles.iconBg}`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-text font-source-serif">{title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{message}</p>
            </div>
          </div>

          <div className="flex gap-3 mt-8 justify-end">
            <Button
              type="button"
              variant="secondary"
              className="rounded-xl h-11 px-4 text-xs font-semibold"
              onClick={onClose}
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              className={`rounded-xl h-11 px-4 text-xs font-semibold gap-1.5 ${styles.confirmBtn}`}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
