import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as Colyseus from "colyseus.js";
import type { Room } from "colyseus.js";
import type { GamePhase } from "../singleplayer";
import type { Player } from "../types";
import type { RoundResult } from "../singleplayer/types";
import { unwrapState } from "../lib/utils";

const SERVER_URL = import.meta.env.VITE_COLYSEUS_SERVER_URL;

interface RoomInfo {
  roomId: string;
  accessCode: string;
  isPrivate: boolean;
  playerCount: number;
  maxPlayers: number;
  phase: string;
  gameStarted: boolean;
}

export type GameRoomState = {
  // Room configuration
  roomId: string;
  accessCode: string; // For private room access
  isPrivate: boolean;
  maxRounds: number;
  waitTime: number; // Seconds per round for selection

  // Players in the game
  players: Record<string, Player>;

  // Game state
  phase: GamePhase;
  currentRound: number;
  countdown: number;
  selectionTimer: number; // milliseconds
  gameStarted: boolean;

  // Round results history
  roundsHistory: RoundResult[];

  // Current round result
  roundWinner: string | "draw" | null;
  gameWinner: string | "draw" | null;
};

interface LobbyState {
  rooms: Map<string, RoomInfo>;
}

interface LobbyRoom {
  state: LobbyState;
  send: (type: string, message: any) => void;
  onMessage: (type: string, callback: (message: any) => void) => void;
  onStateChange: (callback: (state: LobbyState) => void) => void;
  leave: () => void;
}

// Create the Colyseus client
const client = new Colyseus.Client(SERVER_URL);

interface OnlineLobbyState {
  // UI states
  isCreatingRoom: boolean;
  isJoiningRoom: boolean;
  isCustomRoomDialogOpen: boolean;
  error: string | null;

  // Room info
  roomId: string | null;
  accessCode: string | null;
  roomInstance: Room | null;
  lobbyRoom: Room<LobbyRoom> | null;
  isHost: boolean;
  username: string;

  // Available rooms
  availableRooms: Record<string, RoomInfo>;
  isLoadingRooms: boolean;

  // Join a room with access code
  joinRoom: (accessCode: string, username: string) => Promise<void>;

  // Create a new private room
  createRoom: (options: {
    username: string;
    maxRounds: number;
    waitTime: number;
  }) => Promise<void>;

  // Leave the current room
  leaveRoom: () => void;

  // Set username
  setUsername: (username: string) => void;

  // UI actions
  setCustomRoomDialogOpen: (isOpen: boolean) => void;
  setError: (error: string | null) => void;

  // Game actions
  makeChoice: (choice: "rock" | "paper" | "scissors") => void;
  setPlayerReady: () => void;
  requestNextRound: () => void;
  requestRestart: () => void;

  // Reset the store
  reset: () => void;
}

const initialState = {
  isCreatingRoom: false,
  isJoiningRoom: false,
  isCustomRoomDialogOpen: false,
  roomId: null,
  accessCode: null,
  roomInstance: null,
  lobbyRoom: null,
  isHost: false,
  error: null,
  username: "Player",
  availableRooms: {},
  isLoadingRooms: false,
};

export const useOnlineLobbyStore = create<OnlineLobbyState>()(
  persist(
    (set, get) => ({
      ...initialState,

      joinRoom: async (accessCode: string, username: string) => {
        try {
          set({ isJoiningRoom: true, error: null });

          // Connect to the lobby first to find rooms
          let lobbyRoom = get().lobbyRoom;

          if (!lobbyRoom) {
            try {
              // Join the lobby room to access room listings
              lobbyRoom = await client.joinOrCreate<LobbyRoom>("lobby");
              console.log(`Connected to lobby with id ${lobbyRoom.roomId}`);

              // Set up lobby event handlers
              setupLobbyEventHandlers(lobbyRoom, set);

              set({ lobbyRoom });
            } catch (error) {
              console.error("Failed to join lobby:", error);
              set({
                error: "Failed to connect to the lobby. Please try again.",
                isJoiningRoom: false,
              });
              return Promise.reject(error);
            }
          }

          // Log available rooms before searching
          const availableRooms = get().availableRooms;
          console.log(
            `[FRONTEND] Available rooms before search:`,
            availableRooms
          );

          // Send find room request with the access code
          console.log(
            `[FRONTEND] Sending find_room request with access code: ${accessCode.toUpperCase()}`
          );
          lobbyRoom.send("find_room", { accessCode: accessCode.toUpperCase() });

          return new Promise<void>((resolve, reject) => {
            // Set up timeout for room search
            const timeout = setTimeout(() => {
              console.log(
                `[FRONTEND] Room search timed out for access code: ${accessCode.toUpperCase()}`
              );
              set({
                error: "Room search timed out. Please try again.",
                isJoiningRoom: false,
              });
              reject(new Error("Room search timed out"));
            }, 5000);

            // Listen for room found response
            lobbyRoom.onMessage("room_found", async (message) => {
              clearTimeout(timeout);
              console.log(
                `[FRONTEND] Room found! Room ID: ${message.roomId}, Access code: ${message.accessCode}`
              );

              try {
                // Join the room directly by ID
                console.log(
                  `[FRONTEND] Attempting to join room with ID: ${message.roomId}`
                );
                const room = await client.joinById(message.roomId, {
                  name: username,
                  accessCode: message.accessCode,
                });

                // Store the room information
                set({
                  roomId: room.roomId,
                  accessCode: message.accessCode,
                  roomInstance: room,
                  username,
                  isHost: false, // Will be updated based on server data
                  isJoiningRoom: false,
                });

                // Set up room event handlers
                setupRoomEventHandlers(room, set);
                resolve();
              } catch (error) {
                set({
                  error:
                    error instanceof Error
                      ? error.message
                      : "Failed to join room",
                  isJoiningRoom: false,
                });
                reject(error);
              }
            });

            // Listen for room not found response
            lobbyRoom.onMessage("room_not_found", async () => {
              clearTimeout(timeout);
              console.log(
                `[FRONTEND] No room found with access code: ${accessCode.toUpperCase()}`
              );

              // Log current available rooms again
              const availableRooms = get().availableRooms;
              console.log(
                `[FRONTEND] Available rooms in store:`,
                availableRooms
              );

              // Try alternative approach - ask the server to list all rooms
              console.log(
                `[FRONTEND] Attempting direct room search as fallback...`
              );

              try {
                // Try to directly join/create the room by access code
                const room = await client.joinOrCreate("game_room", {
                  accessCode: accessCode.toUpperCase(),
                  name: username,
                });

                console.log(
                  `[FRONTEND] Direct room join successful! Room ID: ${room.roomId}`
                );

                // Store the room information
                set({
                  roomId: room.roomId,
                  accessCode: accessCode.toUpperCase(),
                  roomInstance: room,
                  username,
                  isHost: false, // Will be updated based on server data
                  isJoiningRoom: false,
                });

                // Set up room event handlers
                setupRoomEventHandlers(room, set);
                resolve();
              } catch (error) {
                console.error("[FRONTEND] Direct join attempt failed:", error);

                set({
                  error: `No room found with access code: ${accessCode.toUpperCase()}`,
                  isJoiningRoom: false,
                });
                reject(
                  new Error(
                    `No room found with access code: ${accessCode.toUpperCase()}`
                  )
                );
              }
            });

            // Cleanup listeners on promise resolution or rejection
            const cleanup = () => {
              if (lobbyRoom) {
                // The Colyseus client handles cleanup internally
              }
            };

            Promise.race([resolve, reject]).finally(cleanup);
          });
        } catch (error) {
          console.error("Failed to join room:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to join room",
            isJoiningRoom: false,
          });
          return Promise.reject(error);
        }
      },

      createRoom: async (options) => {
        try {
          set({ isCreatingRoom: true, error: null });

          // Connect to the lobby first if not connected
          let lobbyRoom = get().lobbyRoom;

          if (!lobbyRoom) {
            try {
              // Join the lobby room to access room listings
              console.log(`[FRONTEND] Connecting to lobby...`);
              lobbyRoom = await client.joinOrCreate<LobbyRoom>("lobby");
              console.log(
                `[FRONTEND] Connected to lobby with id ${lobbyRoom.roomId}`
              );

              // Set up lobby state change listeners (moved to a separate function)
              setupLobbyEventHandlers(lobbyRoom, set);

              set({ lobbyRoom });
            } catch (error) {
              console.error("[FRONTEND] Failed to join lobby:", error);
              set({
                error: "Failed to connect to the lobby. Please try again.",
                isCreatingRoom: false,
              });
              return Promise.reject(error);
            }
          }

          console.log(`[FRONTEND] Creating game room...`);
          const room = await client.create<GameRoomState>("game_room", {
            isPrivate: true,
            maxRounds: options.maxRounds,
            waitTime: options.waitTime,
            name: options.username,
          });

          set({
            roomId: room.roomId,
            roomInstance: room,
            username: options.username,
            isHost: true,
            isCreatingRoom: false,
          });

          room.onStateChange.once((state) => {
            const unwrap = unwrapState(state);
            set({
              accessCode: unwrap.accessCode,
            });
          });

          // Set up room event handlers
          setupRoomEventHandlers(room, set);

          return Promise.resolve();
        } catch (error) {
          console.error("Failed to create room:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to create room",
            isCreatingRoom: false,
          });
          return Promise.reject(error);
        }
      },

      leaveRoom: () => {
        const { roomInstance, lobbyRoom } = get();

        if (roomInstance) {
          roomInstance.leave();
        }

        if (lobbyRoom) {
          lobbyRoom.leave();
        }

        set({
          ...initialState,
          lobbyRoom: null,
          username: get().username, // Preserve username
        });
      },

      setUsername: (username) => {
        set({ username });

        // If in a room, update the name
        const { roomInstance } = get();
        if (roomInstance) {
          roomInstance.send("update-name", { name: username });
        }
      },

      setCustomRoomDialogOpen: (isOpen) =>
        set({ isCustomRoomDialogOpen: isOpen }),

      setError: (error) => set({ error }),

      makeChoice: (choice) => {
        const { roomInstance } = get();
        if (roomInstance) {
          roomInstance.send("make-choice", { choice });
        }
      },

      setPlayerReady: () => {
        const { roomInstance } = get();
        if (roomInstance) {
          roomInstance.send("player-ready");
        }
      },

      requestNextRound: () => {
        const { roomInstance } = get();
        if (roomInstance) {
          roomInstance.send("next-round");
        }
      },

      requestRestart: () => {
        const { roomInstance } = get();
        if (roomInstance) {
          roomInstance.send("restart-game");
        }
      },

      reset: () => {
        const { roomInstance, lobbyRoom } = get();

        if (roomInstance) {
          roomInstance.leave();
        }

        if (lobbyRoom) {
          lobbyRoom.leave();
        }

        set(initialState);
      },
    }),
    {
      name: "online-lobby-storage",
      partialize: (state) => ({
        roomId: state.roomId,
        accessCode: state.accessCode,
        username: state.username,
      }),
    }
  )
);

// Helper function to set up lobby event handlers
function setupLobbyEventHandlers(
  lobbyRoom: Room<LobbyRoom>,
  set: (state: Partial<OnlineLobbyState>) => void
) {
  // Set up lobby state change listeners to track available rooms
  lobbyRoom.onStateChange((state: any) => {
    try {
      console.log(`[FRONTEND] Lobby state changed, processing rooms list...`);
      const rooms: Record<string, RoomInfo> = {};
      if (state && state.rooms) {
        const unwrap = unwrapState(state);
        Object.entries(unwrap.rooms).forEach(
          ([roomId, room]: [string, any]) => {
            console.log(
              `[FRONTEND] Processing room ${roomId}, access code: ${room.accessCode}`
            );

            rooms[roomId] = {
              roomId: room.roomId,
              accessCode: room.accessCode,
              isPrivate: room.isPrivate,
              playerCount: room.playerCount,
              maxPlayers: room.maxPlayers,
              phase: room.phase,
              gameStarted: room.gameStarted,
            };
          }
        );
      }

      console.log(
        `[FRONTEND] Processed ${
          Object.keys(rooms).length
        } rooms from lobby state`
      );
      set({ availableRooms: rooms });
    } catch (error) {
      console.error("[FRONTEND] Error processing lobby state:", error);
    }
  });

  // Listen for room list updates
  lobbyRoom.onMessage("rooms_list", (message: any) => {
    set({ availableRooms: message.rooms || {} });
  });

  // Listen for room updates
  lobbyRoom.onMessage("rooms_updated", () => {
    // Just a notification, the state change will handle the actual data
    console.log("Room list updated");
  });

  // Handle errors
  lobbyRoom.onError((code: number, message?: string) => {
    console.error(`Lobby error: ${code} - ${message}`);
    set({ error: message || `Lobby error: ${code}` });
  });

  // Handle disconnect
  lobbyRoom.onLeave((code: number) => {
    console.log(`Left lobby: ${code}`);
    set({ lobbyRoom: null });
  });
}

// Helper function to set up room event handlers
function setupRoomEventHandlers(
  room: Room,
  set: (state: Partial<OnlineLobbyState>) => void
) {
  // Handle when room state changes
  room.onStateChange((state: any) => {
    const unwrap = unwrapState(state);
    console.log("[FRONTEND] Room State updated:", unwrap);
    // Check if the current client is the host (first player)
    if (unwrap && unwrap.players) {
      const playerIds = Object.keys(unwrap.players);
      if (playerIds.length > 0) {
        const isHost = playerIds[0] === room.sessionId;
        set({ isHost, accessCode: state.accessCode });
      }
    }
  });

  // Handle when the room is closed
  room.onLeave((code: number) => {
    console.log("Left room:", code);
    set({
      roomId: null,
      accessCode: null,
      roomInstance: null,
      isHost: false,
    });
  });

  // Handle errors
  room.onError((code: number, message?: string) => {
    console.error(`Room error: ${code} - ${message}`);
    set({ error: message || `Error code: ${code}` });
  });
}
