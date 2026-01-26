# Kiosk Game Template

A reusable template for building interactive kiosk games with Phaser 3 and Node.js. Includes complete infrastructure for prize distribution, admin panels, and receipt printing.

## Features

- **Phaser 3 Game Client** - Modern HTML5 game framework (1920x1080 canvas)
- **Express + Socket.io Server** - Real-time game communication
- **Prize Distribution Engine** - Adaptive probability algorithm
- **Admin Panel** - Manage prizes, view statistics
- **Promoter Panel** - Event staff controls
- **Receipt Printing** - Star Micronics printer support
- **Docker Deployment** - Ready for Balena cloud deployment

## Game Flow

```
Bootstrap → Preload → Idle → [Buzzer] → Game → Result → Idle
```

1. **Bootstrap** - Loads settings from server
2. **Preload** - Loads game assets
3. **Idle** - Attract screen, waits for buzzer press
4. **Game** - Main game scene (implement your mechanic here)
5. **Result** - Win celebration or lose consolation, auto-returns to Idle

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

- Client: http://localhost:5173
- Server API: http://localhost:3000
- Admin Panel: http://localhost:3000/admin
- Promoter Panel: http://localhost:3000/promoter

### Docker

```bash
cd docker
docker-compose up --build
```

## Project Structure

```
docker/app/
├── client/                 # Phaser 3 game client
│   ├── src/
│   │   ├── scenes/         # Game scenes
│   │   │   ├── Bootstrap.ts
│   │   │   ├── Preload.ts
│   │   │   ├── Idle.ts
│   │   │   ├── Game.ts     # ← Your game mechanic
│   │   │   └── Result.ts
│   │   ├── consts/         # Constants and config
│   │   ├── utils/          # Utility classes
│   │   └── plugins/        # Phaser plugins
│   └── public/assets/      # Game assets
│
├── server/                 # Express + Socket.io server
│   ├── src/
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API endpoints
│   │   ├── database/       # SQLite database
│   │   └── utils/          # Utilities
│   └── content/            # Configuration files
│       ├── prizes.json
│       └── distribution-config.json
│
└── shared/                 # Shared types
```

## Customization Guide

### 1. Implement Your Game Mechanic

Edit `docker/app/client/src/scenes/Game.ts`:

```typescript
create() {
  // The outcome is already determined by the server
  const outcome = this.outcome;

  // TODO: Create your game animation/interaction
  // Examples: prize wheel, scratch card, slot machine, claw machine

  // When reveal is complete, transition to Result:
  this.scene.start(SceneKeys.Result, {
    isWin: outcome?.isWin ?? false,
    outcome: outcome,
  });
}
```

### 2. Add Your Assets

Place assets in `docker/app/client/public/assets/`:
- `images/` - PNG/JPG images
- `videos/` - WebM videos
- `fonts/` - Custom fonts

Update `Preload.ts` and `TextureKeys.ts` to load them.

### 3. Configure Prizes

Edit `docker/app/server/content/prizes.json`:

```json
{
  "prizes": [
    { "textureKey": "grand-prize", "displayName": "Grand Prize" },
    { "textureKey": "consolation", "displayName": "Small Prize" }
  ]
}
```

### 4. Set Distribution Quotas

Edit `docker/app/server/content/distribution-config.json`:

```json
{
  "standard": {
    "name": "Standard",
    "description": "Normal event day",
    "prizes": {
      "grand-prize": 10,
      "consolation": 100
    }
  }
}
```

### 5. Customize Receipt Printing

Edit `docker/app/server/src/utils/printer.ts` to add your branding.

## Testing Shortcuts

| Key | Scene | Action |
|-----|-------|--------|
| Space | Idle | Start game (requests prize from server) |
| 1 | Idle | Force WIN (bypasses server) |
| 2 | Idle | Force LOSE (bypasses server) |
| Space | Game/Result | Skip to next scene |

## Key Events

The game communicates via Socket.io events defined in `shared/GameEvents.ts`:

| Event | Direction | Description |
|-------|-----------|-------------|
| `BuzzerPress` | Server → Client | Physical button was pressed |
| `RequestPrize` | Client → Server | Request prize outcome |
| `PrizeAwarded` | Server → Client | Prize determined and sent |
| `GamePaused` | Server → Client | Admin paused the game |
| `GameResumed` | Server → Client | Admin resumed the game |

## Prize System

Two-tier prize distribution:
1. **Inventory** - Limited daily quantity prizes with adaptive probability
2. **Consolation** - Always available fallback (lose)

Configure prizes via:
- Admin panel: http://localhost:3000/admin
- Config files: `docker/app/server/content/`

### QR Code Requirement

Each winning prize requires an available QR code to be assigned. QR codes must be imported via the Admin panel before prizes can be awarded.

### Auto-Pause Feature

The game will **automatically pause** when QR codes are depleted for any prize type.

**To resume:** Go to the Promoter panel (`/promoter`) and click the Resume button.

**To prevent:** Ensure sufficient QR codes are imported for all prize types before starting.

## Deployment

### Balena Cloud

1. Create a fleet in Balena Cloud
2. Push the code:
   ```bash
   balena push <fleet-name>
   ```

### Environment Variables

Configure in `docker-compose.yml` or Balena dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PRINTER_IP` | Star printer IP address | `192.168.1.100` |
| `ADMIN_PASSWORD` | Admin panel password | `secret123` |

## Infrastructure Services

- **app** - Main game server and client
- **browser** - Chromium in kiosk mode
- **phidgets** - Hardware buzzer integration
- **cloudflared** - Remote access tunnel

## License

MIT
