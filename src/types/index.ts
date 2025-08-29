import type { AnimationState, GamePhase } from "../singleplayer";

export type Choice = "rock" | "paper" | "scissors";

export interface Player {
  uid: string;
  username: string;
  email?: string;
}

export interface GameRoom {
  players: string[];
  status: "waiting" | "playing" | "finished";
  createdAt: any; // serverTimestamp
  rounds: 3 | 5 | 7;
  waitTime: 3 | 5;
  scores: { [uid: string]: number };
  currentRound: number;
  host: string;
  id: string;
  choices?: { [uid: string]: Choice };
  roundWinner?: string | null;
  gamePhase?:
    | "waiting"
    | "countdown"
    | "playing"
    | "revealing"
    | "result"
    | "finished"
    | "timeout";
  countdown?: number;
  selectionTimer?: number;
  gameWinner?: string | null;
  phaseStartTime?: number;
}

// Define interface for our game state
export type MultiplayerGameState = {
  phase: GamePhase;
  currentRound: number;
  maxRounds: number;
  countdown: number;
  selectionTimer: number;
  playerAnimation: AnimationState;
  opponentAnimation: AnimationState;
  playerScore: number;
  opponentScore: number;
  roundWinner: "player" | "opponent" | "draw" | null;
  gameWinner: "player" | "opponent" | "draw" | null;
  roundsHistory: Array<"player" | "opponent" | "draw" | null>;
  opponentName: string;
  opponentReady: boolean;
  playerReady: boolean;
};
