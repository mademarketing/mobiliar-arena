# Mobiliar Arena

A cooperative multiplayer circular Pong game for 2-6 players, created for Mobiliar's 200th anniversary campaign "Besser zusammen" (Better together). Players stand around a circular LED table, each controlling a paddle with arcade buttons, working together to keep balls in play.

## Features

- **Circular Pong** - Cooperative multiplayer gameplay on a circular arena
- **2-6 Players** - Dynamic paddle sizing based on player count
- **Sport Themes** - Basketball, handball, volleyball, floorball, corporate
- **Phidgets Input** - Arcade button hardware integration
- **Admin Panel** - Theme selection, game settings, highscore management
- **Docker Deployment** - Ready for Balena cloud deployment

## Game Flow

```
Bootstrap → Preload → Lobby → Countdown → Game (60s) → Result → Lobby
```

1. **Bootstrap** - Loads settings from server
2. **Preload** - Loads theme assets (background, balls, fonts)
3. **Lobby** - Players join by holding both buttons for 3 seconds
4. **Countdown** - 3-2-1-GO! (players can practice moving paddles)
5. **Game** - 60-second cooperative Pong
6. **Result** - Team score display, highscore check, auto-returns to Lobby

## Quick Start

### Development

```bash
# Install dependencies
cd docker/app/client && npm install
cd ../server && npm install

# Start development servers
# Terminal 1: Server
cd docker/app/server && npm run dev

# Terminal 2: Client
cd docker/app/client && npm run dev
```

- Client: http://localhost:8080
- Server API: http://localhost:3000
- Admin Panel: http://localhost:3000/admin

### Docker

```bash
cd docker
docker-compose up --build
```

## Keyboard Controls (Development)

Each player has two keys: left (counterclockwise) and right (clockwise).

**In the Lobby**, hold both keys for 3 seconds to join. Minimum 2 players to start.

| Player | Left | Right |
|--------|------|-------|
| 1      | `1`  | `2`   |
| 2      | `3`  | `4`   |
| 3      | `5`  | `6`   |
| 4      | `7`  | `8`   |
| 5      | `9`  | `0`   |
| 6      | `←`  | `→`   |

### Other Shortcuts

| Key | Scene | Action |
|-----|-------|--------|
| Enter | Lobby | Force start (with 2+ players) |
| Space | Game | Spawn extra ball |
| Escape | Game | End game early |
| Space | Result | Skip to Lobby |

## Project Structure

```
docker/app/
├── client/                 # Phaser 3 game client
│   ├── src/
│   │   ├── scenes/         # Game scenes (Lobby, Countdown, Game, Result)
│   │   ├── managers/       # GameArena, ThemeManager
│   │   ├── classes/        # Ball, Paddle
│   │   ├── consts/         # Constants, keys, config
│   │   ├── utils/          # Physics, effects, helpers
│   │   └── plugins/        # Phaser plugins
│   └── public/assets/      # Game assets and themes
│
├── server/                 # Express + Socket.io server
│   ├── src/
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API endpoints
│   │   ├── database/       # SQLite database
│   │   └── utils/          # Utilities
│   └── content/            # Configuration files
│       └── settings.json
│
└── shared/                 # Shared types and events
```

## Themes

Themes are stored in `docker/app/client/public/assets/themes/`:

| Theme | Description |
|-------|-------------|
| `basketball` | Basketball court and ball |
| `handball` | Handball field and ball |
| `volleyball` | Volleyball court and ball |
| `floorball` | Floorball rink and ball |
| `corporate` | Mobiliar white/red branding |

Each theme provides `background.png` and `ball.png`. Switch themes via the admin panel or `settings.json`.

## Hardware Setup

### Phidgets Digital Inputs

- 2 buttons per player (left/right), up to 12 channels for 6 players
- Phidget hub connected via USB
- Button mapping configurable in settings

### Display

- Output: 1920x1080 HD (HDMI)
- External LED controller maps rectangular canvas to circular LED screen
- Circular arena rendered centered at (960, 540) with ~450px radius

## Deployment

### Balena Cloud

```bash
balena push <fleet-name>
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `ADMIN_PASSWORD` | Admin panel password | `secret123` |

## Infrastructure Services

- **app** - Main game server and client
- **browser** - Chromium in kiosk mode
- **phidgets** - Hardware button integration
- **cloudflared** - Remote access tunnel

## License

MIT
