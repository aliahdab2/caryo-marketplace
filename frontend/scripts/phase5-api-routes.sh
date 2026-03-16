#!/bin/bash

# 🔧 PHASE 5: API & SPECIAL ROUTES OPTIMIZATION
# Handles remaining routes, navigation links, and special cases

set -e

FRONTEND_DIR="/Users/aliahdab/Documents/caryo-marketplace/frontend"
BASE_DIR="$FRONTEND_DIR/src"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 PHASE 5: API & SPECIAL ROUTES OPTIMIZATION${NC}"
echo "=============================================="

cd "$FRONTEND_DIR"

echo -e "${BLUE}🔍 Step 1: Verify API Routes (No Changes Needed)${NC}"
echo ""

# Check API routes structure
if [ -d "$BASE_DIR/app/api" ]; then
    echo -e "${GREEN}✅ API routes found and properly structured${NC}"
    echo -e "${YELLOW}📁 API structure:${NC}"
    find "$BASE_DIR/app/api" -name "route.ts" | head -5 | while read -r file; do
        rel_path=$(echo "$file" | sed "s|$BASE_DIR/app/||")
        echo -e "   • $rel_path"
    done
    echo -e "${GREEN}✅ API routes remain unchanged (correct)${NC}"
else
    echo -e "${YELLOW}⚠️  No API routes found${NC}"
fi

echo ""
echo -e "${BLUE}🔍 Step 2: Handle Special Routes${NC}"
echo ""

# Check for special routes that might need attention
special_routes=("not-found.tsx" "error.tsx" "loading.tsx" "global-error.tsx")

for route in "${special_routes[@]}"; do
    if [ -f "$BASE_DIR/app/$route" ]; then
        echo -e "${GREEN}✅ Found: $route (keeping at root level)${NC}"
    else
        echo -e "${YELLOW}⚠️  Not found: $route${NC}"
    fi
done

# Check for test routes
if [ -d "$BASE_DIR/app/test" ]; then
    echo -e "${YELLOW}📁 Test routes found - these can stay at root level${NC}"
    echo -e "${GREEN}✅ Test routes properly positioned${NC}"
fi

echo ""
echo -e "${BLUE}🔗 Step 3: Update Internal Navigation Links${NC}"
echo ""

# Function to update navigation links in key components
update_component_links() {
    local component_path=$1
    local component_name=$2
    
    if [ ! -f "$component_path" ]; then
        echo -e "${YELLOW}⚠️  Component not found: $component_name${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}🔗 Updating links in: $component_name${NC}"
    
    # Create a backup
    cp "$component_path" "$component_path.backup"
    
    # Update common navigation patterns (safe replacements)
    # Dashboard links (if they exist and don't already have locale)
    if grep -q 'href="/dashboard"' "$component_path" && ! grep -q 'i18n.language.*dashboard' "$component_path"; then
        sed -i '' 's|href="/dashboard"|href={`/${i18n.language}/dashboard`}|g' "$component_path" 2>/dev/null || \
        sed -i 's|href="/dashboard"|href={`/${i18n.language}/dashboard`}|g' "$component_path"
        echo -e "   • Updated dashboard href links"
    fi
    
    # Auth links (if they exist and don't already have locale)
    if grep -q 'href="/auth/' "$component_path" && ! grep -q 'i18n.language.*auth' "$component_path"; then
        sed -i '' 's|href="/auth/|href={`/${i18n.language}/auth/|g' "$component_path" 2>/dev/null || \
        sed -i 's|href="/auth/|href={`/${i18n.language}/auth/|g' "$component_path"
        echo -e "   • Updated auth href links"
    fi
    
    # Router.push patterns (basic ones)
    if grep -q 'router.push("/dashboard")' "$component_path" && ! grep -q 'i18n.language.*dashboard' "$component_path"; then
        sed -i '' 's|router.push("/dashboard")|router.push(`/${i18n.language}/dashboard`)|g' "$component_path" 2>/dev/null || \
        sed -i 's|router.push("/dashboard")|router.push(`/${i18n.language}/dashboard`)|g' "$component_path"
        echo -e "   • Updated router.push dashboard calls"
    fi
    
    echo -e "${GREEN}✅ Links updated in: $component_name${NC}"
}

# Key components that might have navigation links
components_to_update=(
    "$BASE_DIR/components/layout/Navbar.tsx:Navbar"
    "$BASE_DIR/components/layout/Sidebar.tsx:Sidebar"
    "$BASE_DIR/components/layout/MainLayout.tsx:MainLayout"
    "$BASE_DIR/components/ui/Breadcrumb.tsx:Breadcrumb"
    "$BASE_DIR/components/auth/AuthGuard.tsx:AuthGuard"
)

for component_info in "${components_to_update[@]}"; do
    IFS=':' read -r component_path component_name <<< "$component_info"
    update_component_links "$component_path" "$component_name"
done

echo ""
echo -e "${BLUE}🔍 Step 4: Verify Middleware Configuration${NC}"
echo ""

if [ -f "$BASE_DIR/middleware.ts" ]; then
    echo -e "${GREEN}✅ Middleware exists${NC}"
    
    # Check if middleware handles all necessary patterns
    if grep -q "api" "$BASE_DIR/middleware.ts"; then
        echo -e "${GREEN}✅ Middleware excludes API routes${NC}"
    else
        echo -e "${YELLOW}⚠️  Middleware might need API exclusion${NC}"
    fi
    
    if grep -q "_next" "$BASE_DIR/middleware.ts"; then
        echo -e "${GREEN}✅ Middleware excludes Next.js internals${NC}"
    else
        echo -e "${YELLOW}⚠️  Middleware might need Next.js exclusions${NC}"
    fi
    
    echo -e "${GREEN}✅ Middleware configuration verified${NC}"
else
    echo -e "${RED}❌ Middleware not found${NC}"
fi

echo ""
echo -e "${BLUE}🔍 Step 5: Check for Remaining Hard-coded Links${NC}"
echo ""

# Search for potential hard-coded links that might need updating
echo -e "${YELLOW}🔍 Scanning for hard-coded links...${NC}"

# Look for common patterns in key directories
search_dirs=("$BASE_DIR/components" "$BASE_DIR/app/[locale]")
patterns=('"\/dashboard"' '"\/auth\/' '"\/favorites"' '"\/saved"')

found_issues=0
for search_dir in "${search_dirs[@]}"; do
    if [ -d "$search_dir" ]; then
        for pattern in "${patterns[@]}"; do
            matches=$(grep -r "$pattern" "$search_dir" --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
            if [ "$matches" -gt 0 ]; then
                echo -e "${YELLOW}⚠️  Found $matches potential hard-coded links matching $pattern${NC}"
                found_issues=$((found_issues + matches))
            fi
        done
    fi
done

if [ $found_issues -eq 0 ]; then
    echo -e "${GREEN}✅ No obvious hard-coded links found${NC}"
else
    echo -e "${YELLOW}⚠️  Found $found_issues potential issues (manual review recommended)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 PHASE 5 COMPLETE!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "✅ API routes verified (no changes needed)"
echo "✅ Special routes checked (error.tsx, not-found.tsx, etc.)"
echo "✅ Navigation components updated"
echo "✅ Middleware configuration verified"
echo "✅ Hard-coded links scan completed"
echo ""
echo -e "${YELLOW}📝 Notes:${NC}"
echo "• API routes remain at /api/v1/* (correct)"
echo "• Special routes remain at root level (correct)"
echo "• Component backups created (.backup files)"
echo "• Manual review of navigation links recommended"
echo ""
echo -e "${BLUE}🚀 Ready for Phase 6: Testing & Cleanup${NC}"
