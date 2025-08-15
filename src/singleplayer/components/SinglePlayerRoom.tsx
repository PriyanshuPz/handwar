import { useNavigate } from "react-router-dom";
import { useSinglePlayerGameStore } from "../store/gameStore";
import { useRefreshRecovery } from "../hooks/useRefreshRecovery";
import { RefreshRecoveryNotification } from "./RefreshRecoveryNotification";
import {
  HandSprite,
  GameStatus,
  ActionButtons,
  GameResultDialog,
} from "../../components/game";
import type { Choice } from "../types";
import { RoundIndicators } from "../../components/RoundIndicators";

export function SinglePlayerRoom() {
  const navigate = useNavigate();

  // Enable refresh recovery
  useRefreshRecovery();

  const {
    // State
    config,
    currentRound,
    playerScore,
    computerScore,
    countdown,
    selectionTimer,
    phase,
    roundWinner,
    gameWinner,
    playerAnimation,
    computerAnimation,
    chanceHistory,

    // Actions
    startRound,
    makeChoice,
    nextRound,
    resetGame,
    setGameStarted,
  } = useSinglePlayerGameStore();

  const handleChoice = (choice: Choice) => {
    if (phase !== "playing") return;
    makeChoice(choice);
  };

  const handleNextRound = () => {
    nextRound();
  };

  const handleReplay = () => {
    resetGame();
  };

  const handleGoHome = () => {
    resetGame();
    navigate("/");
  };

  const handleStartRound = () => {
    setGameStarted(true);
    startRound();
  };

  return (
    <div className="h-screen flex flex-col justify-between overflow-hidden max-w-md mx-auto">
      <RefreshRecoveryNotification />

      <div className="absolute top-[80%] left-0 -translate-y-1/2 -rotate-90 text-5xl font-game text-gray-300/60 tracking-widest opacity-80 select-none">
        Player
      </div>
      <div className="absolute top-[20%] -right-0 -translate-y-1/2 rotate-90 text-5xl font-game text-gray-300/60 tracking-widest opacity-80 select-none">
        Computer
      </div>

      <div className="flex-1 flex flex-col justify-between items-center">
        <div className="flex justify-center">
          <HandSprite
            className="relative"
            animation={computerAnimation}
            isPlayer={false}
          />
        </div>

        <div className="text-center z-10">
          <GameStatus
            phase={phase}
            countdown={countdown}
            selectionTimer={selectionTimer}
            currentRound={currentRound}
            totalRounds={config.rounds}
            roundWinner={roundWinner}
            onStartRound={handleStartRound}
            onNextRound={handleNextRound}
          />
        </div>

        <div className="-mb-10">
          <HandSprite animation={playerAnimation} isPlayer={true} />
        </div>

        <div>
          <RoundIndicators
            perspective="player"
            roundHistory={chanceHistory}
            totalRounds={config.rounds}
          />
        </div>

        <ActionButtons
          isVisible={phase === "playing"}
          onChoiceSelect={handleChoice}
          disabled={selectionTimer <= 0 || phase !== "playing"}
        />
      </div>

      <GameResultDialog
        isOpen={phase === "finished"}
        onClose={() => {
          resetGame();
        }}
        gameWinner={gameWinner}
        playerScore={playerScore}
        computerScore={computerScore}
        totalRounds={config.rounds}
        onReplay={handleReplay}
        onGoHome={handleGoHome}
      />
    </div>
  );
}
