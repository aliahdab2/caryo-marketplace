#!/bin/bash

# 🔧 FIX PROTECTED PAGES - Add dynamic export to prevent static generation
# This fixes build errors with useSession() in protected pages

set -e

FRONTEND_DIR="/Users/aliahdab/Documents/caryo-marketplace/frontend"
PROTECTED_DIR="$FRONTEND_DIR/src/app/(protected)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 FIXING PROTECTED PAGES BUILD ISSUES${NC}"
echo "========================================"

cd "$FRONTEND_DIR"

# Function to add dynamic export to a page
fix_protected_page() {
    local file_path=$1
    local page_name=$2
    
    echo -e "${YELLOW}🔧 Fixing: $page_name${NC}"
    
    # Check if file exists
    if [ ! -f "$file_path" ]; then
        echo -e "${YELLOW}⚠️  File not found: $file_path${NC}"
        return 1
    fi
    
    # Check if it already has dynamic export
    if grep -q "export const dynamic" "$file_path"; then
        echo -e "${GREEN}✅ Already fixed: $page_name${NC}"
        return 0
    fi
    
    # Check if it uses session-related hooks
    if grep -q "useSession\|useOptimizedSession\|useOptimizedUser\|useOptimizedAuthStatus" "$file_path"; then
        # Add dynamic export after the "use client" directive
        if grep -q '"use client"' "$file_path"; then
            sed -i '' '/"use client";/a\
\
// Disable static generation for this page since it uses session data\
export const dynamic = '\''force-dynamic'\'';
' "$file_path"
        elif grep -q "'use client'" "$file_path"; then
            sed -i '' "/'use client';/a\\
\\
// Disable static generation for this page since it uses session data\\
export const dynamic = 'force-dynamic';
" "$file_path"
        fi
        echo -e "${GREEN}✅ Fixed: $page_name${NC}"
    else
        echo -e "${YELLOW}⚠️  No session hooks found: $page_name${NC}"
    fi
}

echo -e "${BLUE}🔍 Finding all protected pages...${NC}"

# Find all page.tsx files in protected directory
find "$PROTECTED_DIR" -name "page.tsx" -type f | while read -r file; do
    # Get relative path for display
    rel_path=$(echo "$file" | sed "s|$FRONTEND_DIR/src/app/||")
    fix_protected_page "$file" "$rel_path"
done

echo ""
echo -e "${GREEN}🎉 PROTECTED PAGES FIXED!${NC}"
echo ""
echo -e "${BLUE}📋 What was done:${NC}"
echo "✅ Added 'export const dynamic = \"force-dynamic\"' to pages using session"
echo "✅ This prevents static generation during build"
echo "✅ Pages will be rendered at request time instead"
echo ""
echo -e "${YELLOW}🧪 Next: Test the build${NC}"
echo "   npm run build"
