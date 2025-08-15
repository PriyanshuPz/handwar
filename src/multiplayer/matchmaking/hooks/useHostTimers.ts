import { useEffect, useRef } from "react";
import { useMultiplayerGameStore } from "../store/gameStore";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase";

/**
 * Hook to manage game timers for the host player
 * Only the host runs the timers to avoid conflicts
 */
export function useHostTimers(roomId: string, gameService: any) {
  const { isHost, phase, countdown, selectionTimer, config } =
    useMultiplayerGameStore();
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const selectionRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all timers
  const clearTimers = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (selectionRef.current) {
      clearInterval(selectionRef.current);
      selectionRef.current = null;
    }
  };

  // Host manages countdown timer
  useEffect(() => {
    if (!isHost || !roomId || phase !== "countdown") {
      clearTimers();
      return;
    }

    let currentCountdown = countdown;
    countdownRef.current = setInterval(async () => {
      currentCountdown--;

      if (currentCountdown > 0) {
        try {
          await updateDoc(doc(db, "gameRooms", roomId), {
            countdown: currentCountdown,
            lastActivity: serverTimestamp(),
          });
        } catch (error) {
          console.error("Error updating countdown:", error);
        }
      } else {
        // Start playing phase
        try {
          await updateDoc(doc(db, "gameRooms", roomId), {
            countdown: 0,
            phase: "playing",
            selectionTimer: config.waitTime * 1000,
            lastActivity: serverTimestamp(),
          });
        } catch (error) {
          console.error("Error starting playing phase:", error);
        }

        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
      }
    }, 1000);

    return () => clearTimers();
  }, [isHost, roomId, phase, countdown, config.waitTime]);

  // Host manages selection timer
  useEffect(() => {
    if (!isHost || !roomId || phase !== "playing") {
      if (selectionRef.current) {
        clearInterval(selectionRef.current);
        selectionRef.current = null;
      }
      return;
    }

    let currentTimer = selectionTimer;
    selectionRef.current = setInterval(async () => {
      currentTimer -= 100; // Update every 100ms

      if (currentTimer > 0) {
        try {
          await updateDoc(doc(db, "gameRooms", roomId), {
            selectionTimer: currentTimer,
            lastActivity: serverTimestamp(),
          });
        } catch (error) {
          console.error("Error updating selection timer:", error);
        }
      } else {
        // Time's up - set timeout phase
        try {
          await updateDoc(doc(db, "gameRooms", roomId), {
            selectionTimer: 0,
            phase: "timeout",
            lastActivity: serverTimestamp(),
          });

          // Trigger timeout handling
          if (gameService) {
            setTimeout(async () => {
              await gameService.handleTimeout();
            }, 1000);
          }
        } catch (error) {
          console.error("Error handling timeout:", error);
        }

        if (selectionRef.current) {
          clearInterval(selectionRef.current);
          selectionRef.current = null;
        }
      }
    }, 100);

    return () => {
      if (selectionRef.current) {
        clearInterval(selectionRef.current);
        selectionRef.current = null;
      }
    };
  }, [isHost, roomId, phase, selectionTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers();
  }, []);
}
