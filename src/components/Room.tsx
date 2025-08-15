import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameLogic } from "../hooks/useGameLogic";
import type { Choice } from "../hooks/useGameLogic";
import {
  HandSprite,
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
    <div className="h-screen flex flex-col justify-between overflow-hidden max-w-md mx-auto">
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
            animation={gameState.computerAnimation}
            isPlayer={false}
          />
        </div>

        <div className="text-center z-10">
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

        <div className="-mb-10">
          <HandSprite animation={gameState.playerAnimation} isPlayer={true} />
        </div>
        <ActionButtons
          isVisible={gameState.phase === "playing"}
          onChoiceSelect={handleChoice}
          disabled={
            gameState.selectionTimer <= 0 || gameState.phase !== "playing"
          }
        />
      </div>

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
