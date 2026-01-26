#!/bin/bash
# Run all e2e tests
# Usage: ./run-all.sh [--parallel]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PARALLEL=false

if [ "$1" = "--parallel" ]; then
    PARALLEL=true
fi

# Find all YAML tests
YAML_TESTS=$(find "$SCRIPT_DIR" -maxdepth 1 -name "*.yaml" -o -name "*.yml" | sort)

# Find all bash tests (excluding runner scripts)
BASH_TESTS=$(find "$SCRIPT_DIR" -maxdepth 1 -name "test-*.sh" | sort)

echo "=== E2E Test Runner ==="
echo "Mode: $([ "$PARALLEL" = true ] && echo "Parallel" || echo "Sequential")"
echo ""

TOTAL=0
PASSED=0
FAILED=0
PIDS=()

run_yaml_test() {
    local test_file="$1"
    local session="$2"
    local test_name=$(basename "$test_file" .yaml)

    echo "Running YAML test: $test_name"
    if "$SCRIPT_DIR/run-test.sh" "$test_file" --session "$session"; then
        return 0
    else
        return 1
    fi
}

run_bash_test() {
    local test_file="$1"
    local session="$2"
    local test_name=$(basename "$test_file" .sh)

    echo "Running bash test: $test_name"
    if AGENT_BROWSER_SESSION="$session" "$test_file"; then
        return 0
    else
        return 1
    fi
}

# Run YAML tests
for test_file in $YAML_TESTS; do
    ((TOTAL++))
    test_name=$(basename "$test_file" .yaml)
    session="yaml-$test_name"

    if [ "$PARALLEL" = true ]; then
        (run_yaml_test "$test_file" "$session" && echo "PASS: $test_name" || echo "FAIL: $test_name") &
        PIDS+=($!)
    else
        if run_yaml_test "$test_file" "$session"; then
            ((PASSED++))
        else
            ((FAILED++))
        fi
    fi
done

# Run bash tests
for test_file in $BASH_TESTS; do
    ((TOTAL++))
    test_name=$(basename "$test_file" .sh)
    session="bash-$test_name"

    if [ "$PARALLEL" = true ]; then
        (run_bash_test "$test_file" "$session" && echo "PASS: $test_name" || echo "FAIL: $test_name") &
        PIDS+=($!)
    else
        if run_bash_test "$test_file" "$session"; then
            ((PASSED++))
        else
            ((FAILED++))
        fi
    fi
done

# Wait for parallel tests
if [ "$PARALLEL" = true ]; then
    for pid in "${PIDS[@]}"; do
        if wait "$pid"; then
            ((PASSED++))
        else
            ((FAILED++))
        fi
    done
fi

echo ""
echo "=== Results ==="
echo "Total:  $TOTAL"
echo "Passed: $PASSED"
echo "Failed: $FAILED"

# Clean up sessions
echo ""
echo "Cleaning up sessions..."
agent-browser session list 2>/dev/null | grep -E "^(yaml|bash)-" | while read session; do
    agent-browser --session "$session" close 2>/dev/null || true
done

if [ "$FAILED" -gt 0 ]; then
    exit 1
fi
exit 0
