"use client";

import React from "react";

type ConfirmationModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDanger = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onCancel} 
      />

      {/* Modal Container */}
      <div className="relative bg-white border border-outline-variant rounded-2xl max-w-sm w-full shadow-2xl p-6 overflow-hidden flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isDanger 
                ? "bg-rose-50 text-rose-600 border border-rose-100" 
                : "bg-primary-fixed text-primary-container border border-primary-fixed"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isDanger ? "warning" : "help"}
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-lg text-on-surface leading-tight">{title}</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">{message}</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 border border-outline-variant text-on-surface font-semibold rounded-lg text-xs hover:bg-surface-container-low transition-all min-h-[38px] select-none cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2.5 text-white font-semibold rounded-lg text-xs hover:opacity-90 transition-all min-h-[38px] select-none cursor-pointer ${
              isDanger ? "bg-rose-600 shadow-sm" : "bg-primary shadow-sm"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
