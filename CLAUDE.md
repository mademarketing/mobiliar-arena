# Claude Code Instructions

## Project Overview

This is a **Kiosk Game Template** - a reusable starting point for building interactive kiosk games with Phaser 3 and Node.js. It includes a complete infrastructure for prize distribution, admin panels, and receipt printing.

## Project Conventions

### Plans and Specifications
- Save all plans and specifications in the `specs/` folder
- Use naming convention: `feat-{feature-name}.md` for feature plans
- Use naming convention: `fix-{issue-name}.md` for bug fix plans

### Documentation
- AI/LLM documentation goes in `ai_docs/` folder
- Use `/load_ai_docs` command to fetch framework documentation

### Development
- Client code: `docker/app/client/` (Phaser 3 game)
- Server code: `docker/app/server/` (Express + Socket.io)
- Shared types: `docker/app/shared/`

## Architecture

### Game Flow
1. **Bootstrap** → Loads settings from server
2. **Preload** → Loads game assets
3. **Idle** → Attract screen, waits for buzzer press
4. **Game** → Main game scene (implement your mechanic here)
5. **Result** → Win celebration or lose consolation

### Key Files to Customize

**Client:**
- `docker/app/client/src/scenes/Game.ts` - Your main game mechanic
- `docker/app/client/src/scenes/Idle.ts` - Attract screen
- `docker/app/client/src/scenes/Result.ts` - Win/lose display
- `docker/app/client/src/consts/TextureKeys.ts` - Asset keys
- `docker/app/client/public/assets/` - Game assets

**Server:**
- `docker/app/server/content/prizes.json` - Prize definitions
- `docker/app/server/content/distribution-config.json` - Daily quotas
- `docker/app/server/src/utils/printer.ts` - Receipt templates

## Testing

- Press `Space` in Idle scene to trigger buzzer
- Press `1` to force a win (test shortcut)
- Press `2` to force a lose (test shortcut)
- Admin panel: http://localhost:3000/admin
- Promoter panel: http://localhost:3000/promoter
