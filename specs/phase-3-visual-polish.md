# Plan: Phase 3 - Visual Polish & Theming

## Task Description
Implement production-quality visuals for Mobiliar Arena including a theme system for sport/corporate branding, enhanced ball and paddle visuals with animations and effects, polished UI elements, and celebration effects for the result screen.

## Objective
Transform the functional MVP into a visually impressive experience that:
- Supports 5 sport themes (basketball, handball, volleyball, floorball) + corporate theme
- Features animated balls with rotation, trails, and collision effects
- Has glowing paddles with smooth shrinking animations
- Displays polished UI with floating score popups and combo effects
- Celebrates team success with enhanced result screen animations

## Problem Statement
The current implementation has basic placeholder visuals - white circles for balls, solid color paddles, and minimal effects. For the 200th anniversary campaign, the game needs visual polish that matches Mobiliar's brand quality and creates an engaging spectacle for event attendees.

## Solution Approach
Implement Phase 3 in four sub-phases:
1. **Theme Infrastructure** - Asset structure, theme manager, dynamic loading
2. **Ball & Paddle Effects** - Rotation, trails, glow, collision particles
3. **UI Polish** - Floating text, combo popups, difficulty indicator
4. **Celebration Enhancement** - Confetti, high score detection, animated reveals

---

## Relevant Files

### Existing Files to Modify
- `docker/app/client/src/scenes/Preload.ts` - Theme asset loading
- `docker/app/client/src/scenes/Game.ts` - Ball/paddle effects, UI polish
- `docker/app/client/src/scenes/Lobby.ts` - Join animations
- `docker/app/client/src/scenes/Result.ts` - Celebration effects
- `docker/app/client/src/classes/Ball.ts` - Rotation, trails, textures
- `docker/app/client/src/classes/Paddle.ts` - Glow, shrink animation
- `docker/app/client/src/consts/TextureKeys.ts` - Theme texture keys
- `docker/app/client/src/consts/GameConstants.ts` - Effect constants
- `docker/app/server/content/settings.json` - Theme configuration

### New Files to Create
- `docker/app/client/src/managers/ThemeManager.ts` - Theme loading/switching
- `docker/app/client/src/utils/FloatingText.ts` - Score popup utility
- `docker/app/client/src/utils/CollisionEffect.ts` - Particle burst utility
- `docker/app/client/public/assets/themes/basketball/background.png`
- `docker/app/client/public/assets/themes/basketball/ball.png`
- `docker/app/client/public/assets/themes/handball/background.png`
- `docker/app/client/public/assets/themes/handball/ball.png`
- `docker/app/client/public/assets/themes/volleyball/background.png`
- `docker/app/client/public/assets/themes/volleyball/ball.png`
- `docker/app/client/public/assets/themes/floorball/background.png`
- `docker/app/client/public/assets/themes/floorball/ball.png`
- `docker/app/client/public/assets/themes/corporate/background.png`
- `docker/app/client/public/assets/themes/corporate/ball.png`

---

## Implementation Phases

### Phase 3.1: Theme Infrastructure
Create the foundation for loading and switching themes dynamically.

### Phase 3.2: Ball & Paddle Effects
Add visual polish to core game objects - rotation, trails, glow, particles.

### Phase 3.3: UI Polish
Enhance score display, combo feedback, and difficulty progression visuals.

### Phase 3.4: Celebration & Lobby Polish
Improve result celebration and lobby join animations.

---

## Step by Step Tasks

### 1. Create Theme Directory Structure

Create asset folders for each theme:

```
docker/app/client/public/assets/themes/
├── basketball/
│   ├── background.png   (1920x1080 court image)
│   └── ball.png         (64x64 basketball texture)
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
    ├── background.png   (Mobiliar white/red branding)
    └── ball.png         (neutral ball design)
```

- Create placeholder images initially (solid colors with text labels)
- Background: 1920x1080 PNG with circular arena area clear/dark
- Ball: 64x64 PNG with transparent background, sport-appropriate design

### 2. Add Theme Constants

Update `GameConstants.ts`:

```typescript
export const THEMES = {
  AVAILABLE: ['basketball', 'handball', 'volleyball', 'floorball', 'corporate'] as const,
  DEFAULT: 'basketball',
} as const;

export const EFFECTS = {
  BALL_TRAIL_LENGTH: 5,
  BALL_TRAIL_ALPHA: 0.3,
  BALL_ROTATION_SPEED: 0.1, // radians per pixel traveled
  PADDLE_GLOW_INTENSITY: 0.6,
  PADDLE_GLOW_RADIUS: 15,
  PADDLE_SHRINK_DURATION: 500, // ms for shrink animation
  COLLISION_PARTICLES: 8,
  COLLISION_PARTICLE_SPEED: 150,
  FLOATING_TEXT_DURATION: 800,
  FLOATING_TEXT_RISE: 50,
} as const;
```

### 3. Create ThemeManager

Create `docker/app/client/src/managers/ThemeManager.ts`:

```typescript
/**
 * ThemeManager - Handles theme loading and asset management
 */
export default class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: string = 'basketball';

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  setTheme(theme: string): void {
    this.currentTheme = theme;
  }

  getTheme(): string {
    return this.currentTheme;
  }

  getBackgroundKey(): string {
    return `theme-${this.currentTheme}-background`;
  }

  getBallKey(): string {
    return `theme-${this.currentTheme}-ball`;
  }

  loadThemeAssets(scene: Phaser.Scene): void {
    const theme = this.currentTheme;
    scene.load.image(
      this.getBackgroundKey(),
      `assets/themes/${theme}/background.png`
    );
    scene.load.image(
      this.getBallKey(),
      `assets/themes/${theme}/ball.png`
    );
  }
}
```

### 4. Update Preload Scene for Theme Loading

Modify `Preload.ts`:

- Import ThemeManager
- Get theme from server settings (add to Bootstrap data)
- Call `ThemeManager.getInstance().loadThemeAssets(this)` in preload
- Remove hardcoded background loading, use theme system

### 5. Update Server Settings for Theme

Add to `settings.json`:

```json
{
  "theme": "basketball",
  "availableThemes": ["basketball", "handball", "volleyball", "floorball", "corporate"]
}
```

### 6. Enhance Ball Class with Rotation and Trail

Modify `Ball.ts`:

- Add `rotation: number` property
- Add `trailPositions: {x: number, y: number, alpha: number}[]` array
- In `update()`:
  - Calculate rotation based on velocity: `this.rotation += speed * EFFECTS.BALL_ROTATION_SPEED`
  - Store trail positions (last 5 positions with decreasing alpha)
- Add `draw()` method using Graphics:
  - Draw trail circles with decreasing alpha
  - Draw main ball sprite with rotation applied
- Use theme ball texture instead of generated circle

```typescript
// Ball trail rendering
private drawTrail(graphics: Phaser.GameObjects.Graphics): void {
  for (let i = 0; i < this.trailPositions.length; i++) {
    const pos = this.trailPositions[i];
    const alpha = EFFECTS.BALL_TRAIL_ALPHA * (1 - i / this.trailPositions.length);
    graphics.fillStyle(0xffffff, alpha);
    graphics.fillCircle(pos.x, pos.y, BALL.RADIUS * 0.8);
  }
}
```

### 7. Create CollisionEffect Utility

Create `docker/app/client/src/utils/CollisionEffect.ts`:

```typescript
/**
 * CollisionEffect - Particle burst on ball-paddle collision
 */
export function createCollisionEffect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number
): void {
  const particles = scene.add.particles(x, y, 'particle', {
    speed: { min: 50, max: EFFECTS.COLLISION_PARTICLE_SPEED },
    scale: { start: 0.4, end: 0 },
    alpha: { start: 1, end: 0 },
    lifespan: 400,
    quantity: EFFECTS.COLLISION_PARTICLES,
    tint: color,
    blendMode: 'ADD',
  });

  // Auto-destroy after emission
  scene.time.delayedCall(500, () => particles.destroy());
}
```

- Create a small white circle texture for particles in Preload
- Call this function from Game.ts when ball hits paddle

### 8. Enhance Paddle Class with Glow Effect

Modify `Paddle.ts`:

- Add glow rendering using additional Graphics object
- Draw outer glow arc before main paddle:

```typescript
private drawGlow(): void {
  this.glowGraphics.clear();
  this.glowGraphics.lineStyle(
    EFFECTS.PADDLE_GLOW_RADIUS,
    this.color,
    EFFECTS.PADDLE_GLOW_INTENSITY
  );
  // Draw slightly larger arc for glow effect
  this.glowGraphics.beginPath();
  this.glowGraphics.arc(
    ARENA.CENTER_X,
    ARENA.CENTER_Y,
    PADDLE.OUTER_RADIUS + 5,
    startAngle,
    endAngle
  );
  this.glowGraphics.strokePath();
}
```

- Add blend mode ADD for glow effect
- Set glow depth below main paddle

### 9. Add Smooth Paddle Shrinking Animation

Modify difficulty scaling in `Paddle.ts`:

- Instead of instant `arcDegrees *= 0.95`, use tween:

```typescript
public shrinkPaddle(targetArc: number): void {
  this.scene.tweens.add({
    targets: this,
    arcDegrees: targetArc,
    duration: EFFECTS.PADDLE_SHRINK_DURATION,
    ease: 'Cubic.out',
    onUpdate: () => this.draw(),
  });
}
```

- Call from Game.ts difficulty timer instead of direct modification

### 10. Create FloatingText Utility

Create `docker/app/client/src/utils/FloatingText.ts`:

```typescript
/**
 * FloatingText - Score popup that rises and fades
 */
export function createFloatingText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color: string = '#ffffff'
): void {
  const floatText = scene.add.text(x, y, text, {
    fontFamily: 'MuseoSansBold',
    fontSize: '32px',
    color: color,
  }).setOrigin(0.5).setDepth(DEPTH.PARTICLES);

  scene.tweens.add({
    targets: floatText,
    y: y - EFFECTS.FLOATING_TEXT_RISE,
    alpha: 0,
    scale: 1.2,
    duration: EFFECTS.FLOATING_TEXT_DURATION,
    ease: 'Cubic.out',
    onComplete: () => floatText.destroy(),
  });
}
```

### 11. Add Score Popups on Paddle Hit

Modify `Game.ts` collision handling:

- When ball hits paddle, call:
  - `createCollisionEffect(this, hitX, hitY, paddleColor)`
  - `createFloatingText(this, hitX, hitY, `+${points}`, '#4ecdc4')`
- Show combo multiplier text for combos > 1: `x${combo}`

### 12. Add Combo Milestone Effects

In `Game.ts`, when combo reaches milestones (5, 10, 15, 20):

- Flash screen briefly (camera flash)
- Show large floating text: "COMBO x10!"
- Pulse the combo display text

```typescript
private onComboMilestone(combo: number): void {
  this.cameras.main.flash(100, 255, 255, 255, false, 0.3);
  createFloatingText(
    this,
    ARENA.CENTER_X,
    ARENA.CENTER_Y - 100,
    `COMBO x${combo}!`,
    '#ffe66d'
  );
}
```

### 13. Add Difficulty Progression Visual

In `Game.ts`:

- Add subtle visual indicator when paddles shrink
- Brief red pulse on arena border
- Optional: Show "DIFFICULTY UP" floating text

### 14. Enhance Lobby Join Animation

Modify `Lobby.ts` `joinPlayer()`:

- Add scale pop animation when player joins:

```typescript
this.tweens.add({
  targets: slot.graphics,
  scaleX: { from: 0.5, to: 1 },
  scaleY: { from: 0.5, to: 1 },
  duration: 300,
  ease: 'Back.out',
});
```

- Add particle burst at slot position using player color
- Brief glow pulse on slot

### 15. Add Lobby Slot Glow During Hold

In `Lobby.ts` `drawSlot()`:

- When `joinProgress > 0`, draw pulsing glow around slot
- Glow intensity increases with progress

### 16. Enhance Result Celebration

Modify `Result.ts`:

- Add confetti particle emitter with variety:
  - Multiple colors, sizes, rotation
  - Longer duration, more particles
- Add "NEW HIGH SCORE!" banner if score beats record
- Animate "Besser zusammen" text entrance:
  - Scale from 0 with bounce
  - Add subtle glow/shadow animation
- Score number reveal with dramatic scaling

```typescript
private createConfetti(): void {
  const colors = [0xffd700, 0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3, 0xaa96da];

  this.confettiEmitter = this.add.particles(CANVAS.WIDTH / 2, -50, 'confetti', {
    x: { min: -CANVAS.WIDTH / 2, max: CANVAS.WIDTH / 2 },
    speed: { min: 100, max: 300 },
    angle: { min: 80, max: 100 },
    rotate: { min: 0, max: 360 },
    scale: { start: 0.6, end: 0.2 },
    alpha: { start: 1, end: 0.6 },
    lifespan: 4000,
    gravityY: 200,
    tint: colors,
    quantity: 3,
    frequency: 50,
  });
}
```

### 17. Add High Score Detection

Modify `Result.ts`:

- Receive high score from server/registry
- Compare final score to high score
- If new record:
  - Show "NEW HIGH SCORE!" banner with animation
  - Extra celebration particles
  - Emit event for server to save

### 18. Create Placeholder Theme Assets

For initial development, create simple placeholder assets:

- `background.png`: Dark background with colored circular arena outline matching sport
- `ball.png`: 64x64 with sport-appropriate color/pattern

Use image editing or programmatic generation:
- Basketball: Orange circle with black lines
- Volleyball: White/yellow with panel lines
- Handball: Red/white pattern
- Floorball: White with holes pattern
- Corporate: Red/white Mobiliar colors

### 19. Update AnimatedBackdrop for Themes

Modify `AnimatedBackdrop.ts`:

- Use ThemeManager to get background texture key
- Support theme-specific particle colors

### 20. Validate Implementation

Test all visual features:

- [ ] Theme switching works (change settings.json, restart)
- [ ] Ball rotates based on movement direction
- [ ] Ball trail renders behind moving ball
- [ ] Collision particles appear at paddle hit point
- [ ] Score popup floats up and fades
- [ ] Combo milestones trigger screen flash
- [ ] Paddles have glow effect
- [ ] Paddle shrinking is animated smoothly
- [ ] Lobby join has pop animation
- [ ] Result celebration has confetti
- [ ] High score detection shows banner
- [ ] All effects maintain 60 FPS

---

## Testing Strategy

### Visual Testing
- Run game at each implementation step to verify effects
- Test with all 5 themes to ensure assets load correctly
- Verify animations run smoothly at 60 FPS

### Performance Testing
- Monitor FPS during heavy particle effects
- Test with max balls (5+) and all effects active
- Ensure no memory leaks from particle systems

### Theme Testing
- Verify each theme loads correctly:
  - Background displays properly
  - Ball texture renders with rotation
  - Colors/branding match theme intent

### E2E Test Sequence

Create test file at `docker/app/client/tests/e2e/visual-polish.yaml`:

```yaml
name: Visual Polish Verification
steps:
  - screenshot: lobby-initial
  - keys: [{ key: "ArrowLeft", duration: 3000, hold: true }, { key: "ArrowRight", duration: 3000, hold: true }]
  - wait: 500
  - screenshot: lobby-player-joined
  - keys: [{ key: "a", duration: 3000, hold: true }, { key: "d", duration: 3000, hold: true }]
  - wait: 500
  - keys: [{ key: "Enter" }]
  - wait: 4000
  - screenshot: game-playing
  - wait: 10000
  - screenshot: game-with-effects
  - eval: "game.scene.getScene('Game').score > 0"
```

---

## Acceptance Criteria

1. **Theme System**
   - [ ] 5 themes available (basketball, handball, volleyball, floorball, corporate)
   - [ ] Theme selection via settings.json works
   - [ ] Background and ball assets load per theme

2. **Ball Effects**
   - [ ] Ball rotates based on velocity
   - [ ] Motion trail visible behind moving ball
   - [ ] Collision particles appear on paddle hit

3. **Paddle Effects**
   - [ ] Glow effect visible around paddles
   - [ ] Shrinking animation is smooth (not instant)
   - [ ] Hit feedback (brief brighten) on collision

4. **UI Polish**
   - [ ] Score popups float up from hit location
   - [ ] Combo milestones (5, 10, 15, 20) trigger effects
   - [ ] Difficulty increase has visual feedback

5. **Lobby Polish**
   - [ ] Player join has pop/scale animation
   - [ ] Hold progress shows glow effect

6. **Result Polish**
   - [ ] Confetti celebration improved
   - [ ] High score detection and banner
   - [ ] "Besser zusammen" animated entrance

7. **Performance**
   - [ ] 60 FPS maintained with all effects active
   - [ ] No memory leaks from particle systems

---

## Validation Commands

```bash
# Build client to check for TypeScript errors
cd docker/app/client && npm run build

# Run development server to test visually
cd docker/app/client && npm run dev

# Check theme assets exist
ls -la docker/app/client/public/assets/themes/*/

# Verify no console errors during gameplay
# (Manual: open browser console, play full game loop)
```

---

## Notes

### Asset Creation
- Placeholder assets can be created programmatically or with basic image editing
- Final production assets should be provided by design team
- Ball textures should be 64x64 PNG with transparency
- Background images should be 1920x1080 with dark arena area

### Performance Considerations
- Limit trail positions to 5 to avoid performance impact
- Use object pooling for particles if needed
- Destroy particle emitters after use
- Consider reducing effects on lower-end hardware

### Dependencies
- No new npm packages required
- Uses existing Phaser 3 particle and tween systems

### Future Enhancements (Out of Scope)
- Sound effects (Phase 4+)
- Post-processing bloom shader
- Advanced motion blur
- 3D ball rendering
