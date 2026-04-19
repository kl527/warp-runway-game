import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      animation: {
        "player-pulse": "player-pulse 1.2s ease-in-out infinite",
        "door-idle": "door-idle 2.2s ease-in-out infinite",
        "door-ready": "door-ready 0.7s ease-in-out infinite",
        "hint-pulse": "hint-pulse 1.4s ease-in-out infinite",
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
      },
    },
  },
  plugins: [],
};

export default config;
