import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { subscribeWithSelector } from "zustand/middleware";
import type { SinglePlayerGameStore, GameConfig, RoundResult } from "../types";
import {
  getWinner,
  generateComputerChoice,
  getDefaultChoice,
} from "../utils/gameUtils";

const initialState = {
  config: {
    rounds: 3,
    waitTime: 3,
  },
  currentRound: 1,
  playerScore: 0,
  computerScore: 0,
  countdown: 3,
  selectionTimer: 3000, // in milliseconds
  phase: "waiting" as const,
  playerChoice: null,
  computerChoice: null,
  roundWinner: null,
  gameWinner: null,
  playerAnimation: "idle" as const,
  computerAnimation: "idle" as const,
  gameStarted: false,
  chanceHistory: [] as RoundResult[],
};

export const useSinglePlayerGameStore = create<SinglePlayerGameStore>()(
  persist(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      setChanceHistory(history) {
        set(() => ({
          chanceHistory: history,
        }));
      },

      setConfig: (config: GameConfig) => {
        set(() => ({
          config,
          selectionTimer: config.waitTime * 1000,
        }));
      },

      startRound: () => {
        const { config } = get();
        set({
          phase: "countdown",
          countdown: 3,
          selectionTimer: config.waitTime * 1000,
          playerChoice: null,
          computerChoice: null,
          roundWinner: null,
          playerAnimation: "idle",
          computerAnimation: "idle",
        });
      },

      makeChoice: (choice) => {
        const state = get();
        if (state.phase !== "playing") return;

        const computerChoice = generateComputerChoice();

        set({
          playerChoice: choice,
          computerChoice,
          phase: "revealing",
          playerAnimation: choice,
          computerAnimation: computerChoice,
        });

        // Show animations for 2 seconds, then reveal result
        setTimeout(() => {
          const winner = getWinner(choice, computerChoice);
          let roundWinner: "player" | "computer" | "draw";

          if (winner === "player") roundWinner = "player";
          else if (winner === "opponent") roundWinner = "computer";
          else roundWinner = "draw";

          get().finishRound(roundWinner);
        }, 2000);
      },

      nextRound: () => {
        const { config } = get();
        set((state) => ({
          currentRound: state.currentRound + 1,
          phase: "countdown",
          countdown: 3,
          selectionTimer: config.waitTime * 1000,
          playerChoice: null,
          computerChoice: null,
          roundWinner: null,
          playerAnimation: "idle",
          computerAnimation: "idle",
        }));
      },

      resetGame: () => {
        const { config } = get();
        set({
          ...initialState,
          config,
          selectionTimer: config.waitTime * 1000,
          gameStarted: false,
        });
      },

      decrementCountdown: () => {
        set((state) => ({
          countdown: state.countdown - 1,
        }));
      },

      decrementSelectionTimer: () => {
        set((state) => ({
          selectionTimer: Math.max(0, state.selectionTimer - 17), // 60fps updates
        }));
      },

      setPhase: (phase) => {
        set({ phase });
      },

      setGameStarted: (started) => {
        set({ gameStarted: started });
      },

      setChoices: (playerChoice, computerChoice) => {
        set({ playerChoice, computerChoice });
      },

      setAnimations: (playerAnimation, computerAnimation) => {
        set({ playerAnimation, computerAnimation });
      },

      finishRound: (roundWinner) => {
        const state = get();
        const updatedPlayerScore =
          roundWinner === "player" ? state.playerScore + 1 : state.playerScore;
        const updatedComputerScore =
          roundWinner === "computer"
            ? state.computerScore + 1
            : state.computerScore;

        // Check if game is finished
        if (state.currentRound >= state.config.rounds) {
          let gameWinner: "player" | "computer" | "draw";
          if (updatedPlayerScore > updatedComputerScore) {
            gameWinner = "player";
          } else if (updatedComputerScore > updatedPlayerScore) {
            gameWinner = "computer";
          } else {
            gameWinner = "draw";
          }

          get().setChanceHistory([...get().chanceHistory, roundWinner]);

          set({
            roundWinner,
            playerScore: updatedPlayerScore,
            computerScore: updatedComputerScore,
            phase: "finished",
            gameWinner,
          });
        } else {
          get().setChanceHistory([...get().chanceHistory, roundWinner]);
          set({
            roundWinner,
            playerScore: updatedPlayerScore,
            computerScore: updatedComputerScore,
            phase: "result",
          });
        }
      },
    })),
    {
      name: "single-player-game-store", // unique name for storage
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

// Timer management with subscriptions
let countdownInterval: NodeJS.Timeout | null = null;
let selectionInterval: NodeJS.Timeout | null = null;

// Function to clear all timers
const clearAllTimers = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  if (selectionInterval) {
    clearInterval(selectionInterval);
    selectionInterval = null;
  }
};

// Subscribe to phase changes to manage timers
useSinglePlayerGameStore.subscribe(
  (state) => state.phase,
  (phase) => {
    // Clear existing timers
    clearAllTimers();

    if (phase === "countdown") {
      countdownInterval = setInterval(() => {
        const state = useSinglePlayerGameStore.getState();
        if (state.phase !== "countdown") {
          clearAllTimers();
          return;
        }

        if (state.countdown > 0) {
          state.decrementCountdown();
        } else {
          // Start playing phase
          state.setPhase("playing");
        }
      }, 1000);
    } else if (phase === "playing") {
      selectionInterval = setInterval(() => {
        const state = useSinglePlayerGameStore.getState();
        if (state.phase !== "playing") {
          clearAllTimers();
          return;
        }

        if (state.selectionTimer > 0) {
          state.decrementSelectionTimer();
        } else {
          // Time's up! Auto-select choices
          const computerChoice = generateComputerChoice();
          const playerChoice = getDefaultChoice();

          state.setChoices(playerChoice, computerChoice);
          state.setAnimations(playerChoice, computerChoice);
          state.setPhase("timeout");

          // Show timeout message and then reveal results
          setTimeout(() => {
            const winner = getWinner(playerChoice, computerChoice);
            let roundWinner: "player" | "computer" | "draw";

            if (winner === "player") roundWinner = "player";
            else if (winner === "opponent") roundWinner = "computer";
            else roundWinner = "draw";

            state.finishRound(roundWinner);
          }, 2000);

          clearAllTimers();
        }
      }, 17); // ~60fps updates for smooth timer
    }
  }
);

// Cleanup function (export for potential cleanup on component unmount)
export const cleanupGameTimers = clearAllTimers;
