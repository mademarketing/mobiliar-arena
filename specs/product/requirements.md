# Product Requirements

**Date**: January 2026

## Overview

**Mobiliar Arena** is a cooperative multiplayer circular Pong game for Mobiliar's 200th anniversary "Besser zusammen" campaign. 2-6 players stand around a circular LED table, each controlling a paddle with arcade buttons, working together to keep balls in play and achieve a high score.

The game displays on a 1920x1080 HD canvas that an LED controller maps onto a circular screen.

---

## Functional Requirements

### Game Mechanics

**Core Concept**: Cooperative circular Pong where all players work together to keep balls bouncing.

**Playing Field**:
- Circular arena rendered on 1920x1080 canvas (center at 960x540)
- Paddles positioned around the circumference
- Balls spawn from the center with random direction and speed
- Balls bounce off paddles and walls (the outer ring acts as boundary)

**Ball Behavior**:
- Spawn from center every 5 seconds
- Initial direction: random angle
- Initial speed: configurable, moderate pace
- Bounce physics: reflect off paddles realistically
- When a ball passes a paddle's zone without being deflected, it disappears

**Paddle Behavior**:
- Each player controls one paddle
- Paddles slide left/right along their arc segment
- Movement controlled by two arcade buttons per player
- Paddle size adjusts based on player count (fewer players = larger paddles)
- Paddle width reduces over time to increase difficulty

**Controls**:
- Left button: Move paddle counter-clockwise
- Right button: Move paddle clockwise
- Each player has dedicated button pair connected via Phidgets

### Player Count

- **Minimum**: 2 players
- **Maximum**: 6 players (configurable)
- **Paddle distribution**: Paddles evenly spaced around circle based on player count
  - 2 players: 180° apart (opposite sides)
  - 3 players: 120° apart
  - 4 players: 90° apart
  - 5 players: 72° apart
  - 6 players: 60° apart

### Scoring System

**Score Calculation**:
- Base points: (balls currently in play) × (time elapsed in seconds)
- Combo bonus: Multiplier for consecutive successful deflections
- Final score calculated at game end

**Display**:
- Central score counter visible throughout gameplay
- Combo multiplier indicator
- Timer countdown (60 seconds)

### Game Flow

**1. Lobby Scene** (waiting for players):
- Shows circular arena with player positions marked
- "Hold both buttons for 3 seconds to join" instruction
- Players light up as they join
- Minimum 2 players required to start
- Auto-start when minimum players joined and confirmed ready
- Visual countdown before game begins

**2. Game Scene** (active gameplay):
- 60-second countdown timer
- Balls spawn every 5 seconds from center
- Players deflect balls with their paddles
- Score accumulates in real-time
- Difficulty increases: paddle width shrinks over time
- Game ends when timer reaches zero

**3. Result Scene** (game over):
- Final score display
- "Besser zusammen" campaign message
- Highscore comparison (beat the best team?)
- Auto-return to Lobby after 10 seconds

### Difficulty Progression

**Over 60-second game**:
- Paddle width: Starts at 100%, shrinks to ~60% by game end
- Ball spawn rate: Constant at 5 seconds (12 balls total)
- Optional: Ball speed increase over time

### Theming System

**Sport Themes**:
- Basketball: Court floor background, basketball ball sprites
- Handball: Field background, handball ball sprites
- Volleyball: Court background, volleyball ball sprites
- Floorball: Rink background, floorball ball sprites

**Corporate Theme**:
- Mobiliar branding: White and red color scheme
- Corporate background with subtle branding
- Neutral ball design

**Theme Structure**:
- `assets/themes/{theme-name}/background.png` - Arena background
- `assets/themes/{theme-name}/ball.png` - Ball sprite (consistent size across themes)
- Theme selection via admin panel or configuration

### Hardware Integration

**Display**:
- Output: 1920x1080 HD (16:9)
- The circular game renders centered on this canvas
- External LED controller handles mapping to physical circular screen

**Input - Phidgets Digital Inputs**:
- 2 buttons per player (left/right)
- Up to 12 digital inputs for 6 players
- Phidget hub connection via USB
- Button mapping configurable in settings

**Player Stations**:
- Each station has left button + right button
- Physical layout matches on-screen paddle positions
- Buttons are standard arcade pushbuttons

### Keyboard Controls (Development/Testing)

- `Space`: Simulate ball spawn
- `1-6`: Toggle player join/leave
- Arrow keys: Control Player 1 paddle (for single developer testing)
- `W/S`: Control Player 2 paddle
- `R`: Reset game to lobby

### Admin Interface

- Theme selection
- Player count limits (min/max)
- Game duration setting
- Ball spawn rate
- Difficulty curve settings
- Highscore reset
- Game pause/resume

---

## Non-Functional Requirements

### Performance

- Target FPS: 60
- Ball physics calculations: Smooth at 60Hz
- Input latency: < 50ms from button press to paddle movement
- Support for 20+ simultaneous balls without frame drops

### Reliability

- Uptime: 99% during event operating hours
- Graceful handling of disconnected Phidget inputs
- Auto-recovery from errors
- Game continues if one player's buttons fail

### Display

- Resolution: 1920x1080 (game renders circular arena centered)
- The LED controller handles physical circular mapping
- Visual design optimized for circular viewing (no important info in corners)

### Accessibility

- High contrast paddle colors (distinct per player)
- Large, readable score display
- Simple two-button controls
- No color-only information (shapes/positions also convey meaning)

---

## Future Considerations (Out of Scope for MVP)

- Single-player mode with AI co-players
- Power-ups (paddle size boost, slow motion, etc.)
- Tournament mode with brackets
- Network multiplayer (multiple tables competing)
- Player statistics tracking
