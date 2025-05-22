#!/bin/bash
# Database migration and seeding management script

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Determine script and project directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"

print_status() { echo -e "${YELLOW}$1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

# Function to ensure database is available
ensure_db() {
    print_status "Ensuring database is available..."
    
    # Check if docker compose is running
    if ! docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" ps | grep -q "db.*running"; then
        print_status "Starting database container..."
        docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" up -d db
        
        # Wait for database to be ready
        print_status "Waiting for database to be ready..."
        sleep 10
    fi
    
    # Try to connect using psql
    if docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" exec db psql -U autotrader -d autotrader -c '\q' >/dev/null 2>&1; then
        print_success "Database is ready"
        return 0
    else
        print_error "Database is not available"
        return 1
    fi
}

# Function to run migrations
run_migrations() {
    local env=$1
    print_status "Running migrations for environment: $env"
    
    case "$env" in
        dev)
            cd "$PROJECT_ROOT" && ./gradlew flywayMigrateDev
            ;;
        test)
            cd "$PROJECT_ROOT" && ./gradlew flywayMigrateTest
            ;;
        prod)
            cd "$PROJECT_ROOT" && ./gradlew flywayMigrateProd
            ;;
        *)
            print_error "Invalid environment: $env. Use dev, test, or prod."
            return 1
            ;;
    esac
}

# Function to clean database
clean_db() {
    local env=$1
    
    if [ "$env" = "prod" ]; then
        print_error "Cannot clean production database"
        return 1
    fi
    
    print_status "Cleaning database for environment: $env"
    cd "$PROJECT_ROOT" && ./gradlew flywayClean
}

# Function to show migration info
show_info() {
    local env=$1
    print_status "Current migration status for environment: $env"
    cd "$PROJECT_ROOT" && ./gradlew -Penv=$env flywayInfo
}

# Function to validate migrations
validate_migrations() {
    local env=$1
    print_status "Validating migrations for environment: $env"
    cd "$PROJECT_ROOT" && ./gradlew -Penv=$env flywayValidate
}

# Function to repair migrations
repair_migrations() {
    local env=$1
    print_status "Repairing migrations for environment: $env"
    cd "$PROJECT_ROOT" && ./gradlew -Penv=$env flywayRepair
}

# Help message
show_help() {
    echo "Usage: $0 [command] [options]"
    echo
    echo "Commands:"
    echo "  migrate [env]    Run migrations (env: dev, test, prod)"
    echo "  clean [env]      Clean database (remove all objects)"
    echo "  info [env]       Show current migration status"
    echo "  validate [env]   Validate migration files"
    echo "  repair [env]     Repair migration metadata"
    echo "  help            Show this help message"
    echo
    echo "Environments:"
    echo "  dev    Development environment (includes sample data)"
    echo "  test   Test environment (includes test data)"
    echo "  prod   Production environment (no sample data)"
    echo
    echo "Examples:"
    echo "  $0 migrate dev   # Run migrations including development data"
    echo "  $0 migrate test  # Run migrations including test data"
    echo "  $0 migrate prod  # Run migrations for production (no test data)"
    echo "  $0 clean dev     # Clean the development database"
    echo "  $0 info dev      # Show migration status for development"
}

# Main command handler
case "$1" in
    migrate)
        env=${2:-dev}
        if ensure_db; then
            run_migrations "$env"
        fi
        ;;
    clean)
        env=${2:-dev}
        if ensure_db; then
            clean_db "$env"
        fi
        ;;
    info)
        env=${2:-dev}
        if ensure_db; then
            show_info "$env"
        fi
        ;;
    validate)
        env=${2:-dev}
        if ensure_db; then
            validate_migrations "$env"
        fi
        ;;
    repair)
        env=${2:-dev}
        if ensure_db; then
            repair_migrations "$env"
        fi
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
