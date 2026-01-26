# Tech Stack

**Last Updated**: [Update this]

## Overview

[Your Game Name] Kiosk uses a TypeScript-based full-stack architecture with Phaser.js for game rendering, Node.js/Express for the backend, and Socket.io for real-time communication between the physical button hardware and the game client. The system is containerized with Docker and deployed on balenaOS for remote management.

## Frontend

**Framework/Library**: Phaser.js 3.90.0
**Language**: TypeScript 5.9.2
**Build Tool**: Vite 7.0.6
**Key Libraries**:

- Socket.io-client 4.8.1: Real-time communication with game server
- Phaser3-rex-plugins 1.80.7: Extended Phaser functionality
- Terser 5.43.1: JavaScript minification for production builds

**Testing**:

- Vitest 3.2.4: Unit testing framework
- agent-browser 0.7.6: End-to-end testing for canvas-based Phaser games
- jsdom 26.1.0: DOM implementation for testing

## Backend

**Runtime**: Node.js
**Framework**: Express 4.21.2
**Language**: TypeScript 5.9.2
**Database**: SQLite 3 with better-sqlite3 12.4.1

**Key Libraries**:

- Socket.io 4.8.1: Real-time WebSocket communication
- better-sqlite3 12.4.1: Fast synchronous SQLite client with prepared statement caching
- Phidget22 3.22.5: Hardware button integration
- CORS 2.8.5: Cross-origin resource sharing
- dotenv 17.2.1: Environment variable management
- node-cleanup 2.1.2: Graceful shutdown handling

**Admin Interface**:

- HTML5 + Tailwind CSS (CDN): Simple, responsive admin panel
- Vanilla JavaScript: Fetch API for CRUD operations, no framework overhead
- Chart.js (simulation reports): Interactive prize distribution visualizations

**Development Tools**:

- tsx 4.20.3: TypeScript execution for Node.js
- nodemon 3.1.9: Development server with auto-reload

**Testing**:

- Vitest 3.2.4: Unit testing framework
- jsdom 26.1.0: DOM implementation for testing
- In-memory SQLite (`:memory:`): Fast, isolated database tests

## Infrastructure

**Deployment**: balenaOS (Linux-based OS for IoT devices)
**Containerization**: Docker with multi-container architecture
**Hardware**: Intel NUC platform (single device)
**Physical Interface**: Phidget hub with button sensor (port 5) - **single physical buzzer**
**Display**: Single HD horizontal screen (1920x1080)
**Receipt Printer**: Optional thermal printer for QR code tickets

**Network Architecture**:
- **Admin Interface**: Port 80 (accessible via balena public URL for remote management)
- **Game Client**: Port 3000 (local Chromium kiosk connects here)
- **Single User**: One visitor at a time (single buzzer, physically serialized input)
- **Container Communication**: Browser <-> Server via localhost Socket.io

**Key Services** (Docker Compose):

- nodeapp: Main game application (client + server)
- browser: Chromium in kiosk mode for display
- phidgets: Hardware button server (port 5661)
- scp-server: Remote file access for configuration updates

**Display Configuration**:

- Single 1920x1080 HD horizontal screen
- Full-screen Chromium browser in kiosk mode
- Direct HDMI output from Intel NUC

## Development Tools

**Testing**: Vitest (unit), agent-browser (E2E)
**Package Management**: npm
**Version Control**: Git
**Linting**: ESLint 9.x with import plugin
**Build Scripts**: Custom bash scripts in `scripts/bundle.sh`

**Development Servers**:

- Client: Vite dev server (port 8080) with hot module replacement
- Server: tsx watch (port 3000) with auto-reload

## Architecture Patterns

**Multi-Container Architecture**: Separate containers for application, browser display, hardware integration, and remote access, orchestrated via Docker Compose.

**Event-Driven Communication**: Socket.io events connect physical button presses to game state changes with client-driven logic:

- `BuzzerPress`: Server -> All Clients (physical button pressed, clients decide action)
- `SimulateBuzzerPress`: Stress Test -> Server (simulates button press, relayed as BuzzerPress)
- `RequestPrize`: Client -> Server (request new prize outcome)
- `PrizeAwarded`: Server -> All Clients (prize outcome determined by server)
- `AnimationComplete`: Client -> Server (animation finished, used for stress test coordination)
- `GamePaused` / `GameResumed`: Server -> All Clients (game state changes)
- `PreloadFinished`: Client -> Server (asset loading complete)

**Client-Driven Architecture**: Clients control game flow (when to request prizes vs. hide them), server only determines prize outcomes. This prevents duplicate database entries and simplifies state management. See `specs/architecture/event-driven-prize-flow.md` for details.

**Scene-Based Game Architecture**: Phaser.js scenes organized as Bootstrap -> Preload -> Idle -> Game -> Result, with a GamePlugin for Socket.io integration.

**Single Screen Display**: 1920x1080 Phaser canvas renders directly to single HD horizontal screen via Chromium kiosk mode.

**Configuration-Driven**: JSON-based settings file (`content/settings.json`) for easy customization without code changes.

**Hot Reload Development**: Separate development servers for client and server with automatic reloading on file changes.

**Remote Management**: balenaOS enables over-the-air updates and remote SSH access for production deployments.

## Technical Decisions

No user-specified tech stack choices were provided during initial planning. The existing stack is production-tested and well-suited for kiosk deployments with hardware integration requirements.
