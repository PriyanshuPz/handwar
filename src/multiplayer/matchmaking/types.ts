export type Choice = "rock" | "paper" | "scissors";
export type AnimationState = "idle" | "rock" | "paper" | "scissors";
export type MultiplayerGamePhase =
  | "waiting"
  | "waiting_for_ready"
  | "countdown"
  | "playing"
  | "revealing"
  | "result"
  | "finished"
  | "timeout"
  | "opponent_disconnected";

export interface GameConfig {
  rounds: number;
  waitTime: number;
}

export interface PlayerData {
  uid: string;
  displayName: string;
  photoURL?: string;
}

export interface RoundResult {
  round: number;
  playerChoice: Choice | null;
  opponentChoice: Choice | null;
  winner: "player" | "opponent" | "draw" | null;
  timestamp: number;
}

export interface MultiplayerGameState {
  // Game configuration
  config: GameConfig;
  roomId: string;

  // Players
  player: PlayerData;
  opponent: PlayerData | null;

  // Round state
  currentRound: number;
  playerScore: number;
  opponentScore: number;

  // Timer state
  countdown: number;
  selectionTimer: number;

  // Game phase
  phase: MultiplayerGamePhase;

  // Choices
  playerChoice: Choice | null;
  opponentChoice: Choice | null;

  // Results
  roundWinner: "player" | "opponent" | "draw" | null;
  gameWinner: "player" | "opponent" | "draw" | null;
  roundHistory: RoundResult[];

  // Animations
  playerAnimation: AnimationState;
  opponentAnimation: AnimationState;

  // Connection state
  isConnected: boolean;
  isHost: boolean;

  // Player ready states
  playerReady: boolean;
  opponentReady: boolean;

  // Error state
  error: string | null;
}

export interface MultiplayerGameActions {
  // Game setup
  setRoomId: (roomId: string) => void;
  setPlayer: (player: PlayerData) => void;
  setOpponent: (opponent: PlayerData | null) => void;
  setConfig: (config: GameConfig) => void;
  setIsHost: (isHost: boolean) => void;

  // Game controls
  startRound: () => void;
  makeChoice: (choice: Choice) => void;
  nextRound: () => void;
  resetGame: () => void;
  leaveGame: () => void;

  // Timer controls
  decrementCountdown: () => void;
  decrementSelectionTimer: () => void;

  // State setters
  setPhase: (phase: MultiplayerGamePhase) => void;
  setChoices: (
    playerChoice: Choice | null,
    opponentChoice: Choice | null
  ) => void;
  setAnimations: (
    playerAnimation: AnimationState,
    opponentAnimation: AnimationState
  ) => void;
  finishRound: (roundWinner: "player" | "opponent" | "draw") => void;

  // Connection management
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;

  // Firebase sync
  syncFromFirebase: (data: any) => void;
}

export type MultiplayerGameStore = MultiplayerGameState &
  MultiplayerGameActions;

// Firebase game room structure
export interface FirebaseGameRoom {
  players: string[]; // Array of player UIDs
  playerData: Record<string, PlayerData>; // Player data by UID
  status: "waiting" | "playing" | "finished";
  currentRound: number;
  rounds: number;
  waitTime: number;
  scores: Record<string, number>; // Scores by UID
  choices: Record<string, Choice | null>; // Current round choices by UID
  playerReady: Record<string, boolean>; // Player ready states by UID
  roundHistory: RoundResult[];
  phase: MultiplayerGamePhase;
  countdown: number;
  selectionTimer: number;
  host: string; // Host UID
  createdAt: any; // Firestore timestamp
  lastActivity: any; // Firestore timestamp
}

// Matchmaking pool structure
export interface MatchmakingEntry {
  uid: string;
  playerData: PlayerData;
  status: "waiting" | "matched" | "timedout";
  gameConfig: GameConfig;
  timestamp: any; // Firestore timestamp
  gameRoomId?: string;
}
