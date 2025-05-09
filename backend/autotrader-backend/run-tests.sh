#!/bin/bash
#
# AutoTrader Backend Test Runner
#
# This is a convenience script that delegates to the main test runner
#
# Usage: ./run-tests.sh [COMMAND] [OPTIONS]
#

# Determine script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
RUNNER_SCRIPT="$SCRIPT_DIR/scripts/run-tests.sh"

# Check if the runner script exists
if [ ! -f "$RUNNER_SCRIPT" ]; then
    echo "❌ Error: Test runner script not found at $RUNNER_SCRIPT"
    exit 1
fi

# Make sure the runner script is executable
if [ ! -x "$RUNNER_SCRIPT" ]; then
    chmod +x "$RUNNER_SCRIPT"
fi

# Pass all arguments to the main runner script
exec "$RUNNER_SCRIPT" "$@"
