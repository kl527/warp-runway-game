import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        brand: ["var(--font-geist)", "var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-instrument-serif)", "Georgia", "Times New Roman", "serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      fontWeight: {
        book: "450",
      },
      borderRadius: {
        xs: "2px",
        sm: "4px",
        DEFAULT: "6px",
        md: "6px",
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      colors: {
        // warp.co brand tokens — sourced from /Users/dlee/Desktop/warp-headcount-planner
        warp: {
          orange: "#FF3D00",
          "orange-hover": "#e63500",
          "red-9": "#ff2323",
          "red-10": "#f1000b",
          "red-11": "#e20000",
          "red-12": "#691410",
          "amber-8": "#f19a00",
          "amber-9": "#f59e0b",
          "amber-10": "#e99300",
          "amber-11": "#ac6500",
          "accent-1": "oklch(99.3% 0.0036 34.09)",
          "accent-2": "oklch(98.2% 0.0114 34.09)",
          "accent-3": "oklch(95.5% 0.0303 34.09)",
          "accent-4": "oklch(92.4% 0.0674 34.09)",
          "accent-5": "oklch(89.1% 0.0905 34.09)",
          "accent-6": "oklch(85.4% 0.1044 34.09)",
          "accent-7": "oklch(80.4% 0.1198 34.09)",
          "accent-8": "oklch(74.3% 0.1479 34.09)",
          "accent-9": "oklch(65.4% 0.234 34.09)",
          "accent-10": "oklch(61.5% 0.2369 34.09)",
          "accent-11": "oklch(57.5% 0.234 34.09)",
          "accent-12": "oklch(34.7% 0.0923 34.09)",
        },
        room: {
          hire: "#2a1d08",
          "hire-accent": "#6b4a10",
          vc: "#0c2418",
          "vc-accent": "#1c5a3c",
          dash: "#0c1b2e",
          "dash-accent": "#1c3e66",
          coffee: "#1f140b",
          "coffee-accent": "#553a1e",
          lounge: "#1b1424",
          "lounge-accent": "#4a3566",
          lab: "#0f1d22",
          "lab-accent": "#2a5566",
          allhands: "#211018",
          "allhands-accent": "#5a2846",
        },
        ink: {
          base: "#e2e8f0",
          dim: "#94a3b8",
          soft: "#64748b",
          wall: "#475569",
        },
      },
      dropShadow: {
        "glow-emerald": "0 0 6px rgba(52, 211, 153, 0.7)",
        "glow-amber": "0 0 5px rgba(251, 191, 36, 0.65)",
        "glow-amber-strong": "0 0 10px rgba(251, 191, 36, 0.9)",
        "glow-fuchsia": "0 0 6px rgba(232, 121, 249, 0.75)",
        "glow-rose": "0 0 5px rgba(251, 113, 133, 0.7)",
        "glow-cyan": "0 0 4px rgba(34, 211, 238, 0.55)",
        "glow-warp": "0 0 8px rgba(255, 61, 0, 0.55)",
      },
      boxShadow: {
        // Warp-style 1px ring shadows adapted for dark surfaces
        "ring-w": "inset 0 0 0 1px rgba(255, 255, 255, 0.08)",
        "ring-w-strong": "inset 0 0 0 1px rgba(255, 255, 255, 0.14)",
        "card-w":
          "inset 0 0 0 1px rgba(255, 255, 255, 0.08), 0 2px 2px rgba(0, 0, 0, 0.25), 0 8px 16px -4px rgba(0, 0, 0, 0.4)",
        "modal-w":
          "inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 1px 1px rgba(0, 0, 0, 0.2), 0 8px 16px -4px rgba(0, 0, 0, 0.45), 0 24px 32px -8px rgba(0, 0, 0, 0.55)",
        "frame-fuchsia":
          "0 0 40px rgba(244, 114, 182, 0.28), inset 0 0 20px rgba(244, 114, 182, 0.08)",
        "frame-rose":
          "0 0 40px rgba(251, 113, 133, 0.25), inset 0 0 20px rgba(251, 113, 133, 0.08)",
        "frame-amber":
          "0 0 40px rgba(251, 191, 36, 0.28), inset 0 0 20px rgba(251, 191, 36, 0.08)",
        "frame-warp":
          "0 0 48px rgba(255, 61, 0, 0.25), inset 0 0 24px rgba(255, 61, 0, 0.06)",
      },
      animation: {
        "player-pulse": "player-pulse 1.2s ease-in-out infinite",
        "door-idle": "door-idle 2.2s ease-in-out infinite",
        "door-ready": "door-ready 0.7s ease-in-out infinite",
        "hint-pulse": "hint-pulse 1.4s ease-in-out infinite",
        scanlines: "scanlines 8s linear infinite",
        "screen-shake": "screen-shake 0.42s cubic-bezier(.36,.07,.19,.97) both",
        "toast-rise": "toast-rise 900ms ease-out forwards",
      },
      keyframes: {
        "player-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "door-idle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        "door-ready": {
          "0%, 100%": { transform: "scale(1)", filter: "brightness(1)" },
          "50%": { transform: "scale(1.15)", filter: "brightness(1.3)" },
        },
        "hint-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        scanlines: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 100%" },
        },
        "screen-shake": {
          "10%, 90%": { transform: "translate(-1px, 0)" },
          "20%, 80%": { transform: "translate(2px, 0)" },
          "30%, 50%, 70%": { transform: "translate(-3px, 1px)" },
          "40%, 60%": { transform: "translate(3px, -1px)" },
        },
        "toast-rise": {
          "0%": { opacity: "0", transform: "translate(-50%, 0)" },
          "15%": { opacity: "1", transform: "translate(-50%, -4px)" },
          "100%": { opacity: "0", transform: "translate(-50%, -28px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
