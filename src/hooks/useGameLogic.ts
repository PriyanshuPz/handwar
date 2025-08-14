import { useState, useEffect, useCallback } from "react";

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

const winMap: Record<Choice, Choice> = {
  rock: "scissors",
  paper: "rock",
  scissors: "paper",
};

export function getWinner(
  player: Choice,
  opponent: Choice
): "player" | "opponent" | "draw" {
  if (player === opponent) return "draw";
  return winMap[player] === opponent ? "player" : "opponent";
}

interface GameConfig {
  rounds: number;
  waitTime: number;
}

interface GameState {
  currentRound: number;
  playerScore: number;
  computerScore: number;
  countdown: number;
  selectionTimer: number;
  phase: GamePhase;
  playerChoice: Choice | null;
  computerChoice: Choice | null;
  roundWinner: "player" | "computer" | "draw" | null;
  gameWinner: "player" | "computer" | "draw" | null;
  playerAnimation: AnimationState;
  computerAnimation: AnimationState;
}

export function useGameLogic(config: GameConfig) {
  const [gameState, setGameState] = useState<GameState>({
    currentRound: 1,
    playerScore: 0,
    computerScore: 0,
    countdown: 3,
    selectionTimer: config.waitTime,
    phase: "waiting",
    playerChoice: null,
    computerChoice: null,
    roundWinner: null,
    gameWinner: null,
    playerAnimation: "idle",
    computerAnimation: "idle",
  });

  const resetGame = useCallback(() => {
    setGameState({
      currentRound: 1,
      playerScore: 0,
      computerScore: 0,
      countdown: 3,
      selectionTimer: config.waitTime,
      phase: "waiting",
      playerChoice: null,
      computerChoice: null,
      roundWinner: null,
      gameWinner: null,
      playerAnimation: "idle",
      computerAnimation: "idle",
    });
  }, [config.waitTime]);

  const startRound = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      phase: "countdown",
      countdown: 3,
      selectionTimer: config.waitTime,
      playerChoice: null,
      computerChoice: null,
      roundWinner: null,
      playerAnimation: "idle",
      computerAnimation: "idle",
    }));
  }, [config.waitTime]);

  const makeChoice = useCallback(
    (choice: Choice) => {
      if (gameState.phase !== "playing") return;

      const computerChoices: Choice[] = ["rock", "paper", "scissors"];
      const computerChoice = computerChoices[Math.floor(Math.random() * 3)];

      setGameState((prev) => ({
        ...prev,
        playerChoice: choice,
        computerChoice,
        phase: "revealing",
        playerAnimation: choice,
        computerAnimation: computerChoice,
      }));

      // Show animations for 2 seconds, then reveal result
      setTimeout(() => {
        const winner = getWinner(choice, computerChoice);
        let roundWinner: "player" | "computer" | "draw";

        if (winner === "player") roundWinner = "player";
        else if (winner === "opponent") roundWinner = "computer";
        else roundWinner = "draw";

        setGameState((prev) => {
          const updatedState = {
            ...prev,
            roundWinner,
            playerScore:
              roundWinner === "player"
                ? prev.playerScore + 1
                : prev.playerScore,
            computerScore:
              roundWinner === "computer"
                ? prev.computerScore + 1
                : prev.computerScore,
            phase: "result" as GamePhase,
          };

          // Check if game is finished
          if (updatedState.currentRound >= config.rounds) {
            let gameWinner: "player" | "computer" | "draw";
            if (updatedState.playerScore > updatedState.computerScore)
              gameWinner = "player";
            else if (updatedState.computerScore > updatedState.playerScore)
              gameWinner = "computer";
            else gameWinner = "draw";

            return {
              ...updatedState,
              phase: "finished",
              gameWinner,
            };
          }

          return updatedState;
        });
      }, 2000);
    },
    [gameState.phase, config.rounds]
  );

  const nextRound = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      currentRound: prev.currentRound + 1,
      phase: "countdown",
      countdown: 3,
      selectionTimer: config.waitTime,
      playerChoice: null,
      computerChoice: null,
      roundWinner: null,
      playerAnimation: "idle",
      computerAnimation: "idle",
    }));
  }, [config.waitTime]);

  // Countdown timer
  useEffect(() => {
    if (gameState.phase === "countdown" && gameState.countdown > 0) {
      const timer = setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          countdown: prev.countdown - 1,
        }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState.phase === "countdown" && gameState.countdown === 0) {
      setGameState((prev) => ({
        ...prev,
        phase: "playing",
        selectionTimer: config.waitTime,
      }));
    }
  }, [gameState.phase, gameState.countdown, config.waitTime]);

  // Selection timer - give user time to make choice
  useEffect(() => {
    if (gameState.phase === "playing" && gameState.selectionTimer > 0) {
      const timer = setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          selectionTimer: prev.selectionTimer - 1,
        }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (
      gameState.phase === "playing" &&
      gameState.selectionTimer === 0
    ) {
      // Time's up! Auto-select rock for player and computer choice
      const computerChoices: Choice[] = ["rock", "paper", "scissors"];
      const computerChoice = computerChoices[Math.floor(Math.random() * 3)];
      const playerChoice = "rock"; // Default choice when time runs out

      setGameState((prev) => ({
        ...prev,
        playerChoice,
        computerChoice,
        phase: "timeout",
        playerAnimation: playerChoice,
        computerAnimation: computerChoice,
      }));

      // Show timeout message and then reveal results
      setTimeout(() => {
        const winner = getWinner(playerChoice, computerChoice);
        let roundWinner: "player" | "computer" | "draw";

        if (winner === "player") roundWinner = "player";
        else if (winner === "opponent") roundWinner = "computer";
        else roundWinner = "draw";

        setGameState((prev) => {
          const updatedState = {
            ...prev,
            roundWinner,
            playerScore:
              roundWinner === "player"
                ? prev.playerScore + 1
                : prev.playerScore,
            computerScore:
              roundWinner === "computer"
                ? prev.computerScore + 1
                : prev.computerScore,
            phase: "result" as GamePhase,
          };

          // Check if game is finished
          if (updatedState.currentRound >= config.rounds) {
            let gameWinner: "player" | "computer" | "draw";
            if (updatedState.playerScore > updatedState.computerScore)
              gameWinner = "player";
            else if (updatedState.computerScore > updatedState.playerScore)
              gameWinner = "computer";
            else gameWinner = "draw";

            return {
              ...updatedState,
              phase: "finished",
              gameWinner,
            };
          }

          return updatedState;
        });
      }, 2000);
    }
  }, [
    gameState.phase,
    gameState.selectionTimer,
    config.waitTime,
    config.rounds,
  ]);

  return {
    gameState,
    makeChoice,
    startRound,
    nextRound,
    resetGame,
  };
}
