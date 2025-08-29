import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";

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

// Player state in the game
export class Player extends Schema {
  @type("string") id: string;
  @type("string") name: string = "Player";
  @type("boolean") isReady: boolean = false;
  @type("number") score: number = 0;
  @type("string") choice: Choice | null = null;
  @type("string") animation: AnimationState = "idle";
}

// Round result tracking
export class RoundResult extends Schema {
  @type("string") winner: string | "draw" | null = null; // player id or "draw"
  @type(["string"]) playerChoices = new ArraySchema<string>(); // Maps player id to their choice
}

// Game room state
export class GameRoomState extends Schema {
  // Room configuration
  @type("string") roomId: string;
  @type("string") accessCode: string; // For private room access
  @type("boolean") isPrivate: boolean = true;
  @type("number") maxRounds: number = 3;
  @type("number") waitTime: number = 3; // Seconds per round for selection

  // Players in the game
  @type({ map: Player }) players = new MapSchema<Player>();

  // Game state
  @type("string") phase: GamePhase = "waiting";
  @type("number") currentRound: number = 1;
  @type("number") countdown: number = 3;
  @type("number") selectionTimer: number = 3000; // milliseconds
  @type("boolean") gameStarted: boolean = false;

  // Round results history
  @type([RoundResult]) roundsHistory = new ArraySchema<RoundResult>();

  // Current round result
  @type("string") roundWinner: string | "draw" | null = null;
  @type("string") gameWinner: string | "draw" | null = null;
}
