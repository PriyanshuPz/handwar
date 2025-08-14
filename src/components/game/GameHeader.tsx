import { motion } from "framer-motion";

interface GameHeaderProps {
  currentRound: number;
  totalRounds: number;
  playerScore: number;
  computerScore: number;
}

export function GameHeader({
  currentRound,
  totalRounds,
  playerScore,
  computerScore,
}: GameHeaderProps) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="text-center"
    >
      <div className="flex justify-between items-center max-w-md mx-auto">
        <div className="text-lg font-game">
          Round {currentRound}/{totalRounds}
        </div>
        <div className="text-lg font-game">
          {playerScore} - {computerScore}
        </div>
      </div>
    </motion.div>
  );
}
