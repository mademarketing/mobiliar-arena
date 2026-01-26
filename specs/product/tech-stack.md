# Tech Stack

**Last Updated**: January 2026

## Overview

Mobiliar Arena uses a TypeScript-based full-stack architecture with Phaser.js for game rendering, Node.js/Express for the backend, and Socket.io for real-time communication between the Phidgets arcade button hardware and the game client. The system is containerized with Docker.

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
- better-sqlite3 12.4.1: Fast synchronous SQLite client
- Phidget22 3.22.5: Arcade button hardware integration
- CORS 2.8.5: Cross-origin resource sharing
- dotenv 17.2.1: Environment variable management
- node-cleanup 2.1.2: Graceful shutdown handling

**Admin Interface**:

- HTML5 + Tailwind CSS (CDN): Simple, responsive admin panel
- Vanilla JavaScript: No framework overhead

**Development Tools**:

- tsx 4.20.3: TypeScript execution for Node.js
- nodemon 3.1.9: Development server with auto-reload

**Testing**:

- Vitest 3.2.4: Unit testing framework
- jsdom 26.1.0: DOM implementation for testing

## Infrastructure

**Deployment**: Docker containers (balenaOS optional for remote management)
**Containerization**: Docker with multi-container architecture
**Hardware**: PC with USB Phidget hub connection

**Physical Interface - Phidgets Digital Inputs**:
- Phidget InterfaceKit or Digital Input board
- 2 buttons per player × 6 players = up to 12 digital inputs
- Standard arcade pushbuttons connected to Phidget hub
- Button layout: Left/Right pair per player station

**Display**:
- Output: 1920x1080 HD (HDMI)
- External LED controller maps rectangular output to circular LED screen
- Phaser canvas renders circular arena centered on rectangular canvas

**Network Architecture**:
- **Admin Interface**: Port 80 (web browser access)
- **Game Client**: Port 3000 (local Chromium kiosk)
- **Multiplayer**: Multiple players on single screen (local co-op, not networked)
- **Container Communication**: Browser <-> Server via localhost Socket.io

**Key Services** (Docker Compose):

- nodeapp: Main game application (client + server)
- browser: Chromium in kiosk mode for display
- phidgets: Hardware button server (port 5661)

**Display Configuration**:

- 1920x1080 HD rectangular canvas
- Circular arena rendered centered (important content within circular bounds)
- LED controller performs rectangular-to-circular mapping externally

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

**Multiplayer Local Co-op**: All players on single screen, each with dedicated Phidget button inputs. No network multiplayer in MVP.

**Event-Driven Communication**: Socket.io events connect physical button presses to paddle movements:

- `PlayerInput`: Server -> Client (button press/release for specific player)
- `PlayerJoin`: Client -> Server (player joined via button hold)
- `PlayerLeave`: Client -> Server (player left game)
- `GameState`: Server -> Client (sync game state if needed)
- `GameStart`: Server -> Client (countdown complete, begin gameplay)
- `GameEnd`: Server -> Client (timer finished)

**Scene-Based Game Architecture**: Phaser.js scenes organized as:
```
Bootstrap -> Preload -> Lobby -> Game -> Result -> Lobby (loop)
```

**Circular Coordinate System**: Custom math utilities for:
- Paddle positioning around circumference
- Ball-paddle collision detection on curved surfaces
- Angle-based movement calculations

**Theme System**: Configuration-driven asset loading:
- Themes stored in `assets/themes/{theme-name}/`
- Each theme provides: `background.png`, `ball.png`
- Active theme selected via settings or admin panel

**Configuration-Driven**: JSON-based settings file for:
- Player count limits
- Game duration
- Ball spawn rate
- Difficulty curve
- Theme selection
- Button mapping

## Technical Decisions

**Why Phidgets Digital Inputs**: Reliable industrial-grade hardware designed for arcade/kiosk applications. The Phidget22 library provides stable Node.js bindings. Up to 16 digital inputs per hub supports 6-player configuration.

**Why Single-Screen Multiplayer**: Circular table design means all players can see the same screen from different angles. This simplifies architecture (no network sync) while maintaining the cooperative experience.

**Why Rectangular-to-Circular External**: LED controller handles the pixel mapping, allowing standard 1920x1080 game development workflow. The game just needs to keep important content within the circular bounds.
