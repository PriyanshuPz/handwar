import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useMultiplayerGameStore } from "../store/gameStore";
import { useMultiplayerGame } from "../hooks/useMultiplayerGame";
import { useHostTimers } from "../hooks/useHostTimers";
import {
  HandSprite,
  GameStatus,
  ActionButtons,
  GameResultDialog,
} from "../../../components/game";
import { RoundIndicators } from "../../../components/RoundIndicators";
import type { Choice } from "../types";

export function MultiplayerRoom() {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();

  const {
    // State
    config,
    currentRound,
    playerScore,
    opponentScore,
    countdown,
    selectionTimer,
    phase,
    roundWinner,
    gameWinner,
    playerAnimation,
    opponentAnimation,
    opponent,
    isConnected,
    isHost,
    error,
    roundHistory,

    // Actions
    setPlayer,
    setRoomId,
    resetGame,
    leaveGame,
  } = useMultiplayerGameStore();

  // Initialize game connection
  const gameService = useMultiplayerGame(roomId || "", user?.uid || "");

  // Host manages timers
  useHostTimers(roomId || "", gameService);

  // Set up player data
  useEffect(() => {
    if (user && roomId) {
      setRoomId(roomId);
      setPlayer({
        uid: user.uid,
        displayName: user.displayName || "Anonymous",
        photoURL: user.photoURL || undefined,
      });
    }
  }, [user, roomId, setRoomId, setPlayer]);

  // Handle navigation on connection issues
  useEffect(() => {
    if (error && !isConnected) {
      // Navigate back to lobby after showing error
      setTimeout(() => {
        navigate("/");
      }, 3000);
    }
  }, [error, isConnected, navigate]);

  const handleChoice = async (choice: Choice) => {
    if (phase !== "playing" || !gameService) return;

    try {
      await gameService.makeChoice(choice);
    } catch (error) {
      console.error("Error making choice:", error);
    }
  };

  const handleNextRound = async () => {
    if (!isHost || !gameService) return;

    try {
      await gameService.nextRound();
    } catch (error) {
      console.error("Error starting next round:", error);
    }
  };

  const handleReplay = () => {
    resetGame();
    navigate("/");
  };

  const handleGoHome = async () => {
    if (gameService) {
      try {
        await gameService.leaveRoom();
      } catch (error) {
        console.error("Error leaving room:", error);
      }
    }
    leaveGame();
    navigate("/");
  };

  const handleStartRound = async () => {
    if (!gameService) return;

    try {
      if (phase === "waiting_for_ready") {
        // Player clicks to indicate ready
        await gameService.setPlayerReady();
      } else if (isHost && phase === "waiting") {
        // Host starts the game initially
        await gameService.startGame();
      }
    } catch (error) {
      console.error("Error starting round:", error);
    }
  }; // Show loading state while connecting
  if (!isConnected && !error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to game...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-500">Redirecting to lobby...</p>
        </div>
      </div>
    );
  }

  // Show waiting for opponent
  if (!opponent && phase === "waiting") {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-4">👥</div>
          <p className="text-xl mb-2">Waiting for opponent...</p>
          <p className="text-gray-500 mb-4">Room ID: {roomId}</p>
          <button
            onClick={handleGoHome}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Leave Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col justify-between overflow-hidden max-w-md mx-auto">
      {/* Connection status */}
      {!isConnected && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-3 py-1 rounded text-sm">
          Reconnecting...
        </div>
      )}

      {/* Room info and quit button */}
      <div className="absolute top-4 right-4 text-right">
        <div className="text-xs text-gray-500 mb-1">Room: {roomId}</div>
        <button
          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
          onClick={handleGoHome}
        >
          Quit
        </button>
      </div>

      <div className="absolute top-[80%] left-0 -translate-y-1/2 -rotate-90 text-xl font-game text-gray-300/60 tracking-widest opacity-80 select-none">
        You
      </div>
      <div className="absolute top-[20%] -right-0 -translate-y-1/2 rotate-90 text-xl font-game text-gray-300/60 tracking-widest opacity-80 select-none">
        {opponent?.displayName || "Opponent"}
      </div>

      <div className="flex-1 flex flex-col justify-between items-center">
        {/* Opponent hand */}
        <div className="flex justify-center">
          <HandSprite
            className="relative"
            animation={opponentAnimation}
            isPlayer={false}
          />
        </div>

        {/* Game status */}
        <div className="text-center z-10">
          {phase === "waiting_for_ready" ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Ready to Play?</h2>
              <p className="text-gray-600">
                Both players need to tap to start the round
              </p>
              <button
                onClick={handleStartRound}
                className="px-8 py-4 bg-green-500 text-white rounded-lg text-xl font-bold hover:bg-green-600 transition-colors"
              >
                TAP TO START
              </button>
            </div>
          ) : (
            <GameStatus
              phase={phase === "opponent_disconnected" ? "finished" : phase}
              countdown={countdown}
              selectionTimer={selectionTimer}
              currentRound={currentRound}
              totalRounds={config.rounds}
              roundWinner={roundWinner}
              onStartRound={handleStartRound}
              onNextRound={handleNextRound}
            />
          )}
        </div>

        {/* Player hand */}
        <div className="-mb-10">
          <HandSprite animation={playerAnimation} isPlayer={true} />
        </div>

        {/* Round indicators */}
        <div>
          <RoundIndicators
            perspective="player"
            roundHistory={roundHistory.map((result) => {
              if (!result) return null;

              // Convert multiplayer result to single player format
              if (result.winner === "player") return "player";
              if (result.winner === "opponent") return "computer";
              if (result.winner === "draw") return "draw";
              return null;
            })}
            totalRounds={config.rounds}
          />
        </div>

        {/* Action buttons */}
        <ActionButtons
          isVisible={phase === "playing"}
          onChoiceSelect={handleChoice}
          disabled={selectionTimer <= 0 || phase !== "playing"}
        />
      </div>

      {/* Game result dialog */}
      <GameResultDialog
        isOpen={phase === "finished"}
        onClose={() => {
          handleReplay();
        }}
        gameWinner={gameWinner}
        playerScore={playerScore}
        computerScore={opponentScore}
        totalRounds={config.rounds}
        onReplay={handleReplay}
        onGoHome={handleGoHome}
      />
    </div>
  );
}
