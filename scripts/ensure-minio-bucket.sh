#!/bin/bash
# This script ensures that the required MinIO bucket exists for the application

# Default values
MINIO_HOST="localhost"
MINIO_PORT="9000"
MINIO_USER="newuser"
MINIO_PASSWORD="newpassword"
BUCKET_NAME="autotrader-assets"

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --host) MINIO_HOST="$2"; shift ;;
    --port) MINIO_PORT="$2"; shift ;;
    --user) MINIO_USER="$2"; shift ;;
    --password) MINIO_PASSWORD="$2"; shift ;;
    --bucket) BUCKET_NAME="$2"; shift ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

echo "=== MinIO Bucket Setup ==="
echo "Host: $MINIO_HOST:$MINIO_PORT"
echo "Bucket: $BUCKET_NAME"

# Function to check and wait for MinIO availability
check_minio_health() {
  echo "Checking MinIO health at http://$MINIO_HOST:$MINIO_PORT..."
  
  # Wait for MinIO to be available, with a timeout
  MAX_RETRIES=30
  RETRY=0
  
  while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -s -f "http://$MINIO_HOST:$MINIO_PORT/minio/health/ready" > /dev/null 2>&1; then
      echo "✅ MinIO is ready!"
      return 0
    fi
    
    RETRY=$((RETRY + 1))
    echo "MinIO not ready yet, waiting (attempt $RETRY/$MAX_RETRIES)..."
    sleep 3
  done
  
  echo "❌ MinIO was not ready after $MAX_RETRIES retries."
  return 1
}

# Function to set up MinIO client
setup_minio_client() {
  echo "Setting up MinIO client..."
  
  # Check if mc is already installed
  if command -v mc > /dev/null 2>&1; then
    echo "MinIO client found in PATH"
  else
    if [ "$(uname)" == "Darwin" ]; then
      # macOS
      echo "Installing MinIO client via Homebrew..."
      brew install minio/stable/mc || {
        echo "❌ Failed to install mc via Homebrew, attempting direct download..."
        curl -o mc https://dl.min.io/client/mc/release/darwin-amd64/mc
        chmod +x mc
        export PATH=$PATH:$(pwd)
      }
    else
      # Linux
      echo "Downloading MinIO client for Linux..."
      curl -o mc https://dl.min.io/client/mc/release/linux-amd64/mc
      chmod +x mc
      export PATH=$PATH:$(pwd)
    fi
  fi
  
  # Configure MinIO client
  echo "Configuring MinIO client..."
  mc config host add myminio "http://$MINIO_HOST:$MINIO_PORT" "$MINIO_USER" "$MINIO_PASSWORD" || {
    echo "❌ Failed to configure MinIO client. Check your credentials and MinIO availability."
    return 1
  }
  
  return 0
}

# Function to create bucket if it doesn't exist
create_bucket_if_missing() {
  echo "Checking if bucket '$BUCKET_NAME' exists..."
  
  if mc ls myminio | grep -q "$BUCKET_NAME"; then
    echo "✅ Bucket '$BUCKET_NAME' already exists."
  else
    echo "Creating bucket '$BUCKET_NAME'..."
    mc mb --ignore-existing "myminio/$BUCKET_NAME" || {
      echo "❌ Failed to create bucket '$BUCKET_NAME'."
      return 1
    }
    
    echo "Setting download policy on bucket '$BUCKET_NAME'..."
    mc policy set download "myminio/$BUCKET_NAME" || {
      echo "⚠️ Warning: Failed to set download policy on bucket."
    }
    
    echo "✅ Successfully created bucket '$BUCKET_NAME'."
  fi
  
  # Verify bucket exists after creation attempts
  if mc ls myminio | grep -q "$BUCKET_NAME"; then
    echo "✅ Confirmed bucket '$BUCKET_NAME' exists."
    return 0
  else
    echo "❌ Could not create or verify bucket '$BUCKET_NAME'."
    return 1
  fi
}

# Main execution
echo "Starting MinIO bucket setup..."

# Check MinIO health
check_minio_health || {
  echo "❌ MinIO is not available. Exiting."
  exit 1
}

# Setup MinIO client
setup_minio_client || {
  echo "❌ Failed to set up MinIO client. Exiting."
  exit 1
}

# Create bucket if missing
create_bucket_if_missing || {
  echo "❌ Failed to create bucket. Exiting."
  exit 1
}

echo "✅ MinIO bucket setup completed successfully!"
exit 0
