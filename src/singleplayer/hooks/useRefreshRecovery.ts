import { useEffect, useRef } from "react";
import { useSinglePlayerGameStore } from "../store/gameStore";

/**
 * Hook to detect page refresh during active game and prompt restart.
 * This should be called in the main game component.
 */
export function useRefreshRecovery() {
  const { phase, gameStarted, resetGame } = useSinglePlayerGameStore();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Only check once per session
    if (!hasChecked.current) {
      hasChecked.current = true;

      // If we detect an active game state on mount, it means page was refreshed
      if (gameStarted && phase !== "waiting" && phase !== "finished") {
        // Stop the game and reset to waiting state
        resetGame();
      }
    }
  }, [phase, gameStarted, resetGame]);
}
