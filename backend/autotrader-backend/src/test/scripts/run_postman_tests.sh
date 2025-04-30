#!/bin/bash

# Determine the project root directory based on script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$PROJECT_ROOT"

# Exit on error
set -e

# Start the Spring Boot app in a background process
echo "Starting Spring Boot application..."
"$PROJECT_ROOT/gradlew" bootRun &

# Store the process ID
SPRING_PID=$!

# Wait for the application to start
echo "Waiting for application to start..."
sleep 10

# Install Newman if not already installed
if ! command -v newman &> /dev/null; then
    echo "Newman not found, installing..."
    npm install -g newman
fi

# Make a directory for reports if it doesn't exist
mkdir -p build/test-reports/postman

# Run the Postman collection with HTML reporter
echo "Running Postman tests..."
newman run src/test/resources/postman/autotrader-api-tests.json \
  -e src/test/resources/postman/environment.json \
  --reporters cli,html \
  --reporter-html-export build/test-reports/postman/report.html

# Store the test result
TEST_RESULT=$?

# Kill the Spring Boot app
echo "Stopping Spring Boot application..."
kill $SPRING_PID

# Display a clear result message
if [ $TEST_RESULT -eq 0 ]; then
  echo -e "\n\033[32m✓ TESTS PASSED\033[0m"
  echo -e "HTML report available at: build/test-reports/postman/report.html"
else
  echo -e "\n\033[31m✗ TESTS FAILED\033[0m"
  echo -e "See details in the HTML report: build/test-reports/postman/report.html"
fi

# Return the test result
exit $TEST_RESULT
