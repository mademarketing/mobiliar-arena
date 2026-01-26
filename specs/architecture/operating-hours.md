# Game Configuration

*This file was part of the kiosk game template (operating hours for prize distribution) and has been replaced with Mobiliar Arena configuration.*

## Overview

Mobiliar Arena configuration is driven by JSON settings files, allowing easy customization without code changes.

## Settings Structure

Location: `docker/app/server/content/settings.json`

```json
{
  "game": {
    "duration": 60,
    "ballSpawnInterval": 5,
    "minPlayers": 2,
    "maxPlayers": 6
  },
  "difficulty": {
    "paddleShrinkStart": 1.0,
    "paddleShrinkEnd": 0.6,
    "ballSpeedStart": 200,
    "ballSpeedEnd": 260
  },
  "theme": {
    "active": "basketball",
    "available": ["basketball", "handball", "volleyball", "floorball", "corporate"]
  },
  "input": {
    "phidgets": {
      "enabled": true,
      "serverPort": 5661
    },
    "joinHoldDuration": 3000
  },
  "display": {
    "width": 1920,
    "height": 1080,
    "arenaRadius": 480
  }
}
```

## Theme Configuration

Each theme has its own asset folder:

```
docker/app/client/public/assets/themes/
├── basketball/
│   ├── background.png
│   └── ball.png
├── handball/
│   ├── background.png
│   └── ball.png
├── volleyball/
│   ├── background.png
│   └── ball.png
├── floorball/
│   ├── background.png
│   └── ball.png
└── corporate/
    ├── background.png    (Mobiliar white/red branding)
    └── ball.png
```

**Asset Requirements**:
- `background.png`: Circular arena background, 1920x1080 with important content in center
- `ball.png`: Ball sprite, consistent size across themes (~30x30 pixels)

## Admin Panel Configuration

The admin panel (`/admin`) allows runtime configuration:

- **Theme Selection**: Switch between available themes
- **Game Settings**: Adjust duration, ball spawn rate
- **Player Limits**: Set min/max players
- **Input Testing**: Test and configure button mapping
- **Highscore Management**: View and reset highscores

## Environment Variables

Optional overrides via `.env`:

```bash
# Server port
PORT=3000

# Enable debug logging
DEBUG=true

# Phidgets configuration
PHIDGETS_HOST=localhost
PHIDGETS_PORT=5661
```

## References

- Settings loading: `docker/app/server/src/utils/settings.ts`
- Admin panel: `docker/app/server/public/admin/`
- API endpoints: `docker/app/server/src/routes/api.ts`
