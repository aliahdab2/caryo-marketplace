#!/bin/bash

# Script to verify environment variables for frontend
# Usage: ./scripts/check_frontend_env.sh [--fix]

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Determine script location and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Process command line arguments
AUTO_FIX=false
for arg in "$@"; do
    case $arg in
        --fix)
            AUTO_FIX=true
            shift
            ;;
        *)
            # Unknown option
            ;;
    esac
done

echo -e "${BLUE}🔍 Checking frontend environment variables...${NC}"
echo -e "${BLUE}📂 Frontend directory: $FRONTEND_DIR${NC}"

# Check environment files
if [ -f "$FRONTEND_DIR/.env" ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
else
    echo -e "${RED}✗ .env file is missing${NC}"
    echo -e "${YELLOW}  Create an .env file with required environment variables.${NC}"
    echo -e "${YELLOW}  Use .env.template as a starting point.${NC}"
fi

if [ -f "$FRONTEND_DIR/.env.local" ]; then
    echo -e "${GREEN}✓ .env.local file exists${NC}"
else
    echo -e "${YELLOW}! .env.local file is missing (not required, but recommended for local development)${NC}"
    echo -e "${YELLOW}  Consider creating an .env.local file from .env.local.example${NC}"
fi

# Function to check if a variable is defined in .env
check_env_var() {
    local var_name=$1
    local env_file="$FRONTEND_DIR/.env"
    
    if [ -f "$env_file" ] && grep -q "^$var_name=" "$env_file"; then
        echo -e "${GREEN}✓ $var_name is set in .env${NC}"
    else
        echo -e "${RED}✗ $var_name is not set in .env${NC}"
        echo -e "${YELLOW}  Add $var_name to your .env file${NC}"
    fi
}

# Check required variables
check_env_var "NEXT_PUBLIC_MINIO_URL"
check_env_var "NEXT_PUBLIC_API_URL"

# Environment files for production
if [ -f "$FRONTEND_DIR/.env.production" ]; then
    echo -e "${GREEN}✓ .env.production file exists${NC}"
    
    # Check if NEXT_PUBLIC_MINIO_URL is set in production env
    if grep -q "^NEXT_PUBLIC_MINIO_URL=" "$FRONTEND_DIR/.env.production"; then
        echo -e "${GREEN}✓ NEXT_PUBLIC_MINIO_URL is set in .env.production${NC}"
    else
        echo -e "${RED}✗ NEXT_PUBLIC_MINIO_URL is not set in .env.production${NC}"
        echo -e "${YELLOW}  Add NEXT_PUBLIC_MINIO_URL to your .env.production file${NC}"
    fi
else
    echo -e "${YELLOW}! .env.production file is missing (required for production builds)${NC}"
    echo -e "${YELLOW}  Create an .env.production file with production environment variables${NC}"
fi

echo -e "\n📚 For more information, see the documentation:"
echo -e "   docs/frontend_environment_variables.md"

# Ask if user wants to auto-create missing files
if [ ! -f "$FRONTEND_DIR/.env" ] || [ ! -f "$FRONTEND_DIR/.env.production" ]; then
    if [ "$AUTO_FIX" = true ]; then
        create_files="y"
        echo -e "${BLUE}Auto-fix enabled: Creating missing environment files${NC}"
    else
        echo -e "\n${YELLOW}Would you like to auto-create the missing environment files? (y/n)${NC}"
        read -r create_files
    fi
    
    if [[ $create_files =~ ^[Yy]$ ]]; then
        # Create .env file if missing
        if [ ! -f "$FRONTEND_DIR/.env" ]; then
            if [ -f "$FRONTEND_DIR/.env.template" ]; then
                cp "$FRONTEND_DIR/.env.template" "$FRONTEND_DIR/.env"
                echo -e "${GREEN}✓ Created .env file from template${NC}"
            else
                # Create basic .env file
                cat > "$FRONTEND_DIR/.env" << EOL
# MinIO Configuration
NEXT_PUBLIC_MINIO_URL=http://localhost:9000

# NextAuth Core Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development_secret_do_not_use_in_production

# API Backend URL
NEXT_PUBLIC_API_URL=http://localhost:8080
EOL
                echo -e "${GREEN}✓ Created basic .env file${NC}"
            fi
        fi
        
        # Create .env.production file if missing
        if [ ! -f "$FRONTEND_DIR/.env.production" ]; then
            cat > "$FRONTEND_DIR/.env.production" << EOL
# Production environment variables

# MinIO Configuration for production
NEXT_PUBLIC_MINIO_URL=https://storage.caryo-marketplace.com

# API Backend URL for production
NEXT_PUBLIC_API_URL=https://api.caryo-marketplace.com

# NextAuth Core Configuration
# Note: These values should be set in the actual deployment environment
# NEXTAUTH_URL=https://caryo-marketplace.com
# NEXTAUTH_SECRET=<secure-random-string>
EOL
            echo -e "${GREEN}✓ Created .env.production file${NC}"
        fi
        
        echo -e "\n${GREEN}✓ Environment files created. Please review and adjust the values as needed.${NC}"
    fi
fi

# MinIO connection check
check_minio_connection() {
    echo -e "\n${BLUE}🔌 Checking MinIO connection...${NC}"
    
    # Get MinIO URL from .env
    if [ -f "$FRONTEND_DIR/.env" ]; then
        MINIO_URL=$(grep "^NEXT_PUBLIC_MINIO_URL=" "$FRONTEND_DIR/.env" | cut -d '=' -f2)
        
        if [ -n "$MINIO_URL" ]; then
            echo -e "${YELLOW}Testing connection to MinIO at: $MINIO_URL${NC}"
            
            # Try to curl MinIO health or UI endpoint with a timeout
            if command -v curl &> /dev/null; then
                # Try multiple endpoints since the root might return 404
                ENDPOINTS=(
                    "$MINIO_URL/minio/health/live"  # Health endpoint
                    "$MINIO_URL/minio/health/ready" # Readiness endpoint
                    "$MINIO_URL/minio/ui/"          # UI endpoint
                    "$MINIO_URL"                    # Root endpoint
                )
                
                CONNECTION_SUCCESS=false
                
                for ENDPOINT in "${ENDPOINTS[@]}"; do
                    if curl --silent --fail --max-time 3 "$ENDPOINT" &> /dev/null; then
                        echo -e "${GREEN}✓ Successfully connected to MinIO server at $ENDPOINT${NC}"
                        CONNECTION_SUCCESS=true
                        
                        # Check if the bucket exists
                        BUCKET_NAME="autotrader-assets"
                        echo -e "${YELLOW}Checking for bucket: $BUCKET_NAME${NC}"
                        
                        # We can only check bucket existence with proper credentials
                        # For now, just inform the user
                        echo -e "${BLUE}ℹ️ To verify bucket existence, use:${NC}"
                        echo -e "${BLUE}   ./scripts/ensure-minio-bucket.sh --bucket $BUCKET_NAME${NC}"
                        break
                    fi
                done
                
                if [ "$CONNECTION_SUCCESS" = false ]; then
                    echo -e "${RED}✗ Failed to connect to MinIO server${NC}"
                    echo -e "${YELLOW}  Make sure MinIO is running and accessible at $MINIO_URL${NC}"
                    echo -e "${YELLOW}  You may need to start the development environment: ./backend/autotrader-backend/autotrader.sh dev start${NC}"
                    
                    # Try to ping the host to see if network connectivity is an issue
                    MINIO_HOST=$(echo "$MINIO_URL" | sed -e 's|^[^/]*//||' -e 's|/.*$||' -e 's|:.*$||')
                    if [ "$MINIO_HOST" != "localhost" ] && [ "$MINIO_HOST" != "127.0.0.1" ]; then
                        echo -e "${YELLOW}  Attempting to ping MinIO host: $MINIO_HOST${NC}"
                        if ping -c 1 "$MINIO_HOST" &> /dev/null; then
                            echo -e "${GREEN}  Host $MINIO_HOST is reachable${NC}"
                            echo -e "${YELLOW}  The issue might be with the MinIO service or firewall settings${NC}"
                        else
                            echo -e "${RED}  Host $MINIO_HOST is not reachable${NC}"
                            echo -e "${YELLOW}  Check your network connection and DNS settings${NC}"
                        fi
                    fi
                fi
            else
                echo -e "${YELLOW}! curl command not found, skipping MinIO connection test${NC}"
            fi
        else
            echo -e "${YELLOW}! NEXT_PUBLIC_MINIO_URL not found in .env file${NC}"
        fi
    fi
}

check_minio_buckets() {
    echo -e "\n${BLUE}📦 Checking MinIO buckets...${NC}"
    
    # Get MinIO URL from .env
    if [ -f "$FRONTEND_DIR/.env" ]; then
        MINIO_URL=$(grep "^NEXT_PUBLIC_MINIO_URL=" "$FRONTEND_DIR/.env" | cut -d '=' -f2)
        
        if [ -n "$MINIO_URL" ]; then
            # Check if MinIO client (mc) is installed
            if command -v mc &> /dev/null; then
                echo -e "${YELLOW}MinIO client (mc) found, checking buckets...${NC}"
                
                # Try to configure mc with alias
                MC_HOST="${MINIO_URL}"
                if mc alias set caryo "$MC_HOST" minioadmin minioadmin &> /dev/null; then
                    echo -e "${GREEN}✓ Successfully configured MinIO client${NC}"
                    
                    # Check if buckets exist
                    BUCKET_NAME="autotrader-assets"
                    if mc ls caryo | grep -q "$BUCKET_NAME"; then
                        echo -e "${GREEN}✓ Bucket '$BUCKET_NAME' exists${NC}"
                    else
                        echo -e "${YELLOW}! Bucket '$BUCKET_NAME' does not exist${NC}"
                        
                        if [ "$AUTO_FIX" = true ]; then
                            echo -e "${BLUE}Auto-fix enabled: Creating bucket '$BUCKET_NAME'${NC}"
                            
                            # Check if ensure-minio-bucket.sh exists and use it
                            if [ -f "$SCRIPT_DIR/ensure-minio-bucket.sh" ]; then
                                echo -e "${YELLOW}Using ensure-minio-bucket.sh script...${NC}"
                                if bash "$SCRIPT_DIR/ensure-minio-bucket.sh" --bucket "$BUCKET_NAME"; then
                                    echo -e "${GREEN}✓ Successfully created bucket '$BUCKET_NAME' using ensure-minio-bucket.sh${NC}"
                                else
                                    echo -e "${RED}✗ Failed to create bucket using ensure-minio-bucket.sh${NC}"
                                    echo -e "${YELLOW}Falling back to manual creation...${NC}"
                                    
                                    # Fallback to manual creation
                                    if mc mb caryo/$BUCKET_NAME &> /dev/null; then
                                        echo -e "${GREEN}✓ Successfully created bucket '$BUCKET_NAME'${NC}"
                                        # Set public policy for read access
                                        if mc policy set download caryo/$BUCKET_NAME &> /dev/null; then
                                            echo -e "${GREEN}✓ Set download policy for '$BUCKET_NAME'${NC}"
                                        else
                                            echo -e "${RED}✗ Failed to set download policy for '$BUCKET_NAME'${NC}"
                                        fi
                                    else
                                        echo -e "${RED}✗ Failed to create bucket '$BUCKET_NAME'${NC}"
                                    fi
                                fi
                            else
                                # Fallback to manual creation if script doesn't exist
                                if mc mb caryo/$BUCKET_NAME &> /dev/null; then
                                    echo -e "${GREEN}✓ Successfully created bucket '$BUCKET_NAME'${NC}"
                                    # Set public policy for read access
                                    if mc policy set download caryo/$BUCKET_NAME &> /dev/null; then
                                        echo -e "${GREEN}✓ Set download policy for '$BUCKET_NAME'${NC}"
                                    else
                                        echo -e "${RED}✗ Failed to set download policy for '$BUCKET_NAME'${NC}"
                                    fi
                                else
                                    echo -e "${RED}✗ Failed to create bucket '$BUCKET_NAME'${NC}"
                                fi
                            fi
                        else
                            echo -e "${YELLOW}  You may need to create it:${NC}"
                            echo -e "${YELLOW}  1. Using the ensure-minio-bucket.sh script:${NC}"
                            echo -e "${YELLOW}     ./scripts/ensure-minio-bucket.sh --bucket $BUCKET_NAME${NC}"
                            echo -e "${YELLOW}  2. Or using mc directly:${NC}"
                            echo -e "${YELLOW}     mc mb caryo/$BUCKET_NAME${NC}"
                            echo -e "${YELLOW}  Or run this script with --fix to create it automatically${NC}"
                        fi
                    fi
                    
                    # Remove the alias to avoid leaving credentials in the config
                    mc alias remove caryo &> /dev/null
                else
                    echo -e "${YELLOW}! Failed to configure MinIO client. Using curl instead.${NC}"
                    
                    # Try to check buckets using curl
                    if curl --silent --fail --max-time 3 "$MINIO_URL/minio/health/live" &> /dev/null; then
                        echo -e "${GREEN}✓ MinIO server is running${NC}"
                        echo -e "${YELLOW}  To check buckets, try running:${NC}"
                        echo -e "${YELLOW}  mc alias set caryo $MINIO_URL minioadmin minioadmin${NC}"
                        echo -e "${YELLOW}  mc ls caryo${NC}"
                    fi
                fi
            else
                echo -e "${YELLOW}! MinIO client (mc) not found. Cannot check buckets.${NC}"
                echo -e "${YELLOW}  Install mc to check buckets: https://min.io/docs/minio/linux/reference/minio-mc.html${NC}"
            fi
        else
            echo -e "${YELLOW}! NEXT_PUBLIC_MINIO_URL not found in .env file${NC}"
        fi
    fi
}

# Add MinIO connection check before finishing
check_minio_connection

# Add bucket check after connection check
check_minio_buckets

echo -e "\n✅ Environment check completed"
