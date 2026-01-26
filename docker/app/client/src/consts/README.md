# Constants Directory

This directory contains centralized configuration and constant definitions for the Win for Life Roadshow game client.

## Files

### `config.ts`
Main Phaser game configuration:
- Canvas: 1920x1080 HD horizontal
- Scale mode: `Scale.FIT` with `CENTER_BOTH` (automatically fits any screen)
- Plugins: GamePlugin (Socket.io), WebfontLoader (custom fonts)

### `SceneKeys.ts`
Scene identifier constants for the game flow:
```typescript
enum SceneKeys {
  Bootstrap = "bootstrap",  // Load settings from server
  Preload = "preload",      // Load game assets
  Game = "game",            // Main game scene
}
```

### `TextureKeys.ts`
Texture key constants for loaded assets. Add keys here that match your asset loading in `Preload.ts`:
```typescript
const TextureKeys = {
  Background: "background",
  Logo: "logo",
  WheelBase: "wheel-base",
  // ... add more as needed
} as const;
```

### `GameConstants.ts`
Centralized game values:
- `CANVAS` - Width (1920) and height (1080) dimensions
- `ANIMATION_DURATION` - Fade and transition timing
- `DEPTH` - Z-index layering (background, game objects, UI, particles)
- `COLORS` - Common color values
- `SESSION` - Session and refresh timing

## Usage

Import constants in your scenes:
```typescript
import SceneKeys from "../consts/SceneKeys";
import TextureKeys from "../consts/TextureKeys";
import { CANVAS, DEPTH } from "../consts/GameConstants";

// Use constants
this.add.image(CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2, TextureKeys.Background)
  .setDepth(DEPTH.BACKGROUND);
```

## Adding New Constants

1. For textures: Add to `TextureKeys.ts` and load in `Preload.ts`
2. For game values: Add to appropriate section in `GameConstants.ts`
3. For new scenes: Add to `SceneKeys.ts` and register in `utils/registerScenes.ts`
