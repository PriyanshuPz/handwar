import type { Choice } from "../types";

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

export function generateComputerChoice(): Choice {
  //  make it more fun
  const choices: Choice[] = ["rock", "paper", "scissors"];

  const randomness = Math.random();
  return choices[Math.floor(randomness * choices.length)];
}

export function getDefaultChoice(): Choice {
  return "rock"; // Default choice when time runs out
}
