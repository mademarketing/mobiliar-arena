# Product Requirements

**Date**: [Update this]

## Overview

[Your Game Name] is an interactive kiosk game designed to engage visitors at events. The kiosk features a physical buzzer button that triggers an exciting prize reveal animation on a single HD horizontal display, creating an arcade-style experience.

The system distributes prizes using a two-tier algorithm: inventory prizes distributed adaptively throughout the event, and consolation experiences for all other plays. This ensures fair prize distribution while maintaining excitement throughout each event day.

---

## Functional Requirements

### Game Mechanics

- Single physical buzzer button triggers gameplay
- Press buzzer to start game sequence
- Space bar available as backup input for testing/development

**Game Flow:**
1. **Idle state**: Waiting for player, shows logo and "Press buzzer!" instruction
2. **Buzzer press**: Requests prize outcome from server before starting game
3. **Game scene**: [Your game mechanic here - wheel spin, scratch card, etc.]
4. **Result Scene**: Win celebration or lose consolation (auto-dismisses after 6s, Space to skip)
5. Returns automatically to Idle state

### Prize System

- **Tier 1 - Inventory**: Prize types with daily quantities and adaptive distribution
- **Tier 2 - Consolation**: Default experience when no prizes available (lose scene)

**Prize Types** (configure in `content/prizes.json`):
- Prize A
- Prize B
- (Add your prizes)

**QR Code System**:
- QR codes are pre-loaded into database before each event
- Separate code lists per prize type
- When a prize is won, next available code is assigned and marked as used
- Optional receipt printing with QR code

### Hardware Integration

- Phidget hub with physical buzzer button
- Single HD horizontal display (1920x1080)
- Optional: Receipt printer for QR code tickets
- Intel NUC or similar running Docker containers

### Admin Interface

- Prize inventory configuration
- Real-time statistics and monitoring
- Game pause/resume controls
- QR code management

## Non-Functional Requirements

### Performance

- Target FPS: 60
- Load time: < 3 seconds
- Responsive to buzzer input: < 100ms

### Reliability

- Uptime: 99% during event operating hours
- Auto-recovery from errors
- Graceful degradation if components fail

### Display

- Resolution: 1920x1080
- Aspect ratio: 16:9 (horizontal orientation)
- Single HD screen output
