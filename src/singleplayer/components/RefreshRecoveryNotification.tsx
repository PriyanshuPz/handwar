import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Component that shows a notification when game was interrupted by page refresh
 */
export function RefreshRecoveryNotification() {
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Check if we were in a game before refresh by looking at sessionStorage
    const gameStateString = sessionStorage.getItem("single-player-game-store");

    if (gameStateString) {
      try {
        const gameState = JSON.parse(gameStateString);
        const state = gameState.state;

        // If we detect an active game state, show notification
        if (
          state.gameStarted &&
          state.phase !== "waiting" &&
          state.phase !== "finished"
        ) {
          setShowNotification(true);
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }
  }, []); // Only run on mount

  if (showNotification) {
    toast("Game interrupted by page refresh.", {
      description: " Please start a new game.",
    });
    setShowNotification(false);
  }

  return null;
}
