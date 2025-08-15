import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GameConfig {
  rounds: 3 | 5 | 7;
  waitTime: 3 | 5;
  mode: "computer" | "online";
}

interface GameState {
  gameConfig: GameConfig;
  isDialogOpen: boolean;
  isOnlineDialogOpen: boolean;
  isOnboarded: boolean;
  setGameConfig: (config: Partial<GameConfig>) => void;
  setIsDialogOpen: (isOpen: boolean) => void;
  setIsOnlineDialogOpen: (isOpen: boolean) => void;
  setIsOnboarded: (isOnboarded: boolean) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      gameConfig: {
        rounds: 3,
        waitTime: 3,
        mode: "computer",
      },
      isDialogOpen: false,
      isOnlineDialogOpen: false,
      isOnboarded: false,
      setGameConfig: (config) =>
        set((state) => ({
          gameConfig: { ...state.gameConfig, ...config },
        })),
      setIsDialogOpen: (isOpen) => set({ isDialogOpen: isOpen }),
      setIsOnlineDialogOpen: (isOpen) => set({ isOnlineDialogOpen: isOpen }),
      setIsOnboarded: (isOnboarded) => set({ isOnboarded }),
    }),
    {
      name: "game-config-storage",
      partialize: (state) => ({
        gameConfig: state.gameConfig,
        isOnlineDialogOpen: state.isOnlineDialogOpen,
        isOnboarded: state.isOnboarded,
      }),
    }
  )
);
