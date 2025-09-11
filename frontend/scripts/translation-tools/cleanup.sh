#!/bin/bash

# Translation Tools Cleanup Script
# Cleans up backup files and organizes validator files

set -e

echo "🧹 Starting Translation Tools Cleanup..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

print_status "Working directory: $PROJECT_ROOT"
print_status "Translation tools directory: $SCRIPT_DIR"

# Step 1: Create archive directory for old files
ARCHIVE_DIR="$SCRIPT_DIR/archive"
if [ ! -d "$ARCHIVE_DIR" ]; then
    mkdir -p "$ARCHIVE_DIR"
    print_success "Created archive directory: $ARCHIVE_DIR"
else
    print_status "Archive directory already exists: $ARCHIVE_DIR"
fi

# Step 2: Archive the old monolithic validator
OLD_VALIDATOR="$SCRIPT_DIR/core/validator.js"
if [ -f "$OLD_VALIDATOR" ]; then
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    ARCHIVE_NAME="validator-monolithic-$TIMESTAMP.js"
    cp "$OLD_VALIDATOR" "$ARCHIVE_DIR/$ARCHIVE_NAME"
    print_success "Archived old validator to: $ARCHIVE_DIR/$ARCHIVE_NAME"
    print_warning "The old validator is preserved but no longer used"
else
    print_warning "Old validator file not found: $OLD_VALIDATOR"
fi

# Step 3: Clean up backup files
BACKUP_FILES=$(find "$PROJECT_ROOT/public/locales" -name "*.backup.*" -type f 2>/dev/null || true)

if [ -n "$BACKUP_FILES" ]; then
    BACKUP_COUNT=$(echo "$BACKUP_FILES" | wc -l | tr -d ' ')
    print_status "Found $BACKUP_COUNT backup files"

    echo "$BACKUP_FILES" | while read -r file; do
        if [ -f "$file" ]; then
            rm "$file"
            print_success "Removed backup: $(basename "$file")"
        fi
    done

    print_success "Cleaned up all backup files"
else
    print_status "No backup files found to clean up"
fi

# Step 4: Create a summary file of what was cleaned
SUMMARY_FILE="$ARCHIVE_DIR/cleanup-summary.txt"
cat > "$SUMMARY_FILE" << EOF
Translation Tools Cleanup Summary
================================

Date: $(date)
Project: Caryo Marketplace
Translation Tools Location: $SCRIPT_DIR

FILES ARCHIVED:
$(ls -la "$ARCHIVE_DIR" | grep -v "^total" | grep -v "^d" || echo "No files archived")

BACKUP FILES REMOVED:
$([ -n "$BACKUP_FILES" ] && echo "$BACKUP_FILES" | wc -l || echo "0") files removed
$([ -n "$BACKUP_FILES" ] && echo "$BACKUP_FILES" | sed 's/^/  - /' || echo "None")

CURRENT STRUCTURE:
- Active validator: validator-refactored.js (modular)
- Old validator: Moved to archive/ (monolithic)
- Modules: Organized in modules/ directory
- Tests: Available in modules/__tests__/

RECOMMENDATIONS:
- Use the new modular validator (validator-refactored.js)
- Run tests with: npm run translation:test
- Check modules documentation: modules/README.md

EOF

print_success "Created cleanup summary: $SUMMARY_FILE"

# Step 5: Show final structure
echo ""
print_status "Final Translation Tools Structure:"
echo "=================================="
find "$SCRIPT_DIR/core" -type f -name "*.js" | sort | while read -r file; do
    BASENAME=$(basename "$file")
    SIZE=$(du -h "$file" | cut -f1)
    echo "  $BASENAME ($SIZE)"
done

echo ""
print_success "Cleanup completed successfully! 🎉"
echo ""
print_status "Summary:"
echo "  ✅ Archived old validator file"
echo "  ✅ Cleaned up backup files"
echo "  ✅ Created cleanup summary"
echo "  ✅ Maintained new modular structure"
echo ""
print_status "Next steps:"
echo "  - Use: npm run translation:duplicates (for new modular system)"
echo "  - Test: npm run translation:test"
echo "  - Read: scripts/translation-tools/core/modules/README.md"
