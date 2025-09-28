#!/bin/bash
# This script starts the backend server and runs the Postman tests

echo "====== Caryo Marketplace API Testing ======"
echo "Starting backend services with Docker..."

# Navigate to backend directory
cd backend/autotrader-backend || { echo "Error: Backend directory not found"; exit 1; }

# Start Docker services
echo "Starting Docker services..."
docker compose -f docker-compose.dev.yml up -d

# Wait for services to initialize
echo "Waiting for services to initialize (60 seconds)..."
sleep 20

# Check if database is ready
echo "Checking database readiness..."
RETRIES=5
COUNT=0
DB_READY=false

while [ $COUNT -lt $RETRIES ] && [ "$DB_READY" = false ]; do
  if docker exec $(docker ps -q -f name=db) pg_isready -U autotrader -t 5 2>/dev/null; then
    echo "Database is ready!"
    DB_READY=true
  else
    COUNT=$((COUNT+1))
    echo "Database not ready yet. Attempt $COUNT of $RETRIES"
    sleep 5
  fi
done

if [ "$DB_READY" = false ]; then
  echo "Warning: Database did not become ready in time, but continuing..."
fi

# Start Spring Boot application
echo "Starting Spring Boot application..."
./gradlew bootRun --args='--spring.profiles.active=dev' &
SPRING_PID=$!

# Wait for Spring Boot to start
echo "Waiting for Spring Boot to initialize..."
MAX_WAIT=60
COUNT=0
SPRING_READY=false

# Check if Spring Boot is running by polling the actuator health endpoint
while [ $COUNT -lt $MAX_WAIT ] && [ "$SPRING_READY" = false ]; do
  if curl -s http://localhost:8080/actuator/health | grep -q "UP"; then
    echo "Spring Boot application is ready!"
    SPRING_READY=true
  elif curl -s http://localhost:8080/status | grep -q "OK"; then
    echo "Spring Boot application is ready!"
    SPRING_READY=true
  else
    COUNT=$((COUNT+1))
    echo "Spring Boot not ready yet. Waiting ($COUNT/$MAX_WAIT seconds)..."
    sleep 1
  fi
done

if [ "$SPRING_READY" = false ]; then
  echo "Error: Spring Boot application failed to start in $MAX_WAIT seconds"
  echo "Checking logs for errors..."
  ./gradlew --stop
  echo "Cleaning up Docker services..."
  cd backend/autotrader-backend || true
  docker compose -f docker-compose.dev.yml down -v
  cd ../.. || true
  kill $SPRING_PID 2>/dev/null
  exit 1
fi

# Navigate back to project root
cd ../..

# Run Postman tests
echo "Running Postman tests..."
./run-postman-tests.sh

# Capture test result
TEST_RESULT=$?

# Cleanup
echo "Cleaning up resources..."
kill $SPRING_PID 2>/dev/null
cd backend/autotrader-backend
docker compose -f docker-compose.dev.yml down -v
cd ../..

echo "All done!"
exit $TEST_RESULT
