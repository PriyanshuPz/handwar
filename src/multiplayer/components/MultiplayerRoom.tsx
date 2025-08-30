import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnlineLobbyStore } from "../../store/onlineLobbyStore";
import { Button } from "../../components/ui/button";
import {
  HandSprite,
  GameStatus,
  ActionButtons,
  GameResultDialog,
} from "../../components/game";
import { RoundIndicators } from "../../components/RoundIndicators";
import type {
  Choice,
  AnimationState,
  GamePhase,
} from "../../singleplayer/types";
import type { MultiplayerGameState } from "../../types";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export function MultiplayerRoom() {
  const navigate = useNavigate();
  const {
    roomInstance,
    accessCode,
    isHost,
    username,
    makeChoice,
    setPlayerReady,
    requestNextRound,
    requestRestart,
    leaveRoom,
    availableRooms,
    error,
  } = useOnlineLobbyStore();

  // Local state for tracking UI updates
  const [gameState, setGameState] = useState<MultiplayerGameState>({
    phase: "waiting",
    currentRound: 1,
    maxRounds: 3,
    countdown: 3,
    selectionTimer: 3000,
    playerAnimation: "idle",
    opponentAnimation: "idle",
    playerScore: 0,
    opponentScore: 0,
    roundWinner: null,
    gameWinner: null,
    roundsHistory: [],
    opponentName: "Opponent",
    opponentReady: false,
    playerReady: false,
  });

  // Debug state
  const [showDebug, setShowDebug] = useState(false);

  // Set up room state listener
  useEffect(() => {
    if (!roomInstance) {
      console.log("No room instance found, redirecting to home");
      // Don't navigate immediately, allow a brief moment to see the error state
      const timeout = setTimeout(() => navigate("/"), 3000);
      return () => clearTimeout(timeout);
    }

    // Listen for room state changes
    const onStateChange = (state: any) => {
      if (!state) return;

      // Get player info
      const playerIds = Array.from(state.players) as string[];
      const playerId = roomInstance.sessionId;
      const opponentId = playerIds.find((id) => id !== playerId);

      // Get player states
      const player = state.players.get(playerId);

      // Handle the case when we might be the only player in the room
      const opponent = opponentId ? state.players.get(opponentId) : null;

      // If player not found, there's a connection issue
      if (!player) {
        console.error("Player not found in room state");
        return;
      }

      // Create a new state object based on current data
      const newGameState: MultiplayerGameState = {
        // Game configuration
        phase: state.phase as GamePhase,
        currentRound: state.currentRound || 1,
        maxRounds: state.maxRounds || 3,
        countdown: state.countdown || 3,
        selectionTimer: state.selectionTimer || 3000,

        // Player state
        playerAnimation: (player.animation as AnimationState) || "idle",
        playerScore: player.score || 0,
        playerReady: player.isReady || false,

        // Opponent state - may be missing if no opponent yet
        opponentAnimation: opponent
          ? (opponent.animation as AnimationState) || "idle"
          : "idle",
        opponentScore: opponent ? opponent.score || 0 : 0,
        opponentName: opponent
          ? opponent.name || "Opponent"
          : "Waiting for opponent...",
        opponentReady: opponent ? opponent.isReady || false : false,

        // Game results
        roundWinner:
          state.roundWinner === playerId
            ? "player"
            : state.roundWinner === opponentId
            ? "opponent"
            : state.roundWinner === "draw"
            ? "draw"
            : null,

        gameWinner:
          state.gameWinner === playerId
            ? "player"
            : state.gameWinner === opponentId
            ? "opponent"
            : state.gameWinner === "draw"
            ? "draw"
            : null,

        // Round history
        roundsHistory: opponentId
          ? mapRoundHistory(state.roundsHistory, playerId, opponentId)
          : [],
      };

      // Update the state
      setGameState(newGameState);

      // Log when important game state changes happen
      if (state.phase !== gameState.phase) {
        console.log(`Game phase changed: ${gameState.phase} -> ${state.phase}`);
      }
    };

    roomInstance.onStateChange(onStateChange);

    // Initialize with current state
    if (roomInstance.state) {
      onStateChange(roomInstance.state);
    }

    return () => {
      // Cleanup
      roomInstance.removeAllListeners();
    };
  }, [roomInstance, navigate]);

  // Helper to map round history to the format our components expect
  const mapRoundHistory = (
    roundsHistory: any[] | undefined,
    playerId: string,
    opponentId: string | undefined
  ): Array<"player" | "opponent" | "draw" | null> => {
    if (!roundsHistory || roundsHistory.length === 0) return [];

    return roundsHistory.map((round: any) => {
      if (round.winner === playerId) return "player";
      if (round.winner === opponentId) return "opponent";
      if (round.winner === "draw") return "draw";
      return null;
    });
  };

  // Handle player's choice
  const handleChoice = (choice: Choice) => {
    if (gameState.phase !== "playing") return;
    makeChoice(choice);
  };

  // Handle player ready
  const handleReady = () => {
    setPlayerReady();
  };

  // Handle next round
  const handleNextRound = () => {
    if (isHost) {
      requestNextRound();
    }
  };

  // Handle replay
  const handleReplay = () => {
    if (isHost) {
      requestRestart();
    }
  };

  const handleGoHome = () => {
    leaveRoom();
    navigate("/");
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(accessCode || "");
    toast("Room code copied to clipboard!");
  };

  // Show a loading/error state when there's no room instance
  if (!roomInstance) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-white border-4 border-black rounded-2xl p-6 w-full max-w-md relative shadow-[0_8px_0px_0px_#000]">
          <h1 className="text-2xl font-bold mb-4 text-center">
            {error ? "Error" : "Connecting..."}
          </h1>

          {error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
              <p className="text-red-600">{error}</p>
              <p className="text-sm text-gray-500 mt-2">
                Redirecting to home page...
              </p>
            </div>
          ) : (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}

          <Button className="w-full mt-4" onClick={() => navigate("/")}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (gameState.phase === "waiting") {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-white border-4 border-black rounded-2xl p-6 w-full max-w-md relative shadow-[0_8px_0px_0px_#000]">
          <h1 className="text-2xl font-bold mb-4 text-center">Waiting Room</h1>

          {/* Show any errors */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="mb-6 p-4 rounded-md text-center border-4 flex flex-col">
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold mb-2">Room Code</h2>
              <div className="flex items-center space-x-2 px-2">
                <p className="text-xl font-mono tracking-widest">
                  {accessCode}
                </p>
                <button
                  onClick={handleCopyCode}
                  className="p-2 rounded-md hover:text-gray-500 transition"
                >
                  <Copy />
                </button>
              </div>
            </div>
            <p className="text-sm mt-2 text-gray-400">
              Share this code with your friend
            </p>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between items-center p-2 bg-gray-100 rounded">
              <span>{username} (You)</span>
              <span className="px-2 py-1 text-xs bg-green-500 text-white rounded">
                {gameState.playerReady ? "Ready" : "Not Ready"}
              </span>
            </div>

            {gameState.opponentName !== "Waiting for opponent..." ? (
              <div className="flex justify-between items-center p-2 bg-gray-100 rounded">
                <span>{gameState.opponentName}</span>
                <span
                  className={`px-2 py-1 text-xs ${
                    gameState.opponentReady ? "bg-green-500" : ""
                  } text-white rounded`}
                >
                  {gameState.opponentReady ? "Ready" : "Waiting..."}
                </span>
              </div>
            ) : (
              <div className="flex justify-between items-center p-2 bg-black/10 rounded">
                <span className="italic text-gray-500">
                  Waiting for opponent to join...
                </span>
                <div
                  onClick={handleCopyCode}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded animate-pulse cursor-pointer"
                >
                  Share Code
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={handleReady}
              disabled={
                gameState.playerReady ||
                gameState.opponentName === "Waiting for opponent..."
              }
            >
              I'm Ready
            </Button>
            <Button className="w-full" variant="outline" onClick={handleGoHome}>
              Leave Room
            </Button>

            {/* Debug panel toggle button */}
            <Button
              onClick={() => setShowDebug(!showDebug)}
              variant="outline"
              className="w-full text-xs"
            >
              {showDebug ? "Hide Debug Info" : "Show Debug Info"}
            </Button>

            {gameState.opponentName === "Waiting for opponent..." && (
              <p className="text-sm text-center text-yellow-300">
                You need an opponent to start the game
              </p>
            )}
            {gameState.playerReady &&
              !gameState.opponentReady &&
              gameState.opponentName !== "Waiting for opponent..." && (
                <p className="text-sm text-center text-yellow-300">
                  Waiting for {gameState.opponentName} to be ready...
                </p>
              )}

            {/* Debug information panel */}
            {showDebug && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-xs">
                <h3 className="font-bold mb-1">Debug Information</h3>
                <div className="mb-2">
                  <p>
                    <strong>Room ID:</strong>{" "}
                    {roomInstance?.roomId || "unknown"}
                  </p>
                  <p>
                    <strong>Access Code:</strong> {accessCode}
                  </p>
                  <p>
                    <strong>Host:</strong> {isHost ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Players:</strong>{" "}
                    {roomInstance?.state?.players?.size || 0}/2
                  </p>
                </div>

                <h4 className="font-bold mt-2 mb-1">Available Rooms:</h4>
                <div className="max-h-24 overflow-y-auto">
                  {Object.keys(availableRooms).length === 0 ? (
                    <p className="text-gray-500">No rooms available</p>
                  ) : (
                    <ul>
                      {Object.entries(availableRooms).map(([id, room]) => (
                        <li key={id} className="mb-1">
                          {id.substring(0, 8)}... -{" "}
                          {room.accessCode || "No code"}({room.playerCount}/
                          {room.maxPlayers})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Game in progress UI (similar to single player)
  return (
    <div className="h-screen flex flex-col justify-between overflow-hidden max-w-md mx-auto">
      <button
        className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded"
        onClick={handleGoHome}
      >
        Quit
      </button>

      <div className="absolute top-[80%] left-0 -translate-y-1/2 -rotate-90 text-5xl font-game text-gray-300/60 tracking-widest opacity-80 select-none">
        {username}
      </div>
      <div className="absolute top-[20%] -right-0 -translate-y-1/2 rotate-90 text-5xl font-game text-gray-300/60 tracking-widest opacity-80 select-none">
        {gameState.opponentName}
      </div>

      <div className="flex-1 flex flex-col justify-between items-center">
        <div className="flex justify-center">
          <HandSprite
            className="relative"
            animation={gameState.opponentAnimation}
            isPlayer={false}
          />
        </div>

        <div className="text-center z-10">
          <GameStatus
            phase={gameState.phase}
            countdown={gameState.countdown}
            selectionTimer={gameState.selectionTimer}
            currentRound={gameState.currentRound}
            totalRounds={gameState.maxRounds}
            roundWinner={gameState.roundWinner}
            onStartRound={() => {}} // Managed by server
            onNextRound={handleNextRound}
          />
        </div>

        <div className="-mb-10">
          <HandSprite animation={gameState.playerAnimation} isPlayer={true} />
        </div>

        <div>
          <RoundIndicators
            perspective="player"
            roundHistory={gameState.roundsHistory}
            totalRounds={gameState.maxRounds}
          />
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
          // Can only restart if host
          if (isHost) {
            handleReplay();
          }
        }}
        gameWinner={gameState.gameWinner}
        playerScore={gameState.playerScore}
        computerScore={gameState.opponentScore}
        totalRounds={gameState.maxRounds}
        onReplay={handleReplay}
        onGoHome={handleGoHome}
        isMultiplayer={true}
        isHost={isHost}
        opponentName={gameState.opponentName}
      />
    </div>
  );
}
