#!/bin/bash

# Determine the project root directory based on script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$PROJECT_ROOT"

# Exit on error
set -e

# Prepare test assets (create test images, PDFs, etc.)
echo "Preparing test assets for Postman tests..."
"$SCRIPT_DIR/prepare_test_assets.sh"

# Start the Spring Boot app in a background process
echo "Starting Spring Boot application..."
"$PROJECT_ROOT/gradlew" bootRun > "$PROJECT_ROOT/build/bootRun.log" 2>&1 &

# Store the process ID
SPRING_PID=$!

# Wait for the application to start (with timeout)
echo "Waiting for application to start..."
MAX_WAIT=60  # Maximum wait time in seconds
WAIT_INTERVAL=5  # Check every 5 seconds
ELAPSED=0

# Wait for the application to be ready
while [ $ELAPSED -lt $MAX_WAIT ]; do
  if curl -s http://localhost:8080/actuator/health >/dev/null 2>&1; then
    echo "✓ Application is running!"
    break
  fi
  
  # If we reach here, the application is not yet ready
  echo "Waiting for application to start... ($ELAPSED/$MAX_WAIT seconds)"
  sleep $WAIT_INTERVAL
  ELAPSED=$((ELAPSED + WAIT_INTERVAL))
done

# Check if we timed out
if [ $ELAPSED -ge $MAX_WAIT ]; then
  echo "❌ Error: Application failed to start within $MAX_WAIT seconds"
  echo "Check application logs for errors:"
  echo "------------------------------------"
  tail -n 20 "$PROJECT_ROOT/build/bootRun.log" 2>/dev/null || echo "No logs found"
  echo "------------------------------------"
  
  # Kill the Spring Boot app if it's still running
  kill $SPRING_PID 2>/dev/null || true
  
  exit 1
fi

# Add an extra small delay to ensure everything is fully initialized
sleep 5

# Install Newman if not already installed
if ! command -v newman &> /dev/null; then
    echo "Newman not found, installing..."
    npm install -g newman
fi

# Make a directory for reports if it doesn't exist
mkdir -p build/test-reports/postman

# Run the Postman collections with HTML reporter
echo "Running Postman tests..."

# Directory for the collections
POSTMAN_DIR="src/test/resources/postman"
COLLECTIONS_DIR="$POSTMAN_DIR/collections"
ENV_FILE="$POSTMAN_DIR/environment.json"
REPORT_DIR="build/test-reports/postman"

# Make a directory for individual collection reports
mkdir -p "$REPORT_DIR/collections"

# Run each collection individually
echo "Running auth tests..."
newman run "$COLLECTIONS_DIR/auth-tests.json" -e "$ENV_FILE" \
  --reporters cli,html \
  --reporter-html-export "$REPORT_DIR/collections/auth-report.html"

echo "Running reference data overview tests..."
newman run "$COLLECTIONS_DIR/reference-data-tests.json" -e "$ENV_FILE" \
  --reporters cli,html \
  --reporter-html-export "$REPORT_DIR/collections/reference-data-report.html"

echo "Running car conditions tests..."
newman run "$COLLECTIONS_DIR/car-conditions-tests.json" -e "$ENV_FILE" \
  --reporters cli,html \
  --reporter-html-export "$REPORT_DIR/collections/car-conditions-report.html"

echo "Running drive types tests..."
newman run "$COLLECTIONS_DIR/drive-types-tests.json" -e "$ENV_FILE" \
  --reporters cli,html \
  --reporter-html-export "$REPORT_DIR/collections/drive-types-report.html"

echo "Running body styles tests..."
newman run "$COLLECTIONS_DIR/body-styles-tests.json" -e "$ENV_FILE" \
  --reporters cli,html \
  --reporter-html-export "$REPORT_DIR/collections/body-styles-report.html"

echo "Running fuel types tests..."
newman run "$COLLECTIONS_DIR/fuel-types-tests.json" -e "$ENV_FILE" \
  --reporters cli,html \
  --reporter-html-export "$REPORT_DIR/collections/fuel-types-report.html"

echo "Running transmissions tests..."
newman run "$COLLECTIONS_DIR/transmissions-tests.json" -e "$ENV_FILE" \
  --reporters cli,html \
  --reporter-html-export "$REPORT_DIR/collections/transmissions-report.html"

echo "Running seller types tests..."
newman run "$COLLECTIONS_DIR/seller-types-tests.json" -e "$ENV_FILE" \
  --reporters cli,html \
  --reporter-html-export "$REPORT_DIR/collections/seller-types-report.html"

echo "Running pause and resume tests..."
newman run "$COLLECTIONS_DIR/pause-resume-tests.json" -e "$ENV_FILE" \
  --reporters cli,html \
  --reporter-html-export "$REPORT_DIR/collections/pause-resume-report.html"

echo "Running listings media tests..."
newman run "$COLLECTIONS_DIR/listings-media-tests.json" -e "$ENV_FILE" \
  --reporters cli,html \
  --reporter-html-export "$REPORT_DIR/collections/listings-media-report.html"

# Create a combined HTML report index
cat > "$REPORT_DIR/index.html" << EOL
<!DOCTYPE html>
<html>
<head>
    <title>AutoTrader API Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .collection { margin-bottom: 10px; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>AutoTrader API Test Results</h1>
    <p>Generated on: $(date)</p>
    <h2>Collection Reports:</h2>
    <div class="collection"><a href="collections/auth-report.html">Authentication Tests</a></div>
    <div class="collection"><a href="collections/reference-data-report.html">Reference Data Tests</a></div>
    <div class="collection"><a href="collections/car-conditions-report.html">Car Conditions Tests</a></div>
    <div class="collection"><a href="collections/drive-types-report.html">Drive Types Tests</a></div>
    <div class="collection"><a href="collections/body-styles-report.html">Body Styles Tests</a></div>
    <div class="collection"><a href="collections/fuel-types-report.html">Fuel Types Tests</a></div>
    <div class="collection"><a href="collections/transmissions-report.html">Transmissions Tests</a></div>
    <div class="collection"><a href="collections/seller-types-report.html">Seller Types Tests</a></div>
    <div class="collection"><a href="collections/pause-resume-report.html">Pause and Resume Tests</a></div>
    <div class="collection"><a href="collections/listings-media-report.html">Listings Media Tests</a></div>
</body>
</html>
EOL

# Store the test result - if any test failed, the whole run is considered a failure
if [ $? -ne 0 ]; then
    TEST_RESULT=1
else 
    TEST_RESULT=0
fi

# Kill the Spring Boot app
echo "Stopping Spring Boot application..."
kill $SPRING_PID

# Display a clear result message
if [ $TEST_RESULT -eq 0 ]; then
  echo -e "\n\033[32m✓ TESTS PASSED\033[0m"
  echo -e "HTML reports available at: build/test-reports/postman/index.html"
else
  echo -e "\n\033[31m✗ TESTS FAILED\033[0m"
  echo -e "See details in the HTML reports: build/test-reports/postman/index.html"
fi

# Return the test result
exit $TEST_RESULT
