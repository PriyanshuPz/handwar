import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMultiplayerGameLogic } from "../hooks/useMultiplayerGameLogic";
import type { Choice } from "../hooks/useGameLogic";
import {
  HandSprite,
  GameStatus,
  ActionButtons,
  GameResultDialog,
} from "./game";
import { useAuth } from "../contexts/AuthContext";

export default function MultiplayerRoom() {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();

  // get config from navigation
  const [config, setConfig] = useState({
    rounds: 3,
    waitTime: 3,
    mode: "computer",
  });

  // Check if this is multiplayer mode
  useEffect(() => {
    if (roomId) {
      setConfig((prev) => ({ ...prev, mode: "online" }));
    } else {
      // Single player mode - get config from sessionStorage
      const savedConfig = sessionStorage.getItem("gameConfig");
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
      } else {
        // No config found, redirect to home
        navigate("/");
      }
    }
  }, [roomId, navigate]);

  const multiplayerLogic = useMultiplayerGameLogic(roomId || "", user, {
    rounds: config.rounds,
    waitTime: config.waitTime,
  });

  // Choose the appropriate logic based on mode
  const {
    gameState,
    makeChoice,
    startRound,
    nextRound,
    resetGame,
    playerNames = {},
  } = multiplayerLogic;

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
    resetGame();
    navigate("/");
  };

  const getOpponentName = () => {
    if (!user) return "Computer";
    if (multiplayerLogic.gameRoom) {
      const opponentUid = multiplayerLogic.gameRoom.players.find(
        (uid: string) => uid !== user.uid
      );
      return opponentUid ? playerNames[opponentUid] || "Opponent" : "Opponent";
    }
    return "Opponent";
  };

  const getPlayerName = () => {
    if (!user) return "Player";
    return playerNames[user.uid] || "You";
  };

  return (
    <div className="h-screen flex flex-col justify-between overflow-hidden max-w-md mx-auto">
      <div className="absolute top-[80%] left-0 -translate-y-1/2 -rotate-90 text-5xl font-game text-gray-300/60 tracking-widest opacity-80 select-none">
        {getPlayerName()}
      </div>
      <div className="absolute top-[20%] -right-0 -translate-y-1/2 rotate-90 text-5xl font-game text-gray-300/60 tracking-widest opacity-80 select-none">
        {getOpponentName()}
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
        onClose={() => {
          resetGame();
        }}
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
