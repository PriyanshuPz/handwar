import { motion } from "framer-motion";
import type { GamePhase } from "../../hooks/useGameLogic";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";

interface GameStatusProps {
  phase: GamePhase;
  countdown: number;
  selectionTimer: number;
  currentRound: number;
  totalRounds: number;
  roundWinner: "player" | "computer" | "draw" | null;
  onStartRound: () => void;
  onNextRound: () => void;
}

export function GameStatus({
  phase,
  countdown,
  selectionTimer,
  currentRound,
  totalRounds,
  roundWinner,
  onStartRound,
  onNextRound,
}: GameStatusProps) {
  const navigator = useNavigate();

  const backToHome = () => {
    navigator("/");
  };

  const getCountdownDisplay = () => {
    if (countdown === 0) return "GO!";
    return countdown.toString();
  };

  const getRoundResultMessage = () => {
    if (roundWinner === "player") return "You Won This Round!";
    if (roundWinner === "computer") return "Computer Won This Round!";
    if (roundWinner === "draw") return "This Round is a Draw!";
    return "";
  };

  const getRoundResultColor = () => {
    if (roundWinner === "player") return "text-green-500";
    if (roundWinner === "computer") return "text-red-500";
    return "text-yellow-500";
  };

  switch (phase) {
    case "waiting":
      return (
        <Button
          onClick={onStartRound}
          className="bg-green-500 text-white text-xl px-8"
        >
          Start Round {currentRound}
        </Button>
      );

    case "countdown":
      return (
        <motion.div
          key={countdown}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-6xl font-game text-red-500"
        >
          {getCountdownDisplay()}
        </motion.div>
      );

    case "playing":
      return (
        <div className="text-center space-y-2">
          <div className="text-2xl font-game text-blue-500">
            Choose your move!
          </div>
          <motion.div
            className="text-lg font-game text-red-500"
            animate={selectionTimer <= 2 ? { scale: [1, 1.2, 1] } : {}}
            transition={{
              duration: 0.5,
              repeat: selectionTimer <= 2 ? Infinity : 0,
            }}
          >
            Time: {selectionTimer}s
          </motion.div>
        </div>
      );

    case "revealing":
      return (
        <div className="text-2xl font-game text-yellow-500">Revealing...</div>
      );

    case "timeout":
      return (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-2xl font-game text-red-500"
        >
          Time's Up! Auto-selected Rock
        </motion.div>
      );

    case "result":
      return (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-4"
        >
          <div className={`text-3xl font-game ${getRoundResultColor()}`}>
            {getRoundResultMessage()}
          </div>

          {currentRound < totalRounds && (
            <Button onClick={onNextRound} className="bg-blue-500 text-white">
              Next Round
            </Button>
          )}
          <Button onClick={backToHome} className="bg-gray-500 text-white">
            Back to Home
          </Button>
        </motion.div>
      );

    default:
      return null;
  }
}
