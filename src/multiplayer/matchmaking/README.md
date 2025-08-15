# Multiplayer Matchmaking System - Fixed

This document describes the updated multiplayer matchmaking system with synchronized gameplay.

## 🔧 **Fixed Issues**

### 1. **Matchmaking Timeout Fixed**

- **Problem**: "No match found" error due to improper Firebase listener cleanup
- **Solution**: Improved matchmaking service with proper room creation and joining logic

### 2. **Timer Synchronization Fixed**

- **Problem**: Timers were out of sync between players
- **Solution**: Host-managed timers with Firebase synchronization
- **Implementation**: Only the host runs timers to avoid conflicts

### 3. **Game Flow Redesigned**

- **New Flow**: Both players must click "TAP TO START" → 3s countdown → Selection phase → Results
- **Synchronized**: All state changes are synchronized through Firebase Firestore

## 🎮 **New Game Flow**

### Phase 1: **Waiting for Ready** (`waiting_for_ready`)

- Both players see "TAP TO START" button
- When both players click, game moves to countdown
- No timers running during this phase

### Phase 2: **Countdown** (`countdown`)

- 3-second countdown managed by host
- Synchronized across all clients
- Auto-transitions to playing phase

### Phase 3: **Playing** (`playing`)

- Players have configured time to make choices (3s or 5s)
- Selection timer managed by host
- Auto-reveals when both choose or timer expires

### Phase 4: **Revealing** (`revealing`)

- Shows choices and animations for 2 seconds
- Calculates round winner
- Updates scores and round history

### Phase 5: **Result** (`result`)

- Shows round results
- Host can start next round (returns to Phase 1)
- Or game ends if all rounds completed

## 🏗️ **Architecture Updates**

### **Host-Managed Timers**

```typescript
// Only host runs timers to avoid conflicts
useHostTimers(roomId, gameService);

// Host manages:
// - Countdown timer (3 seconds)
// - Selection timer (3-5 seconds)
// - Timeout handling
```

### **Firebase Structure**

```typescript
FirebaseGameRoom {
  // ... existing fields
  playerReady: Record<string, boolean>; // NEW: Ready states
  phase: "waiting_for_ready" | "countdown" | "playing" | "revealing" | "result" | "finished";
}
```

### **Synchronized State Management**

- All game state stored in Firebase Firestore
- Real-time updates via Firebase listeners
- Local Zustand store syncs with Firebase
- Host authoritative for timer management

## 🔥 **Key Components**

### **1. MultiplayerRoom Component**

- Handles all game phases
- Shows appropriate UI for each phase
- Integrates host timers
- Displays round indicators

### **2. Host Timer Hook**

```typescript
useHostTimers(roomId: string, gameService: GameService)
// - Manages countdown (host only)
// - Manages selection timer (host only)
// - Handles timeouts automatically
```

### **3. Game Service**

```typescript
class MultiplayerGameService {
  setPlayerReady(); // Mark player ready
  makeChoice(choice); // Submit choice
  handleTimeout(); // Auto-assign choices on timeout
  nextRound(); // Start next round (host only)
}
```

## 🎯 **User Experience**

### **1. Matchmaking**

- Select game config (rounds: 3/5/7, wait time: 3s/5s)
- Automatic matching with same config
- 30-second timeout with proper cleanup

### **2. Game Start**

- Both players must tap "TAP TO START"
- Clear visual feedback for ready states
- Synchronized countdown before each round

### **3. Gameplay**

- Smooth timer countdown
- Immediate choice reveal when both choose
- Auto-timeout with default choices
- Round-by-round progress indicators

### **4. Round Indicators**

- Visual feedback for each round result
- Green checkmark = Win
- Red X = Loss
- Yellow circle = Draw

## 🛡️ **Error Handling**

### **Connection Issues**

- Automatic reconnection
- Graceful degradation
- Error state with redirect to lobby

### **Player Disconnection**

- Opponent disconnect detection
- Game state cleanup
- Proper room management

### **Timer Conflicts**

- Only host manages timers
- Automatic failover if host disconnects
- Clean timer cleanup on unmount

## 🚀 **Usage Example**

```tsx
// 1. User clicks "Quick Match"
<MatchmakingLobby onClose={onClose} />;

// 2. Matched players join room
navigate(`/multiplayer/${roomId}`);

// 3. Both players see "TAP TO START"
<button onClick={handleStartRound}>TAP TO START</button>;

// 4. Synchronized countdown begins
// 5. Players make choices within time limit
// 6. Results shown, repeat for all rounds
```

This implementation provides a robust, synchronized multiplayer experience with proper timer management and error handling.

## Features

### 1. **Automatic Matchmaking**

- Players are matched based on game configuration (rounds, wait time)
- Real-time matching using Firebase Firestore
- 30-second timeout with cancellation support

### 2. **Real-time Gameplay**

- Firebase Firestore for real-time synchronization
- Automatic state updates for both players
- Timer synchronization across clients

### 3. **Connection Management**

- Automatic reconnection handling
- Opponent disconnection detection
- Room cleanup when players leave

### 4. **Game Logic**

- Identical to single-player mode
- Rock, Paper, Scissors with animations
- Round-based scoring system
- Configurable rounds (3, 5, 7) and wait times (3s, 5s)

## Usage

### From Home Component

```tsx
import { MatchmakingLobby } from "../multiplayer/matchmaking";

// In your component
<Dialog isOpen={isQuickMatchOpen} onClose={() => setIsQuickMatchOpen(false)}>
  <MatchmakingLobby onClose={() => setIsQuickMatchOpen(false)} />
</Dialog>;
```

### Direct Navigation

```tsx
// Navigate to multiplayer room
navigate(`/multiplayer/${roomId}`);
```

## Firebase Collections

### 1. **matchmaking** Collection

```typescript
{
  uid: string;              // Player UID
  playerData: PlayerData;   // Player info (name, avatar)
  status: "waiting" | "matched" | "timedout";
  gameConfig: GameConfig;   // Game settings
  timestamp: Timestamp;     // When added to pool
  gameRoomId?: string;      // Room ID when matched
}
```

### 2. **gameRooms** Collection

```typescript
{
  players: string[];        // Array of player UIDs
  playerData: Record<string, PlayerData>;
  status: "waiting" | "playing" | "finished";
  currentRound: number;
  rounds: number;
  waitTime: number;
  scores: Record<string, number>;
  choices: Record<string, Choice | null>;
  roundHistory: RoundResult[];
  phase: MultiplayerGamePhase;
  countdown: number;
  selectionTimer: number;
  host: string;            // Host player UID
  createdAt: Timestamp;
  lastActivity: Timestamp;
}
```

## State Management

### Zustand Store

The `useMultiplayerGameStore` provides:

- **Game State**: Current phase, scores, choices, timers
- **Player Data**: Current player and opponent information
- **Connection State**: Connection status and errors
- **Actions**: Game controls and Firebase sync methods

### Key Store Methods

```typescript
// Game setup
setPlayer(playerData);
setOpponent(playerData);
setConfig(gameConfig);

// Game actions
makeChoice(choice);
startRound();
nextRound();
leaveGame();

// Firebase sync
syncFromFirebase(data);
```

## Game Flow

### 1. **Matchmaking Phase**

1. Player selects game configuration
2. System searches for waiting players with same config
3. If found, creates room and joins both players
4. If not found, adds player to waiting pool
5. Real-time listener notifies when match is found

### 2. **Game Setup Phase**

1. Players are added to game room
2. Host can start the game
3. Room status changes to "playing"

### 3. **Gameplay Phase**

1. Countdown timer synchronizes both clients
2. Players make choices simultaneously
3. Choices are submitted to Firebase
4. Results are calculated and synchronized
5. Process repeats for each round

### 4. **Game End Phase**

1. Final scores are calculated
2. Game winner is determined
3. Players can choose to play again or leave

## Error Handling

### Connection Issues

- Automatic reconnection attempts
- Graceful degradation when offline
- Error messages for connection failures

### Player Disconnection

- Opponent disconnect detection
- Game state cleanup
- Automatic room deletion when empty

### Room Management

- Automatic cleanup of stale rooms
- Timeout handling for abandoned games
- Proper resource cleanup on unmount

## Security Considerations

### Firebase Rules (Recommended)

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to manage their matchmaking entries
    match /matchmaking/{docId} {
      allow read, write: if request.auth != null &&
                        request.auth.uid == resource.data.uid;
    }

    // Allow players in a room to read/write room data
    match /gameRooms/{roomId} {
      allow read, write: if request.auth != null &&
                        request.auth.uid in resource.data.players;
    }
  }
}
```

## Performance Optimizations

1. **Efficient Queries**: Use indexed queries for matchmaking
2. **Minimal Updates**: Only sync necessary data changes
3. **Cleanup**: Automatic removal of stale entries
4. **Batched Operations**: Group related Firestore operations

## Testing

### Manual Test Scenarios

1. **Basic Matchmaking**: Two players find each other
2. **Timeout Handling**: Player waits without finding match
3. **Disconnection**: One player leaves during game
4. **Reconnection**: Player refreshes page during game
5. **Multiple Games**: Sequential games with same players

This system provides a robust, scalable multiplayer experience that mirrors the single-player game mechanics while adding real-time collaboration features.
