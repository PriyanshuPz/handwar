import { doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { FirebaseGameRoom } from "../types";

export class TimerService {
  private roomId: string;
  private countdownInterval: NodeJS.Timeout | null = null;
  private selectionInterval: NodeJS.Timeout | null = null;

  constructor(roomId: string) {
    this.roomId = roomId;
  }

  // Start countdown timer (3 seconds)
  async startCountdown(): Promise<void> {
    const roomRef = doc(db, "gameRooms", this.roomId);
    let countdown = 3;

    // Clear any existing timer
    this.clearCountdown();

    this.countdownInterval = setInterval(async () => {
      countdown--;

      if (countdown > 0) {
        await updateDoc(roomRef, {
          countdown,
          lastActivity: serverTimestamp(),
        });
      } else {
        // Countdown finished, start playing phase
        await updateDoc(roomRef, {
          countdown: 0,
          phase: "playing",
          lastActivity: serverTimestamp(),
        });

        this.clearCountdown();
        // Start selection timer
        await this.startSelectionTimer();
      }
    }, 1000);
  }

  // Start selection timer
  async startSelectionTimer(): Promise<void> {
    const roomRef = doc(db, "gameRooms", this.roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) return;

    const roomData = roomSnap.data() as FirebaseGameRoom;
    let selectionTimer = roomData.waitTime * 1000;

    // Clear any existing timer
    this.clearSelection();

    this.selectionInterval = setInterval(async () => {
      selectionTimer -= 100; // Update every 100ms for smoother countdown

      if (selectionTimer > 0) {
        await updateDoc(roomRef, {
          selectionTimer,
          lastActivity: serverTimestamp(),
        });
      } else {
        // Time's up - auto-assign default choices for players who haven't chosen
        const currentRoomSnap = await getDoc(roomRef);
        if (currentRoomSnap.exists()) {
          const currentRoomData = currentRoomSnap.data() as FirebaseGameRoom;
          const choices = currentRoomData.choices || {};
          const players = currentRoomData.players;

          // Assign default choice (rock) to players who haven't chosen
          const updates: any = {
            selectionTimer: 0,
            phase: "timeout",
            lastActivity: serverTimestamp(),
          };

          players.forEach((uid) => {
            if (choices[uid] == null) {
              updates[`choices.${uid}`] = "rock";
            }
          });

          await updateDoc(roomRef, updates);

          // Reveal choices after a short delay
          setTimeout(async () => {
            await updateDoc(roomRef, {
              phase: "revealing",
              lastActivity: serverTimestamp(),
            });

            // Auto-finish round after reveal animation
            setTimeout(async () => {
              // The game service will handle finishing the round
              // We just need to trigger the reveal
            }, 2000);
          }, 1000);
        }

        this.clearSelection();
      }
    }, 100);
  }

  // Clear countdown timer
  clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  // Clear selection timer
  clearSelection(): void {
    if (this.selectionInterval) {
      clearInterval(this.selectionInterval);
      this.selectionInterval = null;
    }
  }

  // Clear all timers
  clearAll(): void {
    this.clearCountdown();
    this.clearSelection();
  }
}
