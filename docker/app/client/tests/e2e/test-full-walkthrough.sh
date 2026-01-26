#!/bin/bash
# Complex test: Full game walkthrough
# This bash script handles scenarios too complex for YAML

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCREENSHOTS_DIR="$SCRIPT_DIR/screenshots"
SESSION="${AGENT_BROWSER_SESSION:-walkthrough}"

ab() {
    agent-browser --session "$SESSION" "$@"
}

echo "=== Full Game Walkthrough Test ==="
echo "Session: $SESSION"

# Step 1: Load game
echo "[1/6] Loading game..."
ab open http://localhost:8080
ab wait 2000
ab screenshot "$SCREENSHOTS_DIR/walkthrough-01-loaded.png"

# Step 2: Start game
echo "[2/6] Starting game..."
ab press Enter
ab wait 1500
ab screenshot "$SCREENSHOTS_DIR/walkthrough-02-started.png"

# Step 3: Game interactions (customize based on your game)
echo "[3/6] Game interactions..."
# Example: Press space multiple times, take screenshots
for i in {1..3}; do
    ab press Space
    ab wait 500
done
ab screenshot "$SCREENSHOTS_DIR/walkthrough-03-playing.png"

# Step 4: Check game state via eval
echo "[4/6] Checking game state..."
CANVAS_EXISTS=$(ab eval "document.querySelector('canvas') !== null" 2>/dev/null || echo "false")
echo "    Canvas exists: $CANVAS_EXISTS"

# Step 5: Capture any console output
echo "[5/6] Capturing console..."
ab console > "$SCREENSHOTS_DIR/walkthrough-console.log" 2>/dev/null || true

# Step 6: Final screenshot
echo "[6/6] Final state..."
ab screenshot "$SCREENSHOTS_DIR/walkthrough-04-final.png"

echo ""
echo "=== Walkthrough Complete ==="
echo "Screenshots saved to: $SCREENSHOTS_DIR/walkthrough-*.png"
echo "Console log: $SCREENSHOTS_DIR/walkthrough-console.log"

# Optional: Close browser
# ab close

exit 0
