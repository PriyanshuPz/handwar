import type { Choice } from "../types";

const winMap: Record<Choice, Choice> = {
  rock: "scissors",
  paper: "rock",
  scissors: "paper",
};

export function getWinner(
  playerChoice: Choice,
  opponentChoice: Choice
): "player" | "opponent" | "draw" {
  if (playerChoice === opponentChoice) {
    return "draw";
  }

  if (winMap[playerChoice] === opponentChoice) {
    return "player";
  }

  return "opponent";
}

export function generateComputerChoice(): Choice {
  const choices: Choice[] = ["rock", "paper", "scissors"];
  return choices[Math.floor(Math.random() * choices.length)];
}

export function getDefaultChoice(): Choice {
  return "rock";
}
