"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

export function ModalShell({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose?: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className={`bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-6 ${
          wide ? "max-w-3xl" : "max-w-xl"
        } w-full`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-emerald-300">{title}</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-200"
              aria-label="Close"
            >
              ESC
            </button>
          )}
        </div>
        {children}
      </motion.div>
    </div>
  );
}
