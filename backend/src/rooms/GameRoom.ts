import { Room, Client, Delayed } from "@colyseus/core";
import {
  GameRoomState,
  Player,
  RoundResult,
  Choice,
} from "./schema/GameRoomState";
import { generateRandomCode } from "../utils/roomUtils";

import { ArraySchema } from "@colyseus/schema";

const winMap: Record<Choice, Choice> = {
  rock: "scissors",
  paper: "rock",
  scissors: "paper",
};

function getWinner(
  player1Choice: Choice,
  player2Choice: Choice
): "player1" | "player2" | "draw" {
  if (player1Choice === player2Choice) return "draw";
  return winMap[player1Choice] === player2Choice ? "player1" : "player2";
}

export class GameRoom extends Room<GameRoomState> {
  maxClients = 2; // For 1v1 gameplay
  autoDispose = false; // Don't dispose room when empty, keep it alive for private rooms

  // Public property for room filtering
  public accessCode: string;

  // Room timers
  private countdownInterval: Delayed;
  private selectionInterval: Delayed;

  onCreate(options: {
    isPrivate?: boolean;
    maxRounds?: number;
    waitTime?: number;
    accessCode?: string; // Allow passing a specific access code (useful for rejoining)
  }) {
    // Initialize room state
    this.state = new GameRoomState();

    // Set up room configuration
    this.state.isPrivate =
      options.isPrivate !== undefined ? options.isPrivate : true;
    this.state.maxRounds = options.maxRounds || 3;
    this.state.waitTime = options.waitTime || 3;
    this.state.selectionTimer = this.state.waitTime * 1000;
    this.state.roomId = this.roomId;

    // Generate access code for private rooms or use provided one
    if (this.state.isPrivate) {
      this.state.accessCode = options.accessCode || generateRandomCode(6); // 6-character code

      // Set metadata that will be shared with the lobby
      const metadata = {
        accessCode: this.state.accessCode,
        isPrivate: this.state.isPrivate,
        phase: this.state.phase,
        gameStarted: this.state.gameStarted,
      };

      console.log(
        `[GAME] Room ${this.roomId} created with access code: ${this.state.accessCode}`
      );
      console.log(`[GAME] Setting metadata:`, JSON.stringify(metadata));

      this.setMetadata(metadata);

      // Important: Make the accessCode available at the room level for filtering
      this.accessCode = this.state.accessCode;

      // Double-check metadata was set correctly
      console.log(
        `[GAME] Metadata after setting:`,
        JSON.stringify(this.metadata)
      );
    } else {
      // Set metadata for public rooms as well
      this.setMetadata({
        isPrivate: false,
        phase: this.state.phase,
        gameStarted: this.state.gameStarted,
      });
    }

    // Handle player choice message
    this.onMessage("make-choice", (client, message: { choice: Choice }) => {
      if (this.state.phase !== "playing") return;

      const player = this.state.players.get(client.sessionId);
      if (!player || player.choice) return; // Prevent multiple choices

      player.choice = message.choice;
      player.animation = message.choice;

      // Check if all players made their choices
      this.checkAllPlayersChosen();
    });

    // Handle player ready message
    this.onMessage("player-ready", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.isReady = true;

        // Check if all players are ready to start
        this.checkAllPlayersReady();
      }
    });

    // Handle player name update
    this.onMessage("update-name", (client, message: { name: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.name = message.name;
      }
    });

    // Handle next round request
    this.onMessage("next-round", (client) => {
      // Only host (first player) can advance rounds
      const playerIds = Array.from(this.state.players.keys());
      if (playerIds[0] === client.sessionId && this.state.phase === "result") {
        this.startNextRound();
      }
    });

    // Handle restart game request
    this.onMessage("restart-game", (client) => {
      // Only host (first player) can restart
      const playerIds = Array.from(this.state.players.keys());
      if (
        playerIds[0] === client.sessionId &&
        this.state.phase === "finished"
      ) {
        this.resetGame();
      }
    });

    // Make sure the room is registered with the presence system
    this.presence.publish("room_created", {
      roomId: this.roomId,
      accessCode: this.state.accessCode,
      isPrivate: this.state.isPrivate,
    });

    console.log(
      `Room ${this.roomId} created! Access code: ${this.state.accessCode}`
    );

    // Debug presence system
    this.presence.subscribe("rooms", (rooms: any[]) => {
      console.log(
        `[GAME] Presence rooms update in GameRoom ${this.roomId}: ${rooms.length} rooms total`
      );
    });
  }

  onJoin(client: Client, options: { accessCode?: string; name?: string }) {
    console.log(
      `[GAME] Client ${client.sessionId} attempting to join room ${this.roomId}`
    );
    console.log(
      `[GAME] Room state: accessCode=${this.state.accessCode}, isPrivate=${this.state.isPrivate}, players=${this.state.players.size}`
    );
    console.log(`[GAME] Join options:`, JSON.stringify(options));

    // For private rooms, verify access code - but ONLY if the room already has players
    // The first player (creator) doesn't need to provide an access code
    if (
      this.state.isPrivate &&
      this.state.accessCode &&
      this.state.players.size > 0
    ) {
      // Properly compare the access codes, considering null/undefined values
      const providedCode = options.accessCode || "";
      const roomCode = this.state.accessCode || "";

      console.log(
        `[GAME] Comparing access codes: provided=${providedCode}, expected=${roomCode}`
      );

      if (providedCode.toUpperCase() !== roomCode.toUpperCase()) {
        console.log(
          `[GAME] Access code mismatch: provided ${providedCode}, expected ${roomCode}`
        );
        throw new Error("Invalid access code");
      } else {
        console.log(
          `[GAME] Access code match! Client ${client.sessionId} joining with valid code`
        );
      }
    } else if (this.state.isPrivate && this.state.players.size === 0) {
      console.log(
        `[GAME] First player joining private room, no code verification needed`
      );
    } else {
      console.log(`[GAME] Player joining public room`);
    }

    // Add player to room
    const player = new Player();
    player.id = client.sessionId;
    player.name = options.name || `Player ${this.state.players.size + 1}`;

    this.state.players.set(client.sessionId, player);

    console.log(
      `${player.name} (${client.sessionId}) joined room ${this.roomId}`
    );

    // Automatically mark player as ready if they're joining an empty room
    if (this.state.players.size === 1) {
      player.isReady = true;
    }

    // Update metadata with current player count
    this.setMetadata({
      playerCount: this.state.players.size,
      isFull: this.state.players.size >= this.maxClients,
    });
  }

  onLeave(client: Client, consented: boolean) {
    const player = this.state.players.get(client.sessionId);

    if (player) {
      console.log(
        `${player.name} (${client.sessionId}) left room ${this.roomId}`
      );

      // If game is in progress, end it
      if (
        ["countdown", "playing", "revealing", "result"].includes(
          this.state.phase
        )
      ) {
        this.endGame("opponent-left");
      }

      // Remove player from room
      this.state.players.delete(client.sessionId);

      // Update metadata with current player count
      this.setMetadata({
        playerCount: this.state.players.size,
        isFull: false,
      });
    }

    // If the room is empty and private, let it stay for a while so players can rejoin
    if (this.state.players.size === 0) {
      // Update metadata to show room is empty
      this.setMetadata({
        playerCount: 0,
        isFull: false,
        isEmpty: true,
      });

      // Keep private rooms alive for 10 minutes, then dispose if still empty
      if (this.state.isPrivate) {
        this.clock.setTimeout(() => {
          if (this.state.players.size === 0) {
            this.disconnect();
          }
        }, 10 * 60 * 1000); // 10 minutes
      } else {
        // For public rooms, dispose immediately if empty
        this.disconnect();
      }
    }
  }

  onDispose() {
    // Clear any active timers
    this.clearAllTimers();
    console.log(`Room ${this.roomId} disposing...`);
  }

  // Game logic methods

  private checkAllPlayersReady() {
    // Only proceed if we have exactly 2 players who are both ready
    if (this.state.players.size !== 2) return;

    let allReady = true;
    this.state.players.forEach((player) => {
      if (!player.isReady) allReady = false;
    });

    if (allReady && this.state.phase === "waiting") {
      this.startGame();
    }
  }

  private startGame() {
    this.state.gameStarted = true;

    // Update metadata for lobby
    this.setMetadata({
      gameStarted: true,
      phase: "starting",
    });

    this.startRound();
  }

  private startRound() {
    // Reset round state
    this.state.phase = "countdown";
    this.state.countdown = 3;

    // Reset player choices and animations
    this.state.players.forEach((player) => {
      player.choice = null;
      player.animation = "idle";
    });

    // Update metadata for lobby
    this.setMetadata({ phase: this.state.phase });

    // Start countdown
    this.startCountdown();
  }

  private startCountdown() {
    this.clearAllTimers();

    // Create countdown timer (1 second intervals)
    this.countdownInterval = this.clock.setInterval(() => {
      this.state.countdown--;

      if (this.state.countdown <= 0) {
        this.clearAllTimers();
        this.startPlaying();
      }
    }, 1000);
  }

  private startPlaying() {
    this.state.phase = "playing";
    this.state.selectionTimer = this.state.waitTime * 1000;

    // Update metadata for lobby
    this.setMetadata({ phase: this.state.phase });

    // Create selection timer (60fps for smooth updates)
    this.selectionInterval = this.clock.setInterval(() => {
      this.state.selectionTimer = Math.max(0, this.state.selectionTimer - 17);

      if (this.state.selectionTimer <= 0) {
        this.clearAllTimers();
        this.handleTimeOut();
      }
    }, 17); // ~60fps
  }

  private handleTimeOut() {
    this.state.phase = "timeout";

    // Update metadata for lobby
    this.setMetadata({ phase: this.state.phase });

    // For players who didn't make a choice, default to rock
    this.state.players.forEach((player) => {
      if (!player.choice) {
        player.choice = "rock";
        player.animation = "rock";
      }
    });

    // Show timeout for 2 seconds, then reveal result
    this.clock.setTimeout(() => {
      this.revealResults();
    }, 2000);
  }

  private checkAllPlayersChosen() {
    let allChosen = true;
    this.state.players.forEach((player) => {
      if (!player.choice) allChosen = false;
    });

    if (allChosen) {
      this.clearAllTimers();
      this.state.phase = "revealing";

      // Update metadata for lobby
      this.setMetadata({ phase: this.state.phase });

      // Wait 2 seconds to reveal the results (for animation)
      this.clock.setTimeout(() => {
        this.revealResults();
      }, 2000);
    }
  }

  private revealResults() {
    // Get player choices
    const playerIds = Array.from(this.state.players.keys());
    const player1 = this.state.players.get(playerIds[0]);
    const player2 = this.state.players.get(playerIds[1]);

    if (!player1 || !player2 || !player1.choice || !player2.choice) {
      return; // Should never happen, but just in case
    }

    // Determine winner
    const result = getWinner(player1.choice, player2.choice);

    let roundWinner: string | "draw" | null;
    if (result === "draw") {
      roundWinner = "draw";
    } else if (result === "player1") {
      roundWinner = playerIds[0];
      player1.score++;
    } else {
      roundWinner = playerIds[1];
      player2.score++;
    }

    // Record round result
    const roundResult = new RoundResult();
    roundResult.winner = roundWinner;
    roundResult.playerChoices.push(player1.choice, player2.choice);
    this.state.roundsHistory.push(roundResult);

    this.state.roundWinner = roundWinner;

    // Check if game is finished
    if (this.state.currentRound >= this.state.maxRounds) {
      this.finishGame();
    } else {
      this.state.phase = "result";

      // Update metadata for lobby
      this.setMetadata({ phase: this.state.phase });
    }
  }

  private startNextRound() {
    this.state.currentRound++;
    this.startRound();
  }

  private finishGame() {
    // Determine game winner
    const playerIds = Array.from(this.state.players.keys());
    const player1 = this.state.players.get(playerIds[0]);
    const player2 = this.state.players.get(playerIds[1]);

    if (!player1 || !player2) return;

    let gameWinner: string | "draw" | null;
    if (player1.score > player2.score) {
      gameWinner = playerIds[0];
    } else if (player2.score > player1.score) {
      gameWinner = playerIds[1];
    } else {
      gameWinner = "draw";
    }

    this.state.gameWinner = gameWinner;
    this.state.phase = "finished";

    // Update metadata for lobby
    this.setMetadata({
      phase: this.state.phase,
      gameWinner:
        gameWinner !== "draw"
          ? gameWinner === playerIds[0]
            ? player1.name
            : player2.name
          : "draw",
    });
  }

  private endGame(reason: string) {
    this.clearAllTimers();

    // You could add more state here to indicate why the game ended
    this.state.phase = "finished";

    // Update metadata for lobby
    this.setMetadata({
      phase: this.state.phase,
      endReason: reason,
    });
  }

  private resetGame() {
    this.clearAllTimers();

    // Reset game state
    this.state.currentRound = 1;
    this.state.phase = "waiting";
    this.state.gameWinner = null;
    this.state.roundWinner = null;
    this.state.roundsHistory = new ArraySchema<RoundResult>(); // This is provided by @colyseus/schema
    this.state.gameStarted = false;

    // Reset player state
    this.state.players.forEach((player) => {
      player.score = 0;
      player.choice = null;
      player.animation = "idle";
      player.isReady = false;
    });

    // Update metadata for lobby
    this.setMetadata({
      phase: this.state.phase,
      gameStarted: false,
      gameWinner: null,
      endReason: null,
    });
  }

  private clearAllTimers() {
    if (this.countdownInterval) {
      this.countdownInterval.clear();
    }

    if (this.selectionInterval) {
      this.selectionInterval.clear();
    }
  }
}
