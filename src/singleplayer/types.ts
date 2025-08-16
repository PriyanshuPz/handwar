export type Choice = "rock" | "paper" | "scissors";
export type AnimationState = "idle" | "rock" | "paper" | "scissors";
export type GamePhase =
  | "waiting"
  | "countdown"
  | "playing"
  | "revealing"
  | "result"
  | "finished"
  | "timeout";

export interface GameConfig {
  rounds: number;
  waitTime: number;
}

export interface SinglePlayerGameState {
  // Game configuration
  config: GameConfig;

  // Round state
  currentRound: number;
  playerScore: number;
  computerScore: number;

  // Timer state
  countdown: number;
  selectionTimer: number;

  // Game phase
  phase: GamePhase;

  // Choices
  playerChoice: Choice | null;
  computerChoice: Choice | null;

  // Results
  roundWinner: "player" | "opponent" | "draw" | null;
  gameWinner: "player" | "opponent" | "draw" | null;

  // Animations
  playerAnimation: AnimationState;
  computerAnimation: AnimationState;

  // Game started flag for sound effects
  gameStarted: boolean;
}

export type RoundResult = "player" | "opponent" | "draw" | null;

export interface SinglePlayerGameActions {
  // Game controls
  setConfig: (config: GameConfig) => void;
  startRound: () => void;
  makeChoice: (choice: Choice) => void;
  nextRound: () => void;
  resetGame: () => void;

  // Timer controls
  decrementCountdown: () => void;
  decrementSelectionTimer: () => void;

  // Phase transitions
  setPhase: (phase: GamePhase) => void;
  setGameStarted: (started: boolean) => void;

  // Internal state updates
  setChoices: (playerChoice: Choice, computerChoice: Choice) => void;
  setAnimations: (
    playerAnimation: AnimationState,
    computerAnimation: AnimationState
  ) => void;
  finishRound: (roundWinner: "player" | "opponent" | "draw") => void;

  chanceHistory: RoundResult[];

  setChanceHistory: (history: RoundResult[]) => void;
}

export type SinglePlayerGameStore = SinglePlayerGameState &
  SinglePlayerGameActions;
