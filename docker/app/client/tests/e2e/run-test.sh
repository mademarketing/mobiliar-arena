#!/bin/bash
# YAML test runner for agent-browser
# Usage: ./run-test.sh <test.yaml> [--session <name>]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCREENSHOTS_DIR="$SCRIPT_DIR/screenshots"
TEST_FILE="$1"
SESSION_NAME="${3:-default}"

if [ -z "$TEST_FILE" ]; then
    echo "Usage: $0 <test.yaml> [--session <name>]"
    exit 1
fi

if [ ! -f "$TEST_FILE" ]; then
    echo "Test file not found: $TEST_FILE"
    exit 1
fi

# Parse session argument
if [ "$2" = "--session" ] && [ -n "$3" ]; then
    SESSION_ARG="--session $3"
else
    SESSION_ARG=""
fi

echo "Running test: $TEST_FILE"
echo "Session: ${SESSION_NAME}"
echo "Screenshots: $SCREENSHOTS_DIR"
echo "---"

# Simple YAML parser using grep/sed
TEST_NAME=$(grep "^name:" "$TEST_FILE" | sed 's/name: *//')
echo "Test: $TEST_NAME"

# Track test result
PASSED=true
STEP_NUM=0

# Process each step
while IFS= read -r line; do
    # Skip comments and empty lines
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line// }" ]] && continue

    # Parse step (format: "  - action: value")
    if [[ "$line" =~ ^[[:space:]]*-[[:space:]]*([a-z_]+):[[:space:]]*(.*) ]]; then
        ACTION="${BASH_REMATCH[1]}"
        VALUE="${BASH_REMATCH[2]}"
        # Remove surrounding quotes if present
        VALUE="${VALUE#\"}"
        VALUE="${VALUE%\"}"
        VALUE="${VALUE#\'}"
        VALUE="${VALUE%\'}"
        ((STEP_NUM++))

        case "$ACTION" in
            open)
                echo "[$STEP_NUM] Opening: $VALUE"
                agent-browser $SESSION_ARG open "$VALUE"
                ;;
            wait)
                echo "[$STEP_NUM] Waiting: ${VALUE}ms"
                agent-browser $SESSION_ARG wait "$VALUE"
                ;;
            screenshot)
                SCREENSHOT_PATH="$SCREENSHOTS_DIR/$VALUE"
                echo "[$STEP_NUM] Screenshot: $SCREENSHOT_PATH"
                agent-browser $SESSION_ARG screenshot "$SCREENSHOT_PATH"
                ;;
            press)
                echo "[$STEP_NUM] Pressing: $VALUE"
                agent-browser $SESSION_ARG press "$VALUE"
                ;;
            eval)
                echo "[$STEP_NUM] Eval: $VALUE"
                # Use single quotes to preserve double quotes in JS
                RESULT=$(agent-browser $SESSION_ARG eval "$VALUE" 2>&1 || echo "ERROR")
                echo "    Result: $RESULT"
                ;;
            expect)
                echo "[$STEP_NUM] Expecting: $VALUE"
                if [ "$RESULT" != "$VALUE" ]; then
                    echo "    FAILED: Expected '$VALUE', got '$RESULT'"
                    PASSED=false
                else
                    echo "    PASSED"
                fi
                ;;
            mouse_move)
                echo "[$STEP_NUM] Mouse move: $VALUE"
                agent-browser $SESSION_ARG mouse move $VALUE
                ;;
            mouse_click)
                echo "[$STEP_NUM] Mouse click"
                agent-browser $SESSION_ARG mouse down
                agent-browser $SESSION_ARG mouse up
                ;;
            console)
                echo "[$STEP_NUM] Console output:"
                agent-browser $SESSION_ARG console
                ;;
            close)
                echo "[$STEP_NUM] Closing browser"
                agent-browser $SESSION_ARG close
                ;;
            *)
                echo "[$STEP_NUM] Unknown action: $ACTION"
                ;;
        esac
    fi
done < "$TEST_FILE"

# Always close the browser at the end
echo "---"
echo "Closing browser session..."
agent-browser $SESSION_ARG close 2>/dev/null || true

echo "---"
if [ "$PASSED" = true ]; then
    echo "RESULT: PASSED"
    exit 0
else
    echo "RESULT: FAILED"
    exit 1
fi
