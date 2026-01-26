---
description: Build the codebase based on the plan
argument-hint: [path-to-plan]
---

# Build

Follow the `Workflow` to implement the `PATH_TO_PLAN`, run tests, then `Report` the completed work.

## Instructions

- IMPORTANT: Implement the plan top to bottom, in order. Do not skip any steps. Do not stop in between steps. Complete every step in the plan before stopping.
  - Make your best guess judgement based on the plan, everything will be detailed there.
  - If you have not run any validation commands throughout your implementation, DO NOT STOP until you have validated the work.
  - Your implementation should end with executing the validation commands to validate the work, if there are issues, fix them before stopping.

## Variables

PATH_TO_PLAN: $ARGUMENTS

## Workflow

1. **Read Plan** - If no `PATH_TO_PLAN` is provided, STOP immediately and ask the user to provide it. Read the plan and understand all sections.

2. **Implement** - Implement the entire plan top to bottom before moving to validation.

3. **Run Validation Commands** - Execute ALL commands listed in the plan's "Validation Commands" section. Fix any issues before proceeding.

4. **Run Tests** - CRITICAL: Check if the plan contains any of these sections:
   - "Testing Strategy"
   - "E2E Test Sequence"
   - "E2E Test"
   - "Test Plan"

   If an E2E test YAML is defined in the plan:
   a. **Create the test file** - Write the YAML test file to `docker/app/client/tests/e2e/` as specified
   b. **Run using test-phaser agent** - Use the Task tool to spawn the `test-phaser` agent:
      ```
      Execute test sequence: docker/app/client/tests/e2e/{test-file}.yaml
      ```
   c. **Review the report** - The test-phaser agent will generate a report in `docker/app/client/tests/e2e/reports/`. Review it for failures.
   d. **Fix failures** - If tests fail, fix the implementation and re-run tests until they pass.

5. **Verify Acceptance Criteria** - Cross-check each acceptance criterion in the plan is satisfied.

## Test Execution Rules

- If the plan specifies an E2E test, you MUST create and run it
- Use the `test-phaser` sub-agent for Phaser/canvas game tests (it generates proper reports)
- For non-game tests, use appropriate test runners via Bash
- Never skip the testing phase - validation is mandatory before completion
- If tests fail, fix and re-run until they pass

## Report

After ALL validation and tests pass:

- Summarize the work you've just done in a concise bullet point list
- Include test results summary (passed/failed, link to report if applicable)
- Report the files and total lines changed with `git diff --stat`

## Report Format

```
## Summary
- [bullet points of work done]

## Test Results
- Validation commands: PASSED
- E2E tests: PASSED (report: docker/app/client/tests/e2e/reports/{timestamp}/report.md)

## Files Changed
[output of git diff --stat]
```
