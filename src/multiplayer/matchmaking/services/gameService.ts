import {
  collection,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  getDocs,
  limit,
  addDoc,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { TimerService } from "./timerService";
import type {
  FirebaseGameRoom,
  MatchmakingEntry,
  PlayerData,
  GameConfig,
  Choice,
} from "../types";

export class MultiplayerGameService {
  private roomId: string;
  private playerUid: string;
  private unsubscribeRoom: (() => void) | null = null;

  constructor(roomId: string, playerUid: string) {
    this.roomId = roomId;
    this.playerUid = playerUid;
  }

  // Create a new game room
  static async createRoom(
    hostData: PlayerData,
    config: GameConfig
  ): Promise<string> {
    const roomRef = await addDoc(collection(db, "gameRooms"), {
      players: [hostData.uid],
      playerData: { [hostData.uid]: hostData },
      status: "waiting",
      currentRound: 1,
      rounds: config.rounds,
      waitTime: config.waitTime,
      scores: { [hostData.uid]: 0 },
      choices: {},
      playerReady: {},
      roundHistory: [],
      phase: "waiting",
      countdown: 3,
      selectionTimer: config.waitTime * 1000,
      host: hostData.uid,
      createdAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
    } as Partial<FirebaseGameRoom>);

    return roomRef.id;
  }

  // Join an existing room
  async joinRoom(playerData: PlayerData): Promise<boolean> {
    try {
      const roomRef = doc(db, "gameRooms", this.roomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        throw new Error("Room not found");
      }

      const roomData = roomSnap.data() as FirebaseGameRoom;

      if (roomData.players.length >= 2) {
        throw new Error("Room is full");
      }

      if (roomData.status !== "waiting") {
        throw new Error("Game already in progress");
      }

      // Add player to room
      await updateDoc(roomRef, {
        players: [...roomData.players, playerData.uid],
        playerData: {
          ...roomData.playerData,
          [playerData.uid]: playerData,
        },
        scores: {
          ...roomData.scores,
          [playerData.uid]: 0,
        },
        lastActivity: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error("Error joining room:", error);
      return false;
    }
  }

  // Start the game (host only)
  async startGame(): Promise<void> {
    const roomRef = doc(db, "gameRooms", this.roomId);
    await updateDoc(roomRef, {
      status: "playing",
      phase: "waiting_for_ready",
      playerReady: {},
      lastActivity: serverTimestamp(),
    });
  }

  // Mark player as ready to start round
  async setPlayerReady(): Promise<void> {
    const roomRef = doc(db, "gameRooms", this.roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) return;

    const roomData = roomSnap.data() as FirebaseGameRoom;
    const newPlayerReady = { ...roomData.playerReady, [this.playerUid]: true };

    await updateDoc(roomRef, {
      [`playerReady.${this.playerUid}`]: true,
      lastActivity: serverTimestamp(),
    });

    // Check if both players are ready
    const players = roomData.players;
    if (players.length === 2) {
      const allReady = players.every((uid) => newPlayerReady[uid]);
      if (allReady) {
        // Start countdown when both players are ready
        await updateDoc(roomRef, {
          phase: "countdown",
          countdown: 3,
          selectionTimer: roomData.waitTime * 1000,
          playerReady: {},
          choices: {},
          lastActivity: serverTimestamp(),
        });

        // Start server-side countdown timer
        const timerService = new TimerService(this.roomId);
        await timerService.startCountdown();
      }
    }
  }

  // Make a choice in the current round
  async makeChoice(choice: Choice): Promise<void> {
    const roomRef = doc(db, "gameRooms", this.roomId);
    await updateDoc(roomRef, {
      [`choices.${this.playerUid}`]: choice,
      lastActivity: serverTimestamp(),
    });

    // Check if both players have made choices
    const roomSnap = await getDoc(roomRef);
    if (roomSnap.exists()) {
      const roomData = roomSnap.data() as FirebaseGameRoom;
      const choices = roomData.choices || {};
      const players = roomData.players;

      // Count how many players have made choices (excluding null)
      const choiceCount = players.filter((uid) => choices[uid] != null).length;

      if (choiceCount === 2) {
        // Both players chose, reveal choices immediately
        await this.revealChoices();
      }
    }
  }

  // Handle timeout - auto-assign choices for players who haven't chosen
  async handleTimeout(): Promise<void> {
    const roomRef = doc(db, "gameRooms", this.roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) return;

    const roomData = roomSnap.data() as FirebaseGameRoom;
    const choices = roomData.choices || {};
    const players = roomData.players;

    // Assign default choice (rock) to players who haven't chosen
    const updates: any = {
      phase: "revealing",
      lastActivity: serverTimestamp(),
    };

    players.forEach((uid) => {
      if (choices[uid] == null) {
        updates[`choices.${uid}`] = "rock";
      }
    });

    await updateDoc(roomRef, updates);

    // Finish round after animation delay
    setTimeout(async () => {
      await this.finishRound();
    }, 2000);
  }

  // Reveal choices and determine winner
  private async revealChoices(): Promise<void> {
    const roomRef = doc(db, "gameRooms", this.roomId);
    await updateDoc(roomRef, {
      phase: "revealing",
      lastActivity: serverTimestamp(),
    });

    // Wait 2 seconds for animation, then finish round
    setTimeout(async () => {
      await this.finishRound();
    }, 2000);
  }

  // Finish the current round
  private async finishRound(): Promise<void> {
    const roomRef = doc(db, "gameRooms", this.roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) return;

    const roomData = roomSnap.data() as FirebaseGameRoom;
    const players = roomData.players;
    const choices = roomData.choices || {};

    if (players.length !== 2) return;

    const [player1, player2] = players;
    const choice1 = choices[player1];
    const choice2 = choices[player2];

    // Determine round winner
    let roundWinner: string | null = null;
    if (choice1 && choice2) {
      if (choice1 === choice2) {
        roundWinner = null; // Draw
      } else if (
        (choice1 === "rock" && choice2 === "scissors") ||
        (choice1 === "paper" && choice2 === "rock") ||
        (choice1 === "scissors" && choice2 === "paper")
      ) {
        roundWinner = player1;
      } else {
        roundWinner = player2;
      }
    }

    // Update scores
    const newScores = { ...roomData.scores };
    if (roundWinner) {
      newScores[roundWinner] = (newScores[roundWinner] || 0) + 1;
    }

    // Create round result for history
    const roundResult = {
      round: roomData.currentRound,
      playerChoice: choice1,
      opponentChoice: choice2,
      winner:
        roundWinner === player1
          ? "player"
          : roundWinner === player2
          ? "opponent"
          : "draw",
      timestamp: Date.now(),
    };

    // Update round history
    const newRoundHistory = [...(roomData.roundHistory || []), roundResult];

    // Check if game is finished
    const isGameFinished = roomData.currentRound >= roomData.rounds;
    const newPhase = isGameFinished ? "finished" : "result";

    let gameWinner: string | null = null;
    if (isGameFinished) {
      const score1 = newScores[player1] || 0;
      const score2 = newScores[player2] || 0;
      if (score1 > score2) {
        gameWinner = player1;
      } else if (score2 > score1) {
        gameWinner = player2;
      }
      // Otherwise it's a draw (gameWinner remains null)
    }

    await updateDoc(roomRef, {
      scores: newScores,
      roundHistory: newRoundHistory,
      phase: newPhase,
      roundWinner,
      gameWinner,
      lastActivity: serverTimestamp(),
    });
  }

  // Start next round (host only)
  async nextRound(): Promise<void> {
    const roomRef = doc(db, "gameRooms", this.roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) return;

    const roomData = roomSnap.data() as FirebaseGameRoom;

    await updateDoc(roomRef, {
      currentRound: roomData.currentRound + 1,
      phase: "waiting_for_ready",
      countdown: 3,
      selectionTimer: roomData.waitTime * 1000,
      choices: {},
      playerReady: {},
      roundWinner: null,
      lastActivity: serverTimestamp(),
    });
  }

  // Leave the room
  async leaveRoom(): Promise<void> {
    const roomRef = doc(db, "gameRooms", this.roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) return;

    const roomData = roomSnap.data() as FirebaseGameRoom;
    const remainingPlayers = roomData.players.filter(
      (uid) => uid !== this.playerUid
    );

    if (remainingPlayers.length === 0) {
      // Delete room if no players left
      await deleteDoc(roomRef);
    } else {
      // Remove player from room
      const newPlayerData = { ...roomData.playerData };
      delete newPlayerData[this.playerUid];

      const newScores = { ...roomData.scores };
      delete newScores[this.playerUid];

      await updateDoc(roomRef, {
        players: remainingPlayers,
        playerData: newPlayerData,
        scores: newScores,
        phase: "opponent_disconnected",
        lastActivity: serverTimestamp(),
      });
    }
  }

  // Subscribe to room updates
  subscribeToRoom(
    callback: (data: FirebaseGameRoom | null) => void
  ): () => void {
    this.unsubscribeRoom = onSnapshot(
      doc(db, "gameRooms", this.roomId),
      (doc) => {
        if (doc.exists()) {
          callback(doc.data() as FirebaseGameRoom);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error("Error listening to room:", error);
        callback(null);
      }
    );

    return () => {
      if (this.unsubscribeRoom) {
        this.unsubscribeRoom();
        this.unsubscribeRoom = null;
      }
    };
  }

  // Cleanup
  cleanup(): void {
    if (this.unsubscribeRoom) {
      this.unsubscribeRoom();
      this.unsubscribeRoom = null;
    }
  }
}

// Matchmaking service
export class MatchmakingService {
  static async findMatch(
    playerData: PlayerData,
    config: GameConfig
  ): Promise<string | null> {
    try {
      // Look for waiting players with same config
      const q = query(
        collection(db, "matchmaking"),
        where("status", "==", "waiting"),
        where("gameConfig.rounds", "==", config.rounds),
        where("gameConfig.waitTime", "==", config.waitTime),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const waitingPlayer = querySnapshot.docs[0].data() as MatchmakingEntry;
        const waitingDoc = querySnapshot.docs[0];

        if (waitingPlayer.uid !== playerData.uid) {
          // Create game room with both players
          const roomId = await MultiplayerGameService.createRoom(
            waitingPlayer.playerData,
            config
          );

          // Add current player to room
          const gameService = new MultiplayerGameService(
            roomId,
            playerData.uid
          );
          await gameService.joinRoom(playerData);

          // Update waiting player's status
          await updateDoc(waitingDoc.ref, {
            status: "matched",
            gameRoomId: roomId,
          });

          // Clean up matchmaking entry after a delay
          setTimeout(async () => {
            try {
              await deleteDoc(waitingDoc.ref);
            } catch (error) {
              console.error("Error cleaning up matchmaking entry:", error);
            }
          }, 5000);

          return roomId;
        }
      }

      // No match found, add to waiting pool
      await addDoc(collection(db, "matchmaking"), {
        uid: playerData.uid,
        playerData,
        status: "waiting",
        gameConfig: config,
        timestamp: serverTimestamp(),
      } as Partial<MatchmakingEntry>);

      return null;
    } catch (error) {
      console.error("Error finding match:", error);
      throw error;
    }
  }

  static async cancelMatchmaking(playerUid: string): Promise<void> {
    try {
      const q = query(
        collection(db, "matchmaking"),
        where("uid", "==", playerUid),
        where("status", "==", "waiting")
      );

      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error canceling matchmaking:", error);
    }
  }

  static subscribeToMatchmaking(
    playerUid: string,
    callback: (roomId: string | null) => void
  ): () => void {
    const q = query(
      collection(db, "matchmaking"),
      where("uid", "==", playerUid),
      where("status", "==", "matched")
    );

    return onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach(async (doc) => {
        const data = doc.data() as MatchmakingEntry;
        if (data.gameRoomId) {
          callback(data.gameRoomId);
          // Clean up the matchmaking entry
          await deleteDoc(doc.ref);
        }
      });
    });
  }
}
