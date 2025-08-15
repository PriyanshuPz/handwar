import { useEffect, useRef } from "react";
import { useMultiplayerGameStore } from "../store/gameStore";
import { MultiplayerGameService } from "../services/gameService";
import type { FirebaseGameRoom } from "../types";

/**
 * Hook to manage multiplayer game connection and synchronization with Firebase
 */
export function useMultiplayerGame(roomId: string, playerUid: string) {
  const gameServiceRef = useRef<MultiplayerGameService | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const { syncFromFirebase, setConnected, setError } =
    useMultiplayerGameStore();

  // Initialize game service and subscribe to room updates
  useEffect(() => {
    if (!roomId || !playerUid) return;

    // Create game service instance
    gameServiceRef.current = new MultiplayerGameService(roomId, playerUid);
    setConnected(true);

    // Subscribe to room updates
    unsubscribeRef.current = gameServiceRef.current.subscribeToRoom(
      (roomData: FirebaseGameRoom | null) => {
        if (roomData) {
          syncFromFirebase(roomData);
          setError(null);
        } else {
          setError("Room not found or deleted");
          setConnected(false);
        }
      }
    );

    return () => {
      // Cleanup on unmount
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (gameServiceRef.current) {
        gameServiceRef.current.cleanup();
        gameServiceRef.current = null;
      }
      setConnected(false);
    };
  }, [roomId, playerUid, syncFromFirebase, setConnected, setError]);

  // Return game service for making moves
  return gameServiceRef.current;
}
