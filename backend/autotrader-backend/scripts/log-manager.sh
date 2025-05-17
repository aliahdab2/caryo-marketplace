#!/bin/bash

# Production log management script for Caryo Marketplace backend
# This script helps manage logs efficiently in production

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

LOGS_DIR="./logs"
ARCHIVE_DIR="$LOGS_DIR/archive"

# Create necessary directories
mkdir -p $LOGS_DIR
mkdir -p $ARCHIVE_DIR

# Function to print usage
print_usage() {
    echo -e "${YELLOW}Usage:${NC} $0 [rotate|archive|analyze|clean]"
    echo ""
    echo "Commands:"
    echo "  rotate    Rotate current log files"
    echo "  archive   Archive log files older than 7 days"
    echo "  analyze   Show basic log statistics"
    echo "  clean     Remove logs older than 30 days"
    echo ""
}

# Function to rotate logs
rotate_logs() {
    echo -e "${GREEN}Rotating log files...${NC}"
    
    # Get today's date in YYYY-MM-DD format
    TODAY=$(date +%Y-%m-%d)
    
    # Rotate application logs if they exist and have content
    if [ -f "$LOGS_DIR/application.log" ] && [ -s "$LOGS_DIR/application.log" ]; then
        cp "$LOGS_DIR/application.log" "$LOGS_DIR/application-$TODAY.log"
        echo "" > "$LOGS_DIR/application.log"
        echo -e "${GREEN}Application logs rotated${NC}"
    fi
    
    echo -e "${GREEN}Log rotation completed${NC}"
}

# Function to archive logs
archive_logs() {
    echo -e "${GREEN}Archiving log files older than 7 days...${NC}"
    
    # Find files older than 7 days and move to archive
    find $LOGS_DIR -type f -name "*.log" -mtime +7 -not -path "$ARCHIVE_DIR/*" | while read file; do
        filename=$(basename "$file")
        echo "Archiving $filename"
        gzip -c "$file" > "$ARCHIVE_DIR/${filename}.gz"
        rm "$file"
    done
    
    echo -e "${GREEN}Log archiving completed${NC}"
}

# Function to analyze logs
analyze_logs() {
    echo -e "${GREEN}Analyzing log files...${NC}"
    
    # Count error and warning messages
    if [ -f "$LOGS_DIR/application.log" ]; then
        ERROR_COUNT=$(grep -c "ERROR" "$LOGS_DIR/application.log")
        WARN_COUNT=$(grep -c "WARN" "$LOGS_DIR/application.log")
        INFO_COUNT=$(grep -c "INFO" "$LOGS_DIR/application.log")
        
        echo "Current log file statistics:"
        echo "  Errors:   $ERROR_COUNT"
        echo "  Warnings: $WARN_COUNT"
        echo "  Info:     $INFO_COUNT"
        
        echo -e "\nTop 5 most frequent errors:"
        grep "ERROR" "$LOGS_DIR/application.log" | sort | uniq -c | sort -nr | head -5
    else
        echo -e "${YELLOW}No application log file found${NC}"
    fi
    
    echo -e "${GREEN}Log analysis completed${NC}"
}

# Function to clean old logs
clean_logs() {
    echo -e "${YELLOW}Removing logs older than 30 days...${NC}"
    
    # Ask for confirmation
    echo -e "${RED}WARNING: This will permanently delete archived logs older than 30 days. Continue? (y/N)${NC}"
    read -p "" confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Operation cancelled.${NC}"
        return
    fi
    
    # Remove old archived logs
    find $ARCHIVE_DIR -type f -mtime +30 -name "*.gz" -exec rm {} \;
    
    echo -e "${GREEN}Old logs cleaned up${NC}"
}

# Main script logic
case "$1" in
    rotate)
        rotate_logs
        ;;
    archive)
        archive_logs
        ;;
    analyze)
        analyze_logs
        ;;
    clean)
        clean_logs
        ;;
    *)
        print_usage
        exit 1
        ;;
esac

exit 0
