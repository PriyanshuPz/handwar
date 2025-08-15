import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
  MultiplayerGameStore,
  GameConfig,
  PlayerData,
  Choice,
} from "../types";

const initialState = {
  // Game configuration
  config: {
    rounds: 3,
    waitTime: 3,
  },
  roomId: "",

  // Players
  player: { uid: "", displayName: "" },
  opponent: null,

  // Round state
  currentRound: 1,
  playerScore: 0,
  opponentScore: 0,

  // Timer state
  countdown: 3,
  selectionTimer: 3000,

  // Game phase
  phase: "waiting" as const,

  // Choices
  playerChoice: null,
  opponentChoice: null,

  // Results
  roundWinner: null,
  gameWinner: null,
  roundHistory: [],

  // Player ready states
  playerReady: false,
  opponentReady: false,

  // Animations
  playerAnimation: "idle" as const,
  opponentAnimation: "idle" as const,

  // Connection state
  isConnected: false,
  isHost: false,

  // Error state
  error: null,
};

export const useMultiplayerGameStore = create<MultiplayerGameStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Game setup
    setRoomId: (roomId: string) => {
      set({ roomId });
    },

    setPlayer: (player: PlayerData) => {
      set({ player });
    },

    setOpponent: (opponent: PlayerData | null) => {
      set({ opponent });
    },

    setConfig: (config: GameConfig) => {
      set({
        config,
        selectionTimer: config.waitTime * 1000,
      });
    },

    setIsHost: (isHost: boolean) => {
      set({ isHost });
    },

    // Game controls
    startRound: () => {
      const { config } = get();
      set({
        phase: "countdown",
        countdown: 3,
        selectionTimer: config.waitTime * 1000,
        playerChoice: null,
        opponentChoice: null,
        roundWinner: null,
        playerAnimation: "idle",
        opponentAnimation: "idle",
      });
    },

    makeChoice: (choice: Choice) => {
      const state = get();
      if (state.phase !== "playing") return;

      set({
        playerChoice: choice,
        playerAnimation: choice,
      });

      // In multiplayer, we don't immediately reveal - wait for opponent or timeout
      // The Firebase listener will handle the reveal logic
    },

    nextRound: () => {
      const { config } = get();
      set((state) => ({
        currentRound: state.currentRound + 1,
        phase: "countdown",
        countdown: 3,
        selectionTimer: config.waitTime * 1000,
        playerChoice: null,
        opponentChoice: null,
        roundWinner: null,
        playerAnimation: "idle",
        opponentAnimation: "idle",
      }));
    },

    resetGame: () => {
      const { config, roomId, player, opponent, isHost } = get();
      set({
        ...initialState,
        config,
        roomId,
        player,
        opponent,
        isHost,
        selectionTimer: config.waitTime * 1000,
      });
    },

    leaveGame: () => {
      set(initialState);
    },

    setPlayerReady: () => {
      // This will be handled by Firebase sync
      // The actual ready state is managed in Firebase
    },

    // Timer controls
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

    // State setters
    setPhase: (phase) => {
      set({ phase });
    },

    setChoices: (playerChoice, opponentChoice) => {
      set({ playerChoice, opponentChoice });
    },

    setAnimations: (playerAnimation, opponentAnimation) => {
      set({ playerAnimation, opponentAnimation });
    },

    finishRound: (roundWinner) => {
      const state = get();
      const updatedPlayerScore =
        roundWinner === "player" ? state.playerScore + 1 : state.playerScore;
      const updatedOpponentScore =
        roundWinner === "opponent"
          ? state.opponentScore + 1
          : state.opponentScore;

      // Check if game is finished
      if (state.currentRound >= state.config.rounds) {
        let gameWinner: "player" | "opponent" | "draw";
        if (updatedPlayerScore > updatedOpponentScore) {
          gameWinner = "player";
        } else if (updatedOpponentScore > updatedPlayerScore) {
          gameWinner = "opponent";
        } else {
          gameWinner = "draw";
        }

        set({
          roundWinner,
          playerScore: updatedPlayerScore,
          opponentScore: updatedOpponentScore,
          phase: "finished",
          gameWinner,
        });
      } else {
        set({
          roundWinner,
          playerScore: updatedPlayerScore,
          opponentScore: updatedOpponentScore,
          phase: "result",
        });
      }
    },

    // Connection management
    setConnected: (connected: boolean) => {
      set({ isConnected: connected });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    // Firebase sync
    syncFromFirebase: (data: any) => {
      const state = get();
      const playerUid = state.player.uid;

      if (!data || !playerUid) return;

      // Determine opponent
      const opponentUid = data.players?.find(
        (uid: string) => uid !== playerUid
      );
      const opponent = opponentUid
        ? data.playerData?.[opponentUid] || null
        : null;

      // Map Firebase data to local state
      const updates: Partial<MultiplayerGameStore> = {
        opponent,
        currentRound: data.currentRound || 1,
        playerScore: data.scores?.[playerUid] || 0,
        opponentScore: opponentUid ? data.scores?.[opponentUid] || 0 : 0,
        phase: data.phase || "waiting",
        countdown: data.countdown || 3,
        selectionTimer: data.selectionTimer || state.config.waitTime * 1000,
        playerChoice: data.choices?.[playerUid] || null,
        opponentChoice: opponentUid
          ? data.choices?.[opponentUid] || null
          : null,
        roundHistory: data.roundHistory || [],
        isHost: data.host === playerUid,
        playerReady: data.playerReady?.[playerUid] || false,
        opponentReady: opponentUid
          ? data.playerReady?.[opponentUid] || false
          : false,
        config: {
          rounds: data.rounds || 3,
          waitTime: data.waitTime || 3,
        },
      };

      // Update animations based on choices
      if (updates.playerChoice) {
        updates.playerAnimation = updates.playerChoice;
      }
      if (updates.opponentChoice) {
        updates.opponentAnimation = updates.opponentChoice;
      }

      set(updates);
    },
  }))
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
useMultiplayerGameStore.subscribe(
  (state) => state.phase,
  (phase) => {
    // Clear existing timers
    clearAllTimers();

    if (phase === "countdown") {
      countdownInterval = setInterval(() => {
        const state = useMultiplayerGameStore.getState();
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
        const state = useMultiplayerGameStore.getState();
        if (state.phase !== "playing") {
          clearAllTimers();
          return;
        }

        if (state.selectionTimer > 0) {
          state.decrementSelectionTimer();
        } else {
          // Time's up! This will be handled by Firebase sync
          clearAllTimers();
        }
      }, 17); // ~60fps updates for smooth timer
    }
  }
);

// Cleanup function
export const cleanupMultiplayerTimers = clearAllTimers;
