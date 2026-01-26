# Claude Code Instructions

## Project Overview

**Mobiliar Arena** is a cooperative multiplayer circular Pong game for 2-6 players, created for Mobiliar's 200th anniversary campaign "Besser zusammen" (Better together). Players stand around a circular LED table, each controlling a paddle with arcade buttons, working together to keep balls in play.

## Project Conventions

### Plans and Specifications
- Save all plans and specifications in the `specs/` folder
- Use naming convention: `feat-{feature-name}.md` for feature plans
- Use naming convention: `fix-{issue-name}.md` for bug fix plans

### Documentation
- AI/LLM documentation goes in `ai_docs/` folder
- Use `/load_ai_docs` command to fetch framework documentation
- Project specs in `specs/product/` (mission, requirements, roadmap, tech-stack)
- Architecture docs in `specs/architecture/`

### Development
- Client code: `docker/app/client/` (Phaser 3 game)
- Server code: `docker/app/server/` (Express + Socket.io)
- Shared types: `docker/app/shared/`

## Architecture

### Game Flow
1. **Bootstrap** → Loads settings from server
2. **Preload** → Loads theme assets (background, balls)
3. **Lobby** → Players join by holding both buttons for 3s
4. **Countdown** → 3-2-1-GO before gameplay
5. **Game** → 60-second cooperative Pong
6. **Result** → Team score display, highscore check

### Key Files to Customize

**Client:**
- `docker/app/client/src/scenes/Lobby.ts` - Player join screen
- `docker/app/client/src/scenes/Game.ts` - Main gameplay (paddles, balls, physics)
- `docker/app/client/src/scenes/Result.ts` - Score display
- `docker/app/client/src/consts/TextureKeys.ts` - Asset keys
- `docker/app/client/public/assets/themes/` - Theme backgrounds and ball sprites

**Server:**
- `docker/app/server/content/settings.json` - Game configuration
- `docker/app/server/src/services/` - Phidgets input handling

### Themes
- `basketball/` - Basketball court and ball
- `handball/` - Handball field and ball
- `volleyball/` - Volleyball court and ball
- `floorball/` - Floorball rink and ball
- `corporate/` - Mobiliar white/red branding

## Testing

### Keyboard Controls (Development)
- `1-6`: Toggle player join/leave in lobby
- `Enter`: Force start game
- `Arrow keys`: Control Player 1 paddle
- `A/D`: Control Player 2 paddle
- `Space`: Spawn extra ball
- `Esc`: End game early

### Endpoints
- Game: http://localhost:8080
- Admin panel: http://localhost:3000/admin

## Key Technical Concepts

### Circular Coordinate System
- Canvas: 1920x1080 (standard HD)
- Arena center: (960, 540)
- Arena radius: ~480 pixels
- Paddles positioned using polar coordinates
- See `specs/architecture/circular-physics.md`

### Input System
- Phidgets digital inputs for arcade buttons
- 2 buttons per player (left/right)
- 3-second hold gesture to join
- See `specs/architecture/input-system.md`
