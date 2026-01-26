# Architecture Documentation

Technical architecture and implementation patterns for the Mobiliar Arena multiplayer Pong game.

## Contents

### [coding-standards.md](coding-standards.md)
**Required reading for all developers**

Coding conventions and best practices:
- Use enums instead of hardcoded strings
- Type safety guidelines
- Code review checklist
- Migration guide for fixing violations

### [scene-flow.md](scene-flow.md)
Scene architecture and lifecycle:
- Multi-scene architecture overview (Lobby → Countdown → Game → Result)
- Scene transition flow
- Circular arena rendering
- Player positioning calculations
- Ball physics overview

### [circular-physics.md](circular-physics.md) *(planned)*
Circular coordinate system and physics:
- Paddle positioning on circumference
- Ball-paddle collision detection
- Angle-based movement calculations
- Player count scaling

### [input-system.md](input-system.md) *(planned)*
Phidgets button input handling:
- Digital input mapping
- Player join gesture detection
- Button debouncing
- Connection monitoring

---

## Quick Links

**New to the codebase?** Start here:
1. Read [coding-standards.md](coding-standards.md) - Learn required patterns
2. Read [scene-flow.md](scene-flow.md) - Understand multi-scene architecture

**Making changes?** Check:
- [coding-standards.md](coding-standards.md#code-review-checklist) - Code review checklist
- [scene-flow.md](scene-flow.md#adding-new-features) - Where to add features

## Key Concepts

### Circular Arena
The game renders on a 1920x1080 canvas but all gameplay happens within a circular arena centered on the canvas. The external LED controller maps this to the physical circular screen.

### Cooperative Multiplayer
2-6 players work together. There's no competition between players - the goal is team score maximization.

### Dynamic Player Scaling
Paddle size and position adjust automatically based on how many players join.
