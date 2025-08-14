import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameLogic } from "../hooks/useGameLogic";
import type { Choice } from "../hooks/useGameLogic";
import {
  HandSprite,
  GameHeader,
  GameStatus,
  ActionButtons,
  GameResultDialog,
} from "./game";

export default function Room() {
  const navigate = useNavigate();
  const [config, setConfig] = useState({ rounds: 3, waitTime: 3 });
  const { gameState, makeChoice, startRound, nextRound, resetGame } =
    useGameLogic(config);

  useEffect(() => {
    // Get config from sessionStorage
    const savedConfig = sessionStorage.getItem("gameConfig");
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      setConfig(parsedConfig);
    } else {
      // No config found, redirect to home
      navigate("/");
    }
  }, [navigate]);

  const handleChoice = (choice: Choice) => {
    makeChoice(choice);
  };

  const handleNextRound = () => {
    nextRound();
  };

  const handleReplay = () => {
    resetGame();
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="h-screen bg-primary p-6 flex flex-col justify-between overflow-hidden">
      <GameHeader
        currentRound={gameState.currentRound}
        totalRounds={config.rounds}
        playerScore={gameState.playerScore}
        computerScore={gameState.computerScore}
      />

      <div className="flex-1 flex flex-col justify-between items-center">
        <div className="flex justify-center">
          <HandSprite
            className="relative -mt-10"
            animation={gameState.computerAnimation}
            isPlayer={false}
          />
        </div>

        {/* Center Status */}
        <div className="text-center">
          <GameStatus
            phase={gameState.phase}
            countdown={gameState.countdown}
            selectionTimer={gameState.selectionTimer}
            currentRound={gameState.currentRound}
            totalRounds={config.rounds}
            roundWinner={gameState.roundWinner}
            onStartRound={startRound}
            onNextRound={handleNextRound}
          />
        </div>

        {/* Player Hand */}
        <div className="relative flex justify-center">
          <HandSprite animation={gameState.playerAnimation} isPlayer={true} />
        </div>
        <ActionButtons
          isVisible={gameState.phase === "playing"}
          onChoiceSelect={handleChoice}
          disabled={gameState.selectionTimer <= 0}
        />
      </div>

      {/* Result Dialog */}
      <GameResultDialog
        isOpen={gameState.phase === "finished"}
        onClose={() => {}}
        gameWinner={gameState.gameWinner}
        playerScore={gameState.playerScore}
        computerScore={gameState.computerScore}
        totalRounds={config.rounds}
        onReplay={handleReplay}
        onGoHome={handleGoHome}
      />
    </div>
  );
}
