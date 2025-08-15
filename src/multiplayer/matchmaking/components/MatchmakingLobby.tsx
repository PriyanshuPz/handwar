import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { MatchmakingService } from "../services/gameService";
import { Button } from "../../../components/ui/button";
import { toast } from "sonner";

interface MatchmakingLobbyProps {
  onClose: () => void;
}

export function MatchmakingLobby({ onClose }: MatchmakingLobbyProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFindingMatch, setIsFindingMatch] = useState(false);
  const [rounds, setRounds] = useState<3 | 5 | 7>(3);
  const [waitTime, setWaitTime] = useState<3 | 5>(3);

  const handleFindMatch = async () => {
    if (!user) return;

    setIsFindingMatch(true);

    try {
      const playerData = {
        uid: user.uid,
        displayName: user.displayName || "Anonymous",
        photoURL: user.photoURL || undefined,
      };

      const config = { rounds, waitTime };

      // Try to find a match
      const roomId = await MatchmakingService.findMatch(playerData, config);

      if (roomId) {
        // Match found immediately
        setIsFindingMatch(false);
        onClose();
        navigate(`/multiplayer/${roomId}`);
      } else {
        // Added to waiting pool, listen for matches
        const unsubscribe = MatchmakingService.subscribeToMatchmaking(
          user.uid,
          (matchedRoomId) => {
            if (matchedRoomId) {
              setIsFindingMatch(false);
              onClose();
              navigate(`/multiplayer/${matchedRoomId}`);
              unsubscribe();
            }
          }
        );

        // Set timeout for matchmaking
        setTimeout(async () => {
          setIsFindingMatch(false);
          unsubscribe();
          await MatchmakingService.cancelMatchmaking(user.uid);
          toast.error("No match found. Please try again later.");
        }, 30000); // 30 second timeout
      }
    } catch (error) {
      console.error("Error finding match:", error);
      setIsFindingMatch(false);
      toast.error("Matchmaking failed. Please try again.");
    }
  };

  const handleCancelMatchmaking = async () => {
    if (!user) return;

    try {
      await MatchmakingService.cancelMatchmaking(user.uid);
      setIsFindingMatch(false);
      toast("Matchmaking cancelled");
    } catch (error) {
      console.error("Error canceling matchmaking:", error);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {!isFindingMatch && (
        <>
          {/* Game Configuration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Number of Rounds
            </label>
            <div className="flex gap-3">
              {([3, 5, 7] as const).map((round) => (
                <button
                  key={round}
                  onClick={() => setRounds(round)}
                  className={`px-6 py-3 rounded-lg border-2 font-medium transition-all ${
                    rounds === round
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 hover:border-gray-400 text-gray-700"
                  }`}
                >
                  {round}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Wait Time (seconds)
            </label>
            <div className="flex gap-3">
              {([3, 5] as const).map((time) => (
                <button
                  key={time}
                  onClick={() => setWaitTime(time)}
                  className={`px-6 py-3 rounded-lg border-2 font-medium transition-all ${
                    waitTime === time
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 hover:border-gray-400 text-gray-700"
                  }`}
                >
                  {time}s
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            Keeping default settings of 3 rounds and 3 seconds wait time is
            recommended for a quick match experience.
          </p>

          <Button
            onClick={handleFindMatch}
            variant="green"
            className="w-full py-3 text-lg"
          >
            Find Match
          </Button>
        </>
      )}

      {isFindingMatch && (
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-lg">Finding opponent...</p>
          <p className="text-gray-500">
            Rounds: {rounds} | Wait Time: {waitTime}s
          </p>
          <Button
            onClick={handleCancelMatchmaking}
            variant="outline"
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      )}

      <div className="text-center">
        <Button onClick={onClose} variant="outline" className="w-full">
          Back to Lobby
        </Button>
      </div>
    </div>
  );
}
