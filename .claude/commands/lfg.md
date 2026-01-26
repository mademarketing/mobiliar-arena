---
name: lfg
description: Full autonomous engineering workflow
argument-hint: "[feature description]"
---

Run these slash commands in order. Do not do anything else.

1. `/ralph-loop:ralph-loop "finish all slash commands" --completion-promise "DONE"` --max-iterations 30
2. `/plan-concise $ARGUMENTS`
3. `/build`
4. `/review`
5. `/fix`
6. `/test-game` - Always generates a report (PASSED, FAILED, or SKIPPED)
7. Verify report exists at `docker/app/client/tests/e2e/reports/*/report.md`
8. If tests FAILED, fix issues and re-run `/test-game`
9. Output `<promise>DONE</promise>` when test report shows PASSED or SKIPPED status

Start with step 1 now.
