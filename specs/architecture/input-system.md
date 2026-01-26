# Input System Architecture

## Overview

Mobiliar Arena uses Phidgets digital inputs for arcade button control, with keyboard fallback for development. Each player has two buttons (left/right) to control their paddle movement.

## Hardware Configuration

### Phidget Hub

**Device**: Phidget InterfaceKit or Digital Input board
**Connection**: USB to host PC
**Server Port**: 5661 (Phidgets network server)

### Button Layout

```
Player Stations (around circular table):

     [P3]                [P4]
      ↙ ↘                ↙ ↘
    [L][R]              [L][R]

[P2]                          [P5]
 ↓                              ↓
[L][R]                        [L][R]

     [P1]                [P6]
      ↓                    ↓
    [L][R]              [L][R]
```

### Digital Input Mapping

Default configuration (configurable via settings):

| Player | Left Button | Right Button |
|--------|-------------|--------------|
| 1      | Channel 0   | Channel 1    |
| 2      | Channel 2   | Channel 3    |
| 3      | Channel 4   | Channel 5    |
| 4      | Channel 6   | Channel 7    |
| 5      | Channel 8   | Channel 9    |
| 6      | Channel 10  | Channel 11   |

## Server Implementation

### Phidget Connection

```typescript
import phidget22 from 'phidget22';

const conn = new phidget22.NetworkConnection(5661, 'localhost');
await conn.connect();

// Create digital input for each button
const inputs: phidget22.DigitalInput[] = [];
for (let channel = 0; channel < 12; channel++) {
  const input = new phidget22.DigitalInput();
  input.setChannel(channel);
  input.onStateChange = (state: boolean) => {
    handleButtonChange(channel, state);
  };
  await input.open();
  inputs.push(input);
}
```

### Button Event Handler

```typescript
function handleButtonChange(channel: number, pressed: boolean): void {
  const player = Math.floor(channel / 2);
  const isLeftButton = channel % 2 === 0;
  const direction = isLeftButton ? 'left' : 'right';

  // Emit to all connected clients
  io.emit(GameEvents.PlayerInput, {
    player,
    direction,
    pressed,
    timestamp: Date.now()
  });
}
```

### Socket.io Events

**Server → Client**:
```typescript
// Player button state change
{
  event: GameEvents.PlayerInput,
  payload: {
    player: number,      // 0-5
    direction: 'left' | 'right',
    pressed: boolean,
    timestamp: number
  }
}
```

## Client Implementation

### Input Handler

```typescript
class InputHandler {
  private buttonStates: Map<string, boolean> = new Map();

  constructor(private socket: Socket) {
    // Listen for Phidgets input
    socket.on(GameEvents.PlayerInput, this.handlePlayerInput.bind(this));

    // Set up keyboard fallback
    this.setupKeyboardInput();
  }

  private handlePlayerInput(data: PlayerInputData): void {
    const key = `${data.player}-${data.direction}`;
    this.buttonStates.set(key, data.pressed);
  }

  public isButtonPressed(player: number, direction: 'left' | 'right'): boolean {
    return this.buttonStates.get(`${player}-${direction}`) ?? false;
  }
}
```

### Keyboard Mapping (Development)

```typescript
const KEYBOARD_MAP = {
  // Player 1
  'ArrowLeft': { player: 0, direction: 'left' },
  'ArrowRight': { player: 0, direction: 'right' },

  // Player 2
  'KeyA': { player: 1, direction: 'left' },
  'KeyD': { player: 1, direction: 'right' },

  // Player 3
  'KeyJ': { player: 2, direction: 'left' },
  'KeyL': { player: 2, direction: 'right' },

  // Numpad for players 4-6 (optional)
  'Numpad4': { player: 3, direction: 'left' },
  'Numpad6': { player: 3, direction: 'right' },
  'Numpad7': { player: 4, direction: 'left' },
  'Numpad9': { player: 4, direction: 'right' },
  'Numpad1': { player: 5, direction: 'left' },
  'Numpad3': { player: 5, direction: 'right' },
};
```

## Player Join Gesture

### Hold Both Buttons to Join

Players join by holding both their buttons simultaneously for 3 seconds:

```typescript
class JoinGestureDetector {
  private holdStartTimes: Map<number, number> = new Map();
  private readonly HOLD_DURATION_MS = 3000;

  constructor(
    private inputHandler: InputHandler,
    private onPlayerJoin: (player: number) => void
  ) {}

  public update(): void {
    for (let player = 0; player < 6; player++) {
      const leftPressed = this.inputHandler.isButtonPressed(player, 'left');
      const rightPressed = this.inputHandler.isButtonPressed(player, 'right');
      const bothPressed = leftPressed && rightPressed;

      if (bothPressed) {
        if (!this.holdStartTimes.has(player)) {
          this.holdStartTimes.set(player, Date.now());
        } else {
          const elapsed = Date.now() - this.holdStartTimes.get(player)!;
          if (elapsed >= this.HOLD_DURATION_MS) {
            this.onPlayerJoin(player);
            this.holdStartTimes.delete(player);
          }
        }
      } else {
        this.holdStartTimes.delete(player);
      }
    }
  }

  public getJoinProgress(player: number): number {
    const startTime = this.holdStartTimes.get(player);
    if (!startTime) return 0;
    return Math.min(1, (Date.now() - startTime) / this.HOLD_DURATION_MS);
  }
}
```

### Visual Feedback

Show join progress in the lobby:

```typescript
// In Lobby scene update loop
for (let player = 0; player < 6; player++) {
  const progress = this.joinDetector.getJoinProgress(player);
  this.playerSlots[player].setJoinProgress(progress);
}
```

## Input Debouncing

Prevent spurious button triggers:

```typescript
class DebouncedInput {
  private lastChangeTime: Map<number, number> = new Map();
  private readonly DEBOUNCE_MS = 20;

  public shouldAccept(channel: number): boolean {
    const now = Date.now();
    const lastChange = this.lastChangeTime.get(channel) ?? 0;

    if (now - lastChange < this.DEBOUNCE_MS) {
      return false;
    }

    this.lastChangeTime.set(channel, now);
    return true;
  }
}
```

## Connection Monitoring

### Phidget Disconnection Handling

```typescript
input.onDetach = () => {
  console.warn(`Phidget channel ${channel} detached`);

  // Notify admin panel
  io.emit(GameEvents.HardwareStatus, {
    channel,
    status: 'disconnected'
  });

  // Release any held buttons for that channel
  handleButtonChange(channel, false);
};

input.onAttach = () => {
  console.log(`Phidget channel ${channel} attached`);

  io.emit(GameEvents.HardwareStatus, {
    channel,
    status: 'connected'
  });
};
```

### Graceful Degradation

If a player's buttons fail, the game continues:

```typescript
// In Game scene
public update(): void {
  for (const player of this.activePlayers) {
    // Only update paddles for players with working input
    if (this.inputHandler.hasRecentInput(player.id)) {
      this.updatePaddle(player);
    }
    // Paddle stays in place if no input
  }
}
```

## Configuration

### Settings File

`content/settings.json`:

```json
{
  "input": {
    "phidgets": {
      "enabled": true,
      "serverPort": 5661,
      "serverHost": "localhost"
    },
    "keyboard": {
      "enabled": true  // Always enable for development
    },
    "buttonMapping": [
      { "player": 0, "left": 0, "right": 1 },
      { "player": 1, "left": 2, "right": 3 },
      { "player": 2, "left": 4, "right": 5 },
      { "player": 3, "left": 6, "right": 7 },
      { "player": 4, "left": 8, "right": 9 },
      { "player": 5, "left": 10, "right": 11 }
    ],
    "joinHoldDuration": 3000,
    "debounceMs": 20
  }
}
```

### Admin Panel Configuration

Allow button mapping changes via admin interface:

- Test each button (press to identify)
- Reassign channels to players
- Enable/disable individual player stations
- View connection status

## Testing

### Without Hardware

1. Set `phidgets.enabled: false` in settings
2. Use keyboard controls for all players
3. Number keys `1-6` toggle player join in lobby

### With Hardware

1. Ensure Phidgets server is running: `phidgetnetwork`
2. Verify connection in admin panel
3. Test each button individually
4. Test join gesture for each player

### Input Latency Testing

Target: < 50ms from button press to paddle movement

```typescript
// Add timestamps to measure latency
socket.on(GameEvents.PlayerInput, (data) => {
  const latency = Date.now() - data.timestamp;
  console.log(`Input latency: ${latency}ms`);
});
```
