import { create } from "zustand";
import type { LocationId } from "./constants";
import {
  closeModal as pureCloseModal,
  fundraise as pureFundraise,
  hire as pureHire,
  hireMany as pureHireMany,
  initialState,
  interact as pureInteract,
  move as pureMove,
  openAiCritic as pureOpenAiCritic,
  resolveChoice as pureResolveChoice,
  setSpeed as pureSetSpeed,
  tick as pureTick,
  togglePause as pureTogglePause,
} from "./logic";
import type { GameState } from "./state";

export interface GameActions {
  move: (dx: number, dy: number) => void;
  interact: () => void;
  hire: (roleId: string, location: LocationId) => void;
  hireMany: (roleId: string, location: LocationId, qty: number) => void;
  fundraise: (idx: number) => void;
  tick: () => void;
  togglePause: () => void;
  setSpeed: (speed: 1 | 2 | 4) => void;
  closeModal: () => void;
  resolveChoice: (choiceKey: string) => void;
  openAiCritic: (critique: string) => void;
  reset: () => void;
}

export type GameStore = GameState & { actions: GameActions };

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState(),
  actions: {
    move: (dx, dy) => set((s) => pureMove(s, dx, dy)),
    interact: () => set((s) => pureInteract(s)),
    hire: (roleId, location) => set((s) => pureHire(s, roleId, location)),
    hireMany: (roleId, location, qty) =>
      set((s) => pureHireMany(s, roleId, location, qty)),
    fundraise: (idx) => set((s) => pureFundraise(s, idx)),
    tick: () => set((s) => pureTick(s)),
    togglePause: () => set((s) => pureTogglePause(s)),
    setSpeed: (speed) => set((s) => pureSetSpeed(s, speed)),
    closeModal: () => set((s) => pureCloseModal(s)),
    resolveChoice: (key) => set((s) => pureResolveChoice(s, key)),
    openAiCritic: (critique) => set((s) => pureOpenAiCritic(s, critique)),
    reset: () => set(() => ({ ...initialState(), actions: get().actions })),
  },
}));

export const useActions = () => useGameStore((s) => s.actions);
