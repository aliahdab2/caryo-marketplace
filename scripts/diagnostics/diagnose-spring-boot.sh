#!/bin/bash
# Spring Boot Diagnostic Script
# This script helps diagnose Spring Boot startup issues in CI environments

LOG_FILE=${1:-"spring-boot.log"}
PID=${2:-""}

echo "===== Spring Boot Diagnostics ====="
echo "Date: $(date)"
echo "Log File: $LOG_FILE"
echo "PID: $PID"

# Check if log file exists
if [ -f "$LOG_FILE" ]; then
    LOG_SIZE=$(wc -l < "$LOG_FILE")
    echo "Log file exists with $LOG_SIZE lines"
else
    echo "ERROR: Log file not found!"
    exit 1
fi

# Check for common error patterns in logs
echo "===== Error Analysis ====="
DATASOURCE_ERROR=$(grep -i "datasource" "$LOG_FILE" | grep -i "error\|exception\|failed" || echo "No datasource errors found")
echo "Database connection issues: "
echo "$DATASOURCE_ERROR"

MINIO_ERROR=$(grep -i "minio\|s3\|storage" "$LOG_FILE" | grep -i "error\|exception\|failed" || echo "No MinIO/S3 errors found")
echo "MinIO/Storage issues: "
echo "$MINIO_ERROR"

PORT_ERROR=$(grep -i "port" "$LOG_FILE" | grep -i "error\|exception\|failed\|already in use" || echo "No port binding errors found")
echo "Port binding issues: "
echo "$PORT_ERROR"

BEAN_ERROR=$(grep -i "bean\|wiring\|autowire" "$LOG_FILE" | grep -i "error\|exception\|failed" || echo "No bean wiring errors found")
echo "Bean wiring issues: "
echo "$BEAN_ERROR"

# Check if Spring Boot actually started
echo "===== Startup Analysis ====="
if grep -q "Started .* in .* seconds" "$LOG_FILE"; then
    START_TIME=$(grep "Started .* in .* seconds" "$LOG_FILE")
    echo "✅ Application started successfully!"
    echo "$START_TIME"
else
    echo "❌ Application did not complete startup"
    
    # Check for final status before failure
    LAST_LINES=$(tail -20 "$LOG_FILE")
    echo "Last log entries:"
    echo "$LAST_LINES"
fi

# Check for database connection
echo "===== Database Connection ====="
if grep -q "HikariPool" "$LOG_FILE"; then
    CONNECTION_STATUS=$(grep "HikariPool" "$LOG_FILE" | tail -5)
    echo "Database connection pool:"
    echo "$CONNECTION_STATUS"
else
    echo "No database connection pool information found"
fi

# Check system resources
echo "===== System Resources ====="
echo "Memory usage:"
free -h

echo "Disk space:"
df -h

echo "Running Java processes:"
ps aux | grep java

echo "===== Diagnostic Complete ====="
