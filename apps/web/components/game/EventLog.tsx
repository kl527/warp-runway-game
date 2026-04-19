"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { selectEventLog } from "@/lib/game/selectors";
import { VISIBLE_LOG_ENTRIES } from "@/lib/game/constants";
import { useShallow } from "zustand/react/shallow";

const TONE: Record<string, string> = {
  good: "text-emerald-300",
  bad: "text-rose-300",
  neutral: "text-slate-300",
  warp: "text-fuchsia-400 font-bold",
};

export function EventLog() {
  const log = useGameStore(useShallow(selectEventLog));
  const recent = log.slice(-VISIBLE_LOG_ENTRIES);

  return (
    <div className="border-t border-slate-800 bg-slate-950/90 backdrop-blur px-4 py-2 text-xs md:text-sm h-[110px] overflow-hidden">
      <AnimatePresence initial={false}>
        {recent.map((entry, i) => (
          <motion.div
            key={`${entry.week}-${i}-${entry.message.slice(0, 12)}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`${TONE[entry.tone] ?? "text-slate-300"} leading-tight`}
          >
            <span className="text-slate-600 mr-2">[w{entry.week.toString().padStart(2, "0")}]</span>
            {entry.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
