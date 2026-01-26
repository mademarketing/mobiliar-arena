# Event-Driven Prize Distribution Flow

## Overview

The prize distribution system uses an event-driven architecture where the client controls game logic and the server provides prize outcomes. This ensures consistency across physical button presses, keyboard input, and automated testing.

## Core Events

### GameEvents.BuzzerPress
- **Source**: Server (from physical button) OR relayed from SimulateBuzzerPress
- **Direction**: Server → All Clients (broadcast)
- **Payload**: `channel: number`
- **Purpose**: Notify all clients that a button was pressed
- **Client Behavior**:
  - **Idle scene**: Request prize → transition to IconGrid with outcome

### GameEvents.SimulateBuzzerPress
- **Source**: Stress test or automated testing
- **Direction**: Test Client → Server
- **Payload**: `channel: number`
- **Purpose**: Simulate a physical button press for testing
- **Server Behavior**: Relay as `BuzzerPress` to all clients

### GameEvents.RequestPrize
- **Source**: Client (from Idle scene)
- **Direction**: Client → Server (with callback)
- **Payload**: Callback function
- **Purpose**: Request a new prize outcome from the server before starting game
- **Server Behavior**: Call `prizeEngine.determinePrizeOutcome()` and return via callback

### GameEvents.PrizeAwarded
- **Source**: Server
- **Direction**: Server → All Clients (broadcast)
- **Payload**: `PrizeOutcome { prizeId, prizeType, displayName, textureKey, timestamp }`
- **Purpose**: Broadcast prize outcome for monitoring/legacy clients
- **Note**: Primary prize delivery uses RequestPrize callback; this is supplementary

### GameEvents.AnimationComplete
- **Source**: Client
- **Direction**: Client → Server (relayed to all clients)
- **Payload**: `{ timestamp: string }`
- **Purpose**: Signal that prize animation has completed
- **Usage**: Used by stress test to coordinate timing

## Event Flow Diagrams

### Game Start - Buzzer Press from Idle

```
┌─────────────────┐
│ Physical Button │
│    Pressed      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Server (app.ts)                 │
│ io.emit(BuzzerPress, channel)   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ All Clients Receive BuzzerPress         │
└────────┬────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Client: Idle.handleBuzzerPress()         │
│ Transition to IconGrid scene             │
└──────────────────────────────────────────┘
```

### Icon Grid Sequence

```
┌──────────────────────────────────────────┐
│ IconGrid Scene                           │
│ - 9 icons (beach, car, house, money, win)│
│ - 3-4 win icons for suspense             │
│ - Outcome already determined by server   │
└────────┬─────────────────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐  ┌─────────┐
│ Win     │  │ Lose    │
│3 yellow │  │2 yellow │
│ icons   │  │+ 1 red  │
└────┬────┘  └────┬────┘
     │            │
     ▼            ▼
┌─────────┐  ┌─────────┐
│  Wheel  │  │ Result  │
│  Scene  │  │ (lose)  │
└─────────┘  └─────────┘
```

### Prize Request - Idle Scene (Before Game Start)

```
┌──────────────────────────────────────────┐
│ Client: Idle.handleBuzzerPress()         │
│ Emits RequestPrize with callback         │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Server: socket.on(RequestPrize)          │
│ - Calls prizeEngine.determinePrizeOutcome()
│ - Logs to database (1 entry)             │
│ - Returns outcome via callback           │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Client: Receives callback with outcome   │
│ Transitions to IconGrid with outcome     │
└──────────────────────────────────────────┘
```

### Dismiss - Result Scene Auto-Return

```
┌──────────────────────────────────────────┐
│ Result Scene                             │
│ - Auto-dismisses after 10 seconds        │
│ - OR Space key pressed to skip           │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Client: Result.returnToIdle()            │
│ - Emits AnimationComplete                │
│ - Transition to Idle scene               │
│ - NO database entry                      │
└──────────────────────────────────────────┘
```

### Stress Test Simulation

```
┌──────────────────────────────────┐
│ Stress Test (every Ns)           │
│ emit(SimulateBuzzerPress, 0)     │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Server receives SimulateBuzzerPress      │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Server relays as BuzzerPress             │
│ io.emit(BuzzerPress, channel)            │
└────────┬─────────────────────────────────┘
         │
         ▼
    [Same flow as Physical Button]
```

## Key Design Decisions

### 1. Client Controls Scene Transitions
**Rationale**: The client knows which scene is active and can make immediate transition decisions without server round-trips.

**Benefits**:
- Faster response time
- Consistent behavior across all input methods
- Server focuses on prize outcomes only

### 2. Server Only Determines Prize Outcomes
**Rationale**: Prize distribution logic (adaptive algorithm, database, etc.) lives on the server.

**Benefits**:
- Single source of truth for prizes
- Cannot be manipulated by client
- Easy to test and audit

### 3. BuzzerPress is a Broadcast Event
**Rationale**: All clients should react to button presses.

**Benefits**:
- Multiple displays stay in sync (if needed in future)
- Easy to add new clients
- Server doesn't need to track clients

### 4. Separate SimulateBuzzerPress Event
**Rationale**: Clear distinction between real hardware and testing.

**Benefits**:
- Easy to identify test traffic in logs
- Can add special handling for tests if needed
- Self-documenting code

### 5. Prize Request Happens in Idle Scene
**Rationale**: Prize outcome is determined before the game starts, enabling the IconGrid animation to be purely visual.

**Benefits**:
- IconGrid animation is deterministic (knows outcome in advance)
- No server round-trip during game sequence
- Timeout handling in Idle prevents stuck states

## Database Logging

**One database entry per game played**, triggered by RequestPrize:

- `RequestPrize` → `prizeEngine.determinePrizeOutcome()` → Database entry created ✓
- Auto-dismiss → Scene transition → NO database entry ✓

This ensures accurate metrics:
- Win rate = prizes awarded / games played
- Each "game" is one full cycle (Idle → IconGrid → [Wheel →] Result → Idle)

## Scene-Specific Event Handling

| Scene | BuzzerPress Action | RequestPrize | PrizeAwarded |
|-------|-------------------|--------------|--------------|
| Idle | Request prize → IconGrid | Sends with callback | N/A |
| IconGrid | N/A | N/A | N/A |
| Wheel | N/A | N/A | N/A |
| Result | N/A (auto-dismiss) | N/A | N/A |

## Code Locations

### Server (app.ts)
- Physical button handler: Emits `BuzzerPress`
- `RequestPrize` handler: Determines prize and returns via callback
- `SimulateBuzzerPress` relay handler
- `AnimationComplete` broadcast handler

### Client Scenes
- **Idle.ts**: Listen for `BuzzerPress`, request prize, transition to IconGrid
- **IconGrid.ts**: Animate icon sequence based on pre-determined outcome
- **Wheel.ts**: Spin animation, transition to Result
- **Result.ts**: Display win/lose, auto-dismiss or Space to skip

### Stress Test (stress-test.ts)
- Send `SimulateBuzzerPress` to start game cycle
- Wait for `AnimationComplete` to know when to send next press

## Testing

The stress test validates:
1. ✓ Only one database entry per play cycle
2. ✓ Correct win rate based on algorithm
3. ✓ Scene transitions complete properly
4. ✓ Show/dismiss cycle completes properly
5. ✓ Memory remains stable over time

Run stress test: `npm run stress-test`
