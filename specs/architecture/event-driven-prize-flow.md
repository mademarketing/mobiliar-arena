# Event-Driven Architecture

*This file was part of the kiosk game template and has been replaced.*

For Mobiliar Arena's event-driven architecture, see:
- [scene-flow.md](scene-flow.md) - Scene transitions and game flow
- [input-system.md](input-system.md) - Button input event handling

## Socket.io Events (Mobiliar Arena)

### Input Events
- `PlayerInput` - Button press/release from hardware
- `PlayerJoinRequest` - Player initiating join gesture
- `PlayerJoined` - Player successfully joined

### Game Events
- `GameStart` - Countdown complete, begin gameplay
- `BallSpawn` - New ball entering play
- `ScoreUpdate` - Score changed
- `GameEnd` - Timer finished

### Admin Events
- `GamePaused` / `GameResumed` - Pause control
- `ThemeChanged` - Theme update
- `SettingsUpdated` - Configuration change
- `HardwareStatus` - Phidget connection status
