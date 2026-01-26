---
description: Test the Phaser kiosk game using Playwright screenshots, video recording, and backend test endpoints
argument-hint: [path-to-plan or test description]
---

# Test Game

Run E2E tests for the Phaser game and **ALWAYS** generate a test report. This command guarantees a report exists for workflow completion.

## Variables

PATH_OR_PROMPT: $ARGUMENTS
GAME_URL: http://localhost:8000
BACKEND_URL: http://localhost:3000
REPORT_BASE_DIR: docker/app/client/tests/e2e/reports
E2E_TEST_DIR: docker/app/client/tests/e2e

## Instructions

- **CRITICAL**: This command MUST always create a test report at `REPORT_BASE_DIR/{timestamp}/report.md`
- Determine test mode: YAML-based (from plan) or prompt-based (ad-hoc)
- If no tests are needed, create a SKIPPED report
- Report must always exist for Ralph Loop completion detection

## Workflow

### 1. Setup Report Directory

```bash
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
REPORT_DIR="docker/app/client/tests/e2e/reports/$TIMESTAMP"
mkdir -p "$REPORT_DIR"
```

### 2. Determine Test Mode

Check PATH_OR_PROMPT to determine what kind of test to run:

**Mode A: Plan-Based Testing**
- If PATH_OR_PROMPT is a path to a plan file (e.g., `specs/feat-*.md`)
- Read the plan and look for "E2E Test Sequence" or "E2E Test" section
- Check for existing YAML files in `docker/app/client/tests/e2e/*.yaml`

**Mode B: Prompt-Based Testing**
- If PATH_OR_PROMPT is a test description (e.g., "test wheel spin")
- Design and execute test based on the description

**Mode C: No Input**
- Search `specs/` for most recent plan file
- Check for E2E test section or existing YAML files
- If nothing found, create SKIPPED report

### 3. Execute Tests (Conditional)

#### IF E2E test YAML exists:

Use the Task tool to spawn the `test-phaser` agent:
```
Execute test sequence: docker/app/client/tests/e2e/{test-file}.yaml
```

The test-phaser agent generates its own report. Copy/link it to REPORT_DIR if needed.

#### IF prompt-based test requested:

Execute using Playwright:

1. Verify game is running: `curl -s $BACKEND_URL`
2. Navigate to GAME_URL
3. Design test steps based on prompt
4. Execute interactions (keyboard, clicks, test endpoints)
5. Take screenshots at each step
6. Query game state via `window.game`
7. Generate report

#### IF no tests needed:

Create a SKIPPED report:

```markdown
# Phaser Test Report

**Test:** No E2E Tests Required
**Date:** {timestamp}
**Status:** SKIPPED
**Report Path:** docker/app/client/tests/e2e/reports/{timestamp}/report.md

## Summary

No E2E test sequence was defined for this feature. The implementation was validated through:
- Build validation commands (type checking, linting)
- Code review analysis

## Reason

[One of:]
- Plan does not include visual/game changes requiring E2E tests
- No YAML test file found in docker/app/client/tests/e2e/
- Feature is backend-only or configuration change

## Conclusion

Test phase complete. No visual regression testing required for this change.
```

### 4. Verify Report Exists

**MANDATORY CHECK** - Confirm report was created:

```bash
if [ -f "$REPORT_DIR/report.md" ]; then
  echo "Report created: $REPORT_DIR/report.md"
else
  echo "ERROR: Report not created!"
  exit 1
fi
```

### 5. Output Summary

Print results for workflow visibility:

```
## Test Complete

Report: docker/app/client/tests/e2e/reports/{timestamp}/report.md
Status: PASSED | FAILED | SKIPPED
```

---

## Interaction Methods (for prompt-based tests)

### Keyboard Input
Use `mcp__playwright__browser_press_key`:
- Spacebar or 'a' key triggers buzzer
- Check `handleKeyDown` in Game.ts for supported keys

### Coordinate-Based Canvas Clicks
```javascript
// Dispatch click at canvas coordinates
(x, y) => {
  const canvas = document.querySelector('canvas');
  const rect = canvas.getBoundingClientRect();
  const event = new MouseEvent('click', {
    clientX: rect.left + x,
    clientY: rect.top + y,
    bubbles: true
  });
  canvas.dispatchEvent(event);
}
```

### Test Endpoints
Backend endpoints for programmatic triggering:

| Endpoint | Purpose |
|----------|---------|
| `GET /reload` | Force game reload |
| `GET /starttest` | Start automated test interval |
| `GET /stoptest` | Stop automated test interval |

### Querying Phaser State
```javascript
// Get active scene name
() => window.game?.scene?.scenes?.find(s => s.sys.isActive())?.sys.key

// Get scene-specific state
() => {
  const scene = window.game?.scene?.scenes?.find(s => s.sys.key === 'Game');
  return { isSpinning: scene?.isSpinning, wheelReady: scene?.wheelReady };
}
```

### Video Recording
Record test sessions for debugging or documentation:

```bash
# Start recording after browser is open
agent-browser record start "$REPORT_DIR/test-recording.webm"

# ... execute test steps ...

# Stop recording before closing browser
agent-browser record stop
```

**When to record:**
- Complex multi-step test sequences
- Debugging intermittent failures
- Creating demo videos for documentation
- Visual regression testing

**Notes:**
- Recording adds overhead; use for important tests
- Always stop recording before closing browser
- Include video link in report when recorded

---

## Report Format

All reports saved to: `docker/app/client/tests/e2e/reports/{YYYY-MM-DD_HH-MM-SS}/report.md`

```markdown
# Phaser Test Report

**Test:** [Name or description]
**Date:** [timestamp]
**Status:** PASSED | FAILED | SKIPPED
**Report Path:** docker/app/client/tests/e2e/reports/{timestamp}/report.md

## Test Objective
[What was being validated]

## Test Steps Executed

| Step | Action | Expected | Actual | Screenshot |
|------|--------|----------|--------|------------|
| 1 | [action] | [expected] | [actual] | 01-name.png |

## Screenshots

### 1. [Step Name]
![Step](./01-name.png)

## Video Recording (if captured)

[test-recording.webm](./test-recording.webm)

## Game State Checks
[Results of browser_evaluate queries]

## Issues Found
[Any failures or unexpected behaviors]

## Conclusion
[Summary and verdict]
```

---

## Report Guarantee

This command **GUARANTEES** a report file exists at:
```
docker/app/client/tests/e2e/reports/{YYYY-MM-DD_HH-MM-SS}/report.md
```

The report will have one of three statuses:
- **PASSED** - All tests executed successfully
- **FAILED** - Tests ran but found issues
- **SKIPPED** - No tests required for this feature

This enables Ralph Loop to detect workflow completion regardless of whether actual E2E tests were needed.
