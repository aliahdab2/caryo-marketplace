#!/bin/bash
# Enhanced script to start the backend server and run the Postman tests

set -e # Exit immediately if a command exits with non-zero status

# Color definitions
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Helper functions
log_info() {
  echo -e "${BOLD}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

cleanup() {
  log_info "Cleaning up resources..."
  
  # Kill Spring Boot process if running
  if [ ! -z "$SPRING_PID" ]; then
    log_info "Stopping Spring Boot application (PID: $SPRING_PID)..."
    kill $SPRING_PID 2>/dev/null || true
  fi
  
  # Stop Docker services if running
  if [ -d "./backend/autotrader-backend" ]; then
    log_info "Stopping Docker services..."
    cd backend/autotrader-backend 2>/dev/null && docker compose -f docker-compose.dev.yml down -v || true
  fi
  
  log_info "Cleanup complete"
}

# Set up trap to ensure cleanup on exit
trap cleanup EXIT INT TERM

log_info "====== Caryo Marketplace API Testing ======"
log_info "Starting backend services with Docker..."

# Navigate to backend directory
cd backend/autotrader-backend || { log_error "Backend directory not found"; exit 1; }

# Start Docker services
log_info "Starting Docker services..."
if ! docker compose -f docker-compose.dev.yml up -d; then
  log_error "Failed to start Docker services"
  exit 1
fi

# Check if database is ready
log_info "Checking database readiness..."
RETRIES=10
COUNT=0
DB_READY=false

while [ $COUNT -lt $RETRIES ] && [ "$DB_READY" = false ]; do
  if docker ps -q -f name=db >/dev/null && docker exec $(docker ps -q -f name=db) pg_isready -U autotrader -t 5 2>/dev/null; then
    log_success "Database is ready!"
    DB_READY=true
  else
    COUNT=$((COUNT+1))
    log_info "Database not ready yet. Attempt $COUNT of $RETRIES"
    sleep 5
  fi
done

if [ "$DB_READY" = false ]; then
  log_warning "Database did not become ready in time, but continuing..."
fi

# Start Spring Boot application
log_info "Starting Spring Boot application..."
./gradlew bootRun --args='--spring.profiles.active=dev' &
SPRING_PID=$!

# Wait for Spring Boot to start
log_info "Waiting for Spring Boot to initialize..."
MAX_WAIT=60
COUNT=0
SPRING_READY=false

# Check if Spring Boot is running by polling the health endpoints
while [ $COUNT -lt $MAX_WAIT ] && [ "$SPRING_READY" = false ]; do
  # Try various endpoints that might indicate the app is ready
  if curl -s http://localhost:8080/actuator/health 2>/dev/null | grep -q "UP"; then
    log_success "Spring Boot application is ready! (via actuator)"
    SPRING_READY=true
  elif curl -s http://localhost:8080/status 2>/dev/null | grep -q "Service is up"; then
    log_success "Spring Boot application is ready! (via status endpoint)"
    SPRING_READY=true
  elif curl -s http://localhost:8080/api/status 2>/dev/null | grep -q "API is up"; then
    log_success "Spring Boot application is ready! (via API status)"
    SPRING_READY=true
  else
    COUNT=$((COUNT+1))
    if [ $((COUNT % 5)) -eq 0 ]; then
      log_info "Spring Boot still starting... ($COUNT/$MAX_WAIT seconds)"
    fi
    sleep 1
  fi
done

if [ "$SPRING_READY" = false ]; then
  log_error "Spring Boot application failed to start in $MAX_WAIT seconds"
  log_info "Checking for Spring Boot process..."
  ps -p $SPRING_PID || echo "Process not found"
  exit 1
fi

# Navigate back to project root
cd ../..

# Run Postman tests
log_info "Running Postman tests..."
./run-postman-tests.sh

# Capture test result
TEST_RESULT=$?

if [ $TEST_RESULT -eq 0 ]; then
  log_success "All tests passed successfully!"
else
  log_error "Some tests failed. Check the report for details."
fi

log_info "All done! Exit code: $TEST_RESULT"
exit $TEST_RESULT
