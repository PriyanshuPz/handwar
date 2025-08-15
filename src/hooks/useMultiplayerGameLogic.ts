import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Choice, GamePhase } from "./useGameLogic";
import type { GameRoom } from "../types";
import type { User } from "firebase/auth";

interface MultiplayerGameState {
  phase: GamePhase;
  countdown: number;
  selectionTimer: number;
  currentRound: number;
  playerChoices: { [uid: string]: Choice };
  roundWinner: string | null;
  gameWinner: string | null;
  scores: { [uid: string]: number };
  startTime: number | null;
  phaseStartTime: number | null;
}

export function useMultiplayerGameLogic(
  roomId: string,
  user: User | null,
  config: { rounds: number; waitTime: number }
) {
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [multiplayerState, setMultiplayerState] =
    useState<MultiplayerGameState>({
      phase: "waiting",
      countdown: 3,
      selectionTimer: 0,
      currentRound: 1,
      playerChoices: {},
      roundWinner: null,
      gameWinner: null,
      scores: {},
      startTime: null,
      phaseStartTime: null,
    });
  const [playerNames, setPlayerNames] = useState<{ [uid: string]: string }>({});
  const [isHost, setIsHost] = useState(false);

  // Listen to room changes
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = onSnapshot(
      doc(db, "gameRooms", roomId),
      async (_doc) => {
        if (_doc.exists()) {
          const roomData = { ..._doc.data(), id: _doc.id } as GameRoom;
          setGameRoom(roomData);
          setIsHost(roomData.host === user?.uid);

          // Sync multiplayer state
          setMultiplayerState((prev) => ({
            ...prev,
            phase: roomData.gamePhase || "waiting",
            countdown: roomData.countdown || 3,
            selectionTimer: roomData.selectionTimer || 0,
            currentRound: roomData.currentRound || 1,
            playerChoices: roomData.choices || {},
            roundWinner: roomData.roundWinner || null,
            gameWinner: roomData.gameWinner || null,
            scores: roomData.scores || {},
            startTime: roomData.phaseStartTime || null,
            phaseStartTime: roomData.phaseStartTime || null,
          }));

          // Fetch player names
          if (roomData.players) {
            const names: { [uid: string]: string } = {};
            for (const uid of roomData.players) {
              const userDocRef = doc(db, "users", uid);
              const userDoc = await getDoc(userDocRef);
              if (userDoc.exists()) {
                const userData = userDoc.data() as { username?: string };
                names[uid] = userData.username || "Player";
              }
            }
            setPlayerNames(names);
          }
        }
      }
    );

    return () => unsubscribe();
  }, [roomId, user]);

  // Handle countdown and timers (only host manages this)
  useEffect(() => {
    if (!isHost || !roomId) return;

    let interval: NodeJS.Timeout;

    if (
      multiplayerState.phase === "countdown" &&
      multiplayerState.countdown > 0
    ) {
      interval = setInterval(async () => {
        const newCountdown = multiplayerState.countdown - 1;
        await updateDoc(doc(db, "gameRooms", roomId), {
          countdown: newCountdown,
          phaseStartTime: Date.now(),
        });

        if (newCountdown === 0) {
          // Start playing phase
          await updateDoc(doc(db, "gameRooms", roomId), {
            gamePhase: "playing",
            selectionTimer: config.waitTime,
            phaseStartTime: Date.now(),
          });
        }
      }, 1000);
    } else if (
      multiplayerState.phase === "playing" &&
      multiplayerState.selectionTimer > 0
    ) {
      interval = setInterval(async () => {
        const newTimer = multiplayerState.selectionTimer - 1;
        await updateDoc(doc(db, "gameRooms", roomId), {
          selectionTimer: newTimer,
        });

        if (newTimer === 0) {
          // Time's up, reveal choices
          await revealChoices();
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isHost,
    multiplayerState.phase,
    multiplayerState.countdown,
    multiplayerState.selectionTimer,
    roomId,
    config.waitTime,
  ]);

  const makeChoice = useCallback(
    async (choice: Choice) => {
      if (!user || !roomId || multiplayerState.phase !== "playing") return;

      try {
        await updateDoc(doc(db, "gameRooms", roomId), {
          [`choices.${user.uid}`]: choice,
        });

        // Check if all players have made choices
        if (gameRoom && gameRoom.players.length === 2) {
          const choices = {
            ...multiplayerState.playerChoices,
            [user.uid]: choice,
          };
          const allPlayersChose = gameRoom.players.every((uid) => choices[uid]);

          if (allPlayersChose && isHost) {
            // All players chose, reveal immediately
            await revealChoices();
          }
        }
      } catch (error) {
        console.error("Error making choice:", error);
      }
    },
    [
      user,
      roomId,
      multiplayerState.phase,
      multiplayerState.playerChoices,
      gameRoom,
      isHost,
    ]
  );

  const revealChoices = useCallback(async () => {
    if (!isHost || !roomId || !gameRoom) return;

    try {
      // Calculate round winner
      const players = gameRoom.players;
      if (players.length === 2) {
        const [player1, player2] = players;
        const choice1 = multiplayerState.playerChoices[player1];
        const choice2 = multiplayerState.playerChoices[player2];

        let roundWinner = null;
        if (choice1 && choice2) {
          if (choice1 === choice2) {
            roundWinner = "draw";
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
        const newScores = { ...multiplayerState.scores };
        if (roundWinner && roundWinner !== "draw") {
          newScores[roundWinner] = (newScores[roundWinner] || 0) + 1;
        }

        await updateDoc(doc(db, "gameRooms", roomId), {
          gamePhase: "revealing",
          roundWinner,
          scores: newScores,
          phaseStartTime: Date.now(),
        });

        // After 3 seconds, show result or next round
        setTimeout(async () => {
          const maxScore = Math.ceil(config.rounds / 2);
          const gameWinner = Object.entries(newScores).find(
            ([_, score]) => score >= maxScore
          )?.[0];

          if (gameWinner || multiplayerState.currentRound >= config.rounds) {
            // Game finished
            await updateDoc(doc(db, "gameRooms", roomId), {
              gamePhase: "finished",
              gameWinner: gameWinner || "draw",
            });
          } else {
            // Next round
            await updateDoc(doc(db, "gameRooms", roomId), {
              gamePhase: "result",
              phaseStartTime: Date.now(),
            });
          }
        }, 3000);
      }
    } catch (error) {
      console.error("Error revealing choices:", error);
    }
  }, [isHost, roomId, gameRoom, multiplayerState, config.rounds]);

  const startRound = useCallback(async () => {
    if (!isHost || !roomId) return;

    try {
      await updateDoc(doc(db, "gameRooms", roomId), {
        gamePhase: "countdown",
        countdown: 3,
        choices: {},
        roundWinner: null,
        phaseStartTime: Date.now(),
      });
    } catch (error) {
      console.error("Error starting round:", error);
    }
  }, [isHost, roomId]);

  const nextRound = useCallback(async () => {
    if (!isHost || !roomId) return;

    try {
      await updateDoc(doc(db, "gameRooms", roomId), {
        currentRound: multiplayerState.currentRound + 1,
        gamePhase: "countdown",
        countdown: 3,
        choices: {},
        roundWinner: null,
        phaseStartTime: Date.now(),
      });
    } catch (error) {
      console.error("Error starting next round:", error);
    }
  }, [isHost, roomId, multiplayerState.currentRound]);

  const resetGame = useCallback(async () => {
    if (!isHost || !roomId || !gameRoom) return;

    try {
      const initialScores: { [uid: string]: number } = {};
      gameRoom.players.forEach((uid) => {
        initialScores[uid] = 0;
      });

      await updateDoc(doc(db, "gameRooms", roomId), {
        currentRound: 1,
        gamePhase: "waiting",
        countdown: 3,
        selectionTimer: 0,
        choices: {},
        roundWinner: null,
        gameWinner: null,
        scores: initialScores,
        phaseStartTime: Date.now(),
      });
    } catch (error) {
      console.error("Error resetting game:", error);
    }
  }, [isHost, roomId, gameRoom]);

  // Convert multiplayer state to single-player compatible format
  const gameState = {
    currentRound: multiplayerState.currentRound,
    playerScore: user ? multiplayerState.scores[user.uid] || 0 : 0,
    computerScore:
      user && gameRoom
        ? multiplayerState.scores[
            gameRoom.players.find((uid) => uid !== user.uid) || ""
          ] || 0
        : 0,
    countdown: multiplayerState.countdown,
    selectionTimer: multiplayerState.selectionTimer,
    phase: multiplayerState.phase,
    playerChoice: user
      ? multiplayerState.playerChoices[user.uid] || null
      : null,
    computerChoice:
      user && gameRoom
        ? multiplayerState.playerChoices[
            gameRoom.players.find((uid) => uid !== user.uid) || ""
          ] || null
        : null,
    roundWinner:
      multiplayerState.roundWinner === user?.uid
        ? "player"
        : multiplayerState.roundWinner === "draw"
        ? "draw"
        : "computer",
    gameWinner:
      multiplayerState.gameWinner === user?.uid
        ? "player"
        : multiplayerState.gameWinner === "draw"
        ? "draw"
        : "computer",
    playerAnimation: "idle" as const,
    computerAnimation: "idle" as const,
  };

  return {
    gameState,
    makeChoice,
    startRound,
    nextRound,
    resetGame,
    playerNames,
    isHost,
    gameRoom,
  };
}
