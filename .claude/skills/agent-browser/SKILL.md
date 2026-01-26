---
name: agent-browser
description: Browser automation CLI for testing Phaser/Canvas games and web pages. Use for taking screenshots, recording videos, sending key presses, clicking at coordinates, and checking game state. Triggers on "test game", "take screenshot", "record demo", "test in browser".
---

# agent-browser: Browser Automation CLI

Headless browser automation designed for AI agents. For Canvas/Phaser games, use screenshots + coordinates instead of DOM refs.

**Related:** For executing YAML test sequences with reports, use the `test-phaser` subagent which builds on these commands.

> **IMPORTANT:** Always close browser sessions when done to prevent orphaned processes. Use `agent-browser close` or `agent-browser --session <name> close`.

## Setup

```bash
command -v agent-browser >/dev/null 2>&1 && echo "Installed" || echo "Run: npm install -g agent-browser && agent-browser install"
```

## Phaser/Canvas Game Testing

Canvas renders pixels, not DOM elements. Use these commands:

```bash
# Open and screenshot
agent-browser open http://localhost:8080
agent-browser wait 2000
agent-browser screenshot game-state.png

# Keyboard input
agent-browser press Enter
agent-browser press ArrowUp
agent-browser press Space

# Mouse at coordinates (not refs)
agent-browser mouse move 400 300
agent-browser mouse down
agent-browser mouse up

# Query game state via JavaScript
agent-browser eval "window.game?.scene?.key"
agent-browser eval "window.game?.registry?.get('score')"

# Debug
agent-browser console          # View logs
agent-browser errors           # View JS errors
agent-browser --headed open http://localhost:8080  # Visible browser
```

**What doesn't work for Canvas:**
- `snapshot` returns `(no interactive elements)`
- `click @ref` - no refs available
- `find role/text` - semantic locators don't see Canvas

## DOM-Based Testing (Non-Canvas)

For regular web pages with DOM elements:

```bash
# Get interactive elements with refs
agent-browser snapshot -i

# Interact using refs
agent-browser click @e1
agent-browser fill @e2 "text"
agent-browser select @e3 "option"
```

## Quick Reference

| Command | Usage |
|---------|-------|
| `open <url>` | Navigate to URL |
| `screenshot [path]` | Capture viewport |
| `screenshot --full [path]` | Full page capture |
| `press <key>` | Key press (Enter, Space, ArrowUp, etc.) |
| `mouse move <x> <y>` | Position cursor |
| `mouse down` / `mouse up` | Click at current position |
| `wait <ms>` | Wait milliseconds |
| `wait <selector>` | Wait for element |
| `eval <js>` | Execute JavaScript |
| `console` | View console logs |
| `errors` | View page errors |
| `snapshot -i` | Interactive elements (DOM only) |
| `click @e1` | Click by ref (DOM only) |
| `--headed` | Show browser window |
| `--session <name>` | Isolated browser session |
| `record start <path>` | Start video recording to .webm file |
| `record stop` | Stop recording and save |
| `close` | **REQUIRED** - Close browser when done |

## Sessions

```bash
agent-browser --session game1 open http://localhost:8080
agent-browser --session game2 open http://localhost:8080
agent-browser session list
```

## Recording

Capture video recordings of browser sessions for demos or debugging:

```bash
# Start recording to a .webm file
agent-browser record start ./demo.webm

# Perform actions...
agent-browser press Enter
agent-browser wait 2000

# Stop and save recording
agent-browser record stop
```

**Notes:**
- Recording must be started after `open`
- Always call `record stop` before `close` to save the file
- Output format is WebM (VP8/VP9 video)

## Example: Test Phaser Game Flow

```bash
agent-browser open http://localhost:8080
agent-browser wait 2000
agent-browser screenshot 01-start.png

# Start game
agent-browser press Enter
agent-browser wait 1000
agent-browser screenshot 02-playing.png

# Game input
agent-browser press ArrowUp
agent-browser press Space
agent-browser wait 500
agent-browser screenshot 03-action.png

# Check result
agent-browser eval "window.game?.registry?.get('gameOver')"
agent-browser screenshot 04-result.png

# ALWAYS close when done
agent-browser close
```

## Example: Record Demo Video

```bash
agent-browser open http://localhost:8080
agent-browser wait 1000
agent-browser record start ./game-demo.webm

# Perform game flow
agent-browser press Enter
agent-browser wait 2000
agent-browser press Space
agent-browser wait 3000

# Stop recording before closing
agent-browser record stop
agent-browser close
```

## Cleanup

**Always close browser sessions to prevent orphaned processes:**

```bash
# Close default session
agent-browser close

# Close named session
agent-browser --session my-test close

# List active sessions
agent-browser session list

# Close all sessions (use after test runs)
for session in $(agent-browser session list 2>/dev/null); do
  agent-browser --session "$session" close 2>/dev/null || true
done
```
