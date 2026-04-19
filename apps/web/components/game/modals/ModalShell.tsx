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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className={`bg-[#0b0d12] rounded-xl shadow-modal-w p-6 ${
          wide ? "max-w-3xl" : "max-w-xl"
        } w-full`}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-brand text-base font-medium tracking-tight text-warp-accent-3">
            {title}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="font-mono text-[10px] uppercase tracking-wider text-white/45 hover:text-white px-1.5 py-0.5 rounded shadow-ring-w transition"
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
