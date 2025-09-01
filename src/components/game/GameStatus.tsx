import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { GamePhase } from "../../hooks/useGameLogic";
import { TapToPlayOverlay } from "./TapToPlayOverlay";
import { useSoundEffects } from "../../hooks/useSoundEffects";

interface GameStatusProps {
  phase: GamePhase;
  countdown: number;
  selectionTimer: number;
  currentRound: number;
  totalRounds: number;
  isHost?: boolean;
  roundWinner: string | null;
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
  isHost,
}: GameStatusProps) {
  const [gameStarted, setGameStarted] = useState(false);
  const {
    playCountdownBeep,
    playGoSound,
    playTapSound,
    playWinSound,
    playLoseSound,
    playDrawSound,
    playTimeoutWarning,
  } = useSoundEffects();

  // Sound effects based on phase changes
  useEffect(() => {
    if (!gameStarted) return;

    switch (phase) {
      case "countdown":
        if (countdown > 0) {
          playCountdownBeep();
        } else {
          playGoSound();
        }
        break;
      case "result":
        setTimeout(() => {
          if (roundWinner === "player") playWinSound();
          else if (roundWinner === "computer") playLoseSound();
          else if (roundWinner === "draw") playDrawSound();
        }, 300);
        break;
      case "timeout":
        playTimeoutWarning();
        break;
    }
  }, [
    phase,
    countdown,
    roundWinner,
    gameStarted,
    playCountdownBeep,
    playGoSound,
    playWinSound,
    playLoseSound,
    playDrawSound,
    playTimeoutWarning,
  ]);

  const handleTapToPlay = () => {
    playTapSound();
    setGameStarted(true);
    onStartRound();
  };

  const getCountdownDisplay = () => {
    if (countdown === 0) return "GO!";
    return countdown.toString();
  };

  const getRoundResultMessage = () => {
    if (roundWinner === "player") return "Victory!";
    if (roundWinner === "computer" || roundWinner == "opponent")
      return "Defeat!";
    if (roundWinner === "draw") return "Draw!";
    return "";
  };

  const renderPhaseContent = () => {
    switch (phase) {
      case "waiting":
        return (
          <TapToPlayOverlay
            isVisible={true}
            onTap={handleTapToPlay}
            isHost={isHost}
          />
        );

      case "countdown":
        return (
          <motion.div
            key={countdown}
            initial={{ scale: 0.3, opacity: 0, rotateY: -180 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{
              type: "spring",
              damping: 15,
              stiffness: 400,
              duration: 0.6,
            }}
            className="text-8xl font-game font-bold text-black drop-shadow-lg"
          >
            {getCountdownDisplay()}
          </motion.div>
        );

      case "playing": {
        const seconds = Math.floor(selectionTimer / 1000);
        const milliseconds = Math.floor((selectionTimer % 1000) / 10)
          .toString()
          .padStart(2, "0");
        const isLowTime = selectionTimer <= 2000;
        return (
          <div className="text-center space-y-4">
            <motion.div
              className="font-game font-bold text-5xl text-gray-800 tabular-nums"
              animate={
                isLowTime
                  ? {
                      scale: [1, 1.2, 1, 1.2, 1],
                      color: [
                        "#1f2937",
                        "#ef4444",
                        "#1f2937",
                        "#ef4444",
                        "#1f2937",
                      ],
                    }
                  : {}
              }
              transition={{
                duration: 0.7,
                repeat: isLowTime ? Infinity : 0,
              }}
            >
              {seconds}:{milliseconds}
            </motion.div>
            <div className="text-lg font-medium text-gray-600">
              Choose your move!
            </div>
          </div>
        );
      }

      case "revealing":
        return null;

      case "timeout":
        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-4"
          >
            <div className="text-xl font-game font-bold text-black">
              Time's Up!
            </div>
          </motion.div>
        );

      case "result":
        return (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer bg-black/10 backdrop-blur-sm"
            onClick={onNextRound}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center space-y-6"
              onClick={(e) => e.stopPropagation()} // Prevents click from bubbling to the overlay if clicking inside the popup
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-2"
              >
                <div className="text-3xl font-game font-bold text-black">
                  {getRoundResultMessage()}
                </div>
                <div className="text-gray-600 text-lg">
                  Round {currentRound} of {totalRounds}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                {currentRound < totalRounds && (
                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="text-gray-500 font-medium"
                  >
                    {isHost ? "Tap to continue" : "Waiting for host..."}
                  </motion.p>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return <>{renderPhaseContent()}</>;
}
