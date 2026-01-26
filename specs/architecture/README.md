# Architecture Documentation

Technical architecture and implementation patterns for the Win for Life Roadshow Kiosk.

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
- Multi-scene architecture overview (Idle → IconGrid → Wheel → Result)
- Scene transition flow
- Scene registration patterns
- Display configuration (single 1920x1080 HD screen)

### [event-driven-prize-flow.md](event-driven-prize-flow.md)
**Event-driven architecture for prize distribution**
- Client-driven game logic (when to request prizes)
- Server-side prize determination only
- Event flow diagrams (BuzzerPress, RequestPrize, PrizeAwarded)
- Multi-scene event handling
- Design decisions and rationale

### [prize-distribution-simple.md](prize-distribution-simple.md)
Prize distribution algorithm:
- Time-based adaptive distribution
- Multiple prize types (Win for Life, Super Win for Life)
- Configuration and tuning
- Simulation and testing
- Implementation details

### [operating-hours.md](operating-hours.md)
Operating hours and timezone handling:
- Swiss timezone (Europe/Zurich) implementation
- Prize distribution during/outside operating hours
- Edge cases (prizes scheduled outside hours)
- Timezone-safe development and testing

---

## Quick Links

**New to the codebase?** Start here:
1. Read [coding-standards.md](coding-standards.md) - Learn required patterns
2. Read [scene-flow.md](scene-flow.md) - Understand multi-scene architecture
3. Read [prize-distribution-simple.md](prize-distribution-simple.md) - Understand prize logic

**Making changes?** Check:
- [coding-standards.md](coding-standards.md#code-review-checklist) - Code review checklist
- [scene-flow.md](scene-flow.md#adding-new-features) - Where to add features
