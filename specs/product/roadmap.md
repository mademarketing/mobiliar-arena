# Product Development Roadmap

**Last Updated**: January 2026

## Roadmap Overview

Development is organized into four phases. Phase 1 delivers a playable multiplayer Pong with basic visuals, followed by phases adding visual polish, theming, and production readiness.

---

## Phase 1: Core Gameplay MVP

**Goal**: Functional multiplayer circular Pong with basic graphics and keyboard controls

**Status**: [ ] Not Started

### Features

- [ ] **Circular arena**: Render playing field centered on 1920x1080 canvas
- [ ] **Ball physics**: Balls spawn from center, bounce off paddles, disappear when missed
- [ ] **Paddle system**: Paddles positioned around circumference, move along arc
- [ ] **Player scaling**: Paddle size/position adjusts for 2-6 players
- [ ] **Lobby scene**: Player join flow (keyboard shortcuts for testing)
- [ ] **Game scene**: 60-second timer, ball spawning every 5 seconds
- [ ] **Result scene**: Final score display, return to lobby
- [ ] **Scoring**: Central score counter, basic combo tracking
- [ ] **Keyboard controls**: Arrow keys for P1, W/S for P2, number keys to join

### Success Criteria

- [ ] Complete game loop: Lobby → Game → Result → Lobby
- [ ] 2-6 players can join and play simultaneously
- [ ] Ball physics feel responsive and fair
- [ ] Score accumulates correctly

### Technical Focus

- Circular coordinate system for paddle positioning
- Ball-paddle collision detection on curved surfaces
- Dynamic player count handling

---

## Phase 2: Hardware Integration

**Goal**: Phidgets arcade button input working with physical controls

**Status**: [ ] Not Started

### Features

- [ ] **Phidgets integration**: Connect to digital input hub
- [ ] **Button mapping**: Configure which inputs map to which player/direction
- [ ] **Join gesture**: Hold both buttons for 3 seconds to join
- [ ] **Input feedback**: Visual confirmation when buttons pressed
- [ ] **Graceful degradation**: Handle disconnected/missing inputs
- [ ] **Admin configuration**: Button mapping in admin panel

### Success Criteria

- [ ] Physical arcade buttons control paddles
- [ ] Players can join using button hold gesture
- [ ] System handles button disconnection gracefully
- [ ] Latency under 50ms

### Technical Focus

- Phidget22 library integration
- Input debouncing
- Connection monitoring and reconnection

---

## Phase 3: Visual Polish & Theming

**Goal**: Production-quality visuals with sport/corporate themes

**Status**: [ ] Not Started

### Features

- [ ] **Theme system**: Load background and ball assets per theme
- [ ] **Sport themes**: Basketball, handball, volleyball, floorball
- [ ] **Corporate theme**: Mobiliar white/red branding
- [ ] **Paddle visuals**: Distinct colors per player, neon/glow effect
- [ ] **Ball animations**: Rotation, trail effects
- [ ] **UI polish**: Score display, timer, combo indicator
- [ ] **Lobby animations**: Player join effects, countdown
- [ ] **Result celebration**: Score reveal, "Besser zusammen" message
- [ ] **Difficulty visual**: Paddle shrinking animation

### Success Criteria

- [ ] Themes can be switched via configuration
- [ ] Visuals run at 60 FPS
- [ ] Consistent visual style across scenes
- [ ] "Besser zusammen" branding prominent in result

### Technical Focus

- Asset loading per theme
- Particle effects
- Smooth animations with Phaser tweens

---

## Phase 4: Event Operations

**Goal**: Ready for event deployment with admin tools

**Status**: [ ] Not Started

### Features

- [ ] **Admin panel**: Theme selection, game settings, highscore management
- [ ] **Highscore system**: Persist best scores, display in lobby
- [ ] **Operating hours**: Auto-enable/disable based on schedule
- [ ] **Statistics**: Track plays, average scores, player counts
- [ ] **Remote monitoring**: Status endpoint for health checks
- [ ] **Kiosk mode**: Auto-start, crash recovery, full-screen

### Success Criteria

- [ ] Non-technical staff can configure and operate
- [ ] Highscores persist across restarts
- [ ] System runs unattended during events
- [ ] Easy theme switching for different events

### Technical Focus

- SQLite database for scores/stats
- Docker container orchestration
- Crash recovery mechanisms

---

## Phase 5+: Future Enhancements

**Goal**: Advanced features for future iterations

### Potential Features

- **Single-player mode**: AI-controlled co-players for solo practice
- **Power-ups**: Paddle boost, slow motion, multi-ball
- **Sound design**: Music, sound effects, crowd reactions
- **Tournament mode**: Multiple rounds, elimination brackets
- **Network play**: Multiple tables competing remotely
- **Analytics dashboard**: Detailed event statistics and reporting
- **Photo integration**: Take team photo after high score

---

## Notes

- Phase 1 focuses on core gameplay feel - this is the foundation
- Hardware integration (Phase 2) can be developed in parallel with visual polish
- Theme assets need to be created/sourced for Phase 3
- Event deployment date will determine timeline compression
- The existing kiosk template provides server infrastructure, admin panel basics, and Docker setup
