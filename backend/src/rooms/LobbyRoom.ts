import { Room, Client } from "@colyseus/core";
import { Schema, type, MapSchema } from "@colyseus/schema";

// Define a schema for room information
class RoomInfo extends Schema {
  @type("string") roomId: string;
  @type("string") accessCode: string;
  @type("boolean") isPrivate: boolean;
  @type("number") playerCount: number;
  @type("number") maxPlayers: number;
  @type("string") phase: string;
  @type("boolean") gameStarted: boolean;

  constructor(data: Partial<RoomInfo> = {}) {
    super();
    Object.assign(this, data);
  }
}

// Define the schema for the lobby state
class LobbyState extends Schema {
  @type({ map: RoomInfo }) rooms = new MapSchema<RoomInfo>();
}

/**
 * LobbyRoom is responsible for managing all game rooms
 * and coordinating room creation, joining, and listing
 */
export class LobbyRoom extends Room<LobbyState> {
  // This room doesn't have a hard limit
  maxClients = 100;

  onCreate() {
    this.state = new LobbyState();

    // Listen for direct room creation notifications
    this.presence.subscribe("room_created", (data: any) => {
      console.log(`[LOBBY] Received room_created event:`, JSON.stringify(data));

      // Add the room to our state immediately
      if (data && data.roomId) {
        const roomInfo = new RoomInfo({
          roomId: data.roomId,
          accessCode: data.accessCode || "PUBLIC",
          isPrivate: data.isPrivate || false,
          playerCount: 1, // Assume creator has joined
          maxPlayers: 2,
          phase: "waiting",
          gameStarted: false,
        });

        this.state.rooms.set(data.roomId, roomInfo);
        console.log(
          `[LOBBY] Added new room from direct notification: ${data.roomId} with access code: ${data.accessCode}`
        );

        // Broadcast update
        this.broadcast("rooms_updated", { count: this.state.rooms.size });
      }
    });

    // Keep track of available game rooms with detailed information
    this.presence.subscribe("rooms", (rooms: any[]) => {
      console.log(
        `[LOBBY] Presence update - Received ${rooms.length} rooms from presence system`
      );

      // Debug: Print raw rooms data received from presence
      console.log(`[LOBBY] Raw rooms data:`, JSON.stringify(rooms));

      this.state.rooms.clear();

      for (const room of rooms) {
        if (room.roomId) {
          console.log(
            `[LOBBY] Processing room: ${room.roomId}`,
            JSON.stringify(room)
          );

          // Add room even if metadata is incomplete
          const roomInfo = new RoomInfo({
            roomId: room.roomId,
            accessCode: room.metadata?.accessCode || "PUBLIC",
            isPrivate: room.metadata?.isPrivate || false,
            playerCount: room.clients || 0,
            maxPlayers: room.maxClients || 2,
            phase: room.metadata?.phase || "waiting",
            gameStarted: room.metadata?.gameStarted || false,
          });

          this.state.rooms.set(room.roomId, roomInfo);
          console.log(
            `[LOBBY] Added room: ${room.roomId} with access code: ${roomInfo.accessCode}`
          );
        }
      }

      console.log(
        `[LOBBY] Updated room list: ${this.state.rooms.size} rooms available`
      );

      // Broadcast room list update to all clients
      this.broadcast("rooms_updated", { count: this.state.rooms.size });
    });

    console.log("Lobby Created.");
    // Handle creating a new room
    this.onMessage("create_room", (client: Client, options: any) => {
      const roomOptions = options as {
        isPrivate?: boolean;
        maxRounds?: number;
        waitTime?: number;
        accessCode?: string;
        username: string;
      };
      this.createGameRoom(client, roomOptions);
    });

    // Handle finding room by access code
    this.onMessage("find_room", async (client: Client, message: any) => {
      const accessCode = message.accessCode.toUpperCase();
      let foundRoomId = null;

      console.log(
        `[LOBBY] Client ${client.sessionId} searching for room with access code: ${accessCode}`
      );
      console.log(
        `[LOBBY] Current rooms count in state: ${this.state.rooms.size}`
      );

      // Debug: Print all available room access codes
      this.state.rooms.forEach((room, roomId) => {
        console.log(
          `[LOBBY] Available room in state: ${roomId}, access code: ${room.accessCode}`
        );
      });

      // Search for the room with the matching access code in our state
      this.state.rooms.forEach((room, roomId) => {
        if (room.accessCode === accessCode) {
          foundRoomId = roomId;
          console.log(
            `[LOBBY] Room match found in state! Room ID: ${roomId}, Access code: ${room.accessCode}`
          );
        }
      });

      // If room was found in our state
      if (foundRoomId) {
        const room = this.state.rooms.get(foundRoomId);
        console.log(
          `[LOBBY] Room found in state: ${foundRoomId} for access code: ${accessCode}, sending to client`
        );
        client.send("room_found", { roomId: foundRoomId, accessCode });
      }
      // Try to find the room through the presence system as a fallback
      else {
        console.log(
          `[LOBBY] Room not found in state, querying all available rooms...`
        );

        try {
          // Get all rooms from the presence system
          const rooms = await this.presence.smembers("rooms");
          console.log(`[LOBBY] Found ${rooms.length} rooms in presence system`);

          // Check each room for matching access code
          for (const roomId of rooms) {
            try {
              // Get room data from presence
              const roomData = await this.presence.hgetall(`room:${roomId}`);

              if (roomData && roomData.metadata) {
                // Parse metadata
                let metadata;
                try {
                  metadata = JSON.parse(roomData.metadata);
                } catch (e) {
                  console.log(
                    `[LOBBY] Error parsing metadata for room ${roomId}:`,
                    e
                  );
                  continue;
                }

                console.log(`[LOBBY] Room ${roomId} metadata:`, metadata);

                // Check if access code matches
                if (
                  metadata.accessCode &&
                  metadata.accessCode.toUpperCase() === accessCode
                ) {
                  console.log(
                    `[LOBBY] Found room with matching access code: ${roomId}`
                  );
                  client.send("room_found", { roomId, accessCode });
                  return;
                }
              }
            } catch (e) {
              console.error(
                `[LOBBY] Error getting data for room ${roomId}:`,
                e
              );
            }
          }

          // No room found after direct search
          console.log(
            `[LOBBY] No room found with access code: ${accessCode} after direct search`
          );
          client.send("room_not_found");
        } catch (e) {
          console.error(`[LOBBY] Error in direct room search:`, e);
          client.send("room_not_found");
        }
      }
    });

    // Handle joining a room by ID
    this.onMessage("join_room_by_id", (client: Client, message: any) => {
      try {
        const roomId = message.roomId;
        const room = this.state.rooms.get(roomId);

        if (!room) {
          client.send("room_not_found");
          return;
        }

        // Send the client info they need to join directly
        client.send("room_info", {
          roomId: roomId,
          accessCode: room.accessCode,
          isPrivate: room.isPrivate,
        });
      } catch (error) {
        console.error("Error joining room:", error);
        client.send("room_join_error", { message: "Failed to join game room" });
      }
    });
  }

  // Create a new game room and manage it through the lobby
  private createGameRoom(
    client: Client,
    options: {
      isPrivate?: boolean;
      maxRounds?: number;
      waitTime?: number;
      accessCode?: string;
      username: string;
    }
  ) {
    try {
      // Since we can't create rooms directly, we'll send info back to client
      // to create the room through the client connection
      client.send("create_room_info", {
        isPrivate: options.isPrivate !== undefined ? options.isPrivate : true,
        maxRounds: options.maxRounds || 3,
        waitTime: options.waitTime || 3,
        username: options.username,
      });

      console.log(`Room creation info sent to client ${client.sessionId}`);
    } catch (error) {
      console.error("Error in room creation process:", error);
      client.send("room_creation_error", {
        message: "Failed to process game room creation",
      });
    }
  }

  onJoin(client: Client) {
    console.log(`Client ${client.sessionId} joined the lobby`);

    // Send current room list to the newly joined client
    const roomsList: Record<string, any> = {};
    this.state.rooms.forEach((room, roomId) => {
      roomsList[roomId] = {
        roomId: room.roomId,
        accessCode: room.accessCode,
        isPrivate: room.isPrivate,
        playerCount: room.playerCount,
        maxPlayers: room.maxPlayers,
        phase: room.phase,
        gameStarted: room.gameStarted,
      };
    });

    client.send("rooms_list", { rooms: roomsList });
  }

  onLeave(client: Client) {
    console.log(`Client ${client.sessionId} left the lobby`);
  }
}
