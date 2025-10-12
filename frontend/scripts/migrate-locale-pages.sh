#!/bin/bash

# 🚀 LOCALE PAGE MIGRATION UTILITY
# Automatically migrates pages to locale structure with common utilities

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/../"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 LOCALE PAGE MIGRATION UTILITY${NC}"
echo "=================================="

# Function to fix import paths
fix_import_paths() {
    local file_path=$1
    
    echo -e "${YELLOW}🔧 Fixing import paths in: $(basename "$file_path")${NC}"
    
    # Fix relative imports to use absolute @/ imports
    sed -i '' "s|from '\.\./\.\./\.\./utils/|from '@/utils/|g" "$file_path" 2>/dev/null || \
    sed -i "s|from '\.\./\.\./\.\./utils/|from '@/utils/|g" "$file_path"
    
    sed -i '' "s|from '\.\./\.\./\.\./\.\./utils/|from '@/utils/|g" "$file_path" 2>/dev/null || \
    sed -i "s|from '\.\./\.\./\.\./\.\./utils/|from '@/utils/|g" "$file_path"
    
    sed -i '' "s|from '\.\./\.\./\.\./components/|from '@/components/|g" "$file_path" 2>/dev/null || \
    sed -i "s|from '\.\./\.\./\.\./components/|from '@/components/|g" "$file_path"
    
    sed -i '' "s|from '\.\./\.\./\.\./\.\./components/|from '@/components/|g" "$file_path" 2>/dev/null || \
    sed -i "s|from '\.\./\.\./\.\./\.\./components/|from '@/components/|g" "$file_path"
    
    echo -e "${GREEN}✅ Import paths fixed${NC}"
}

# Function to migrate a page
migrate_page() {
    local source_path=$1
    local target_path=$2
    local page_name=$3
    
    echo -e "${YELLOW}📄 Migrating: $page_name${NC}"
    
    # Create target directory
    mkdir -p "$(dirname "$target_path")"
    
    # Check if source exists
    if [ ! -f "$source_path" ]; then
        echo -e "${RED}❌ Source not found: $source_path${NC}"
        return 1
    fi
    
    # Copy the page
    cp "$source_path" "$target_path"
    
    # Fix import paths
    fix_import_paths "$target_path"
    
    # Update imports and add locale utilities (if needed)
    if grep -q "export async function generateMetadata" "$target_path"; then
        # Add locale utilities import if metadata is present
        sed -i '' '1i\
import { extractLocale, generateLocaleMetadata, parseSearchParams, type LocalePageProps } from "@/utils/localeUtils";
' "$target_path" 2>/dev/null || sed -i '1i\import { extractLocale, generateLocaleMetadata, parseSearchParams, type LocalePageProps } from "@/utils/localeUtils";' "$target_path"
    fi
    
    echo -e "${GREEN}✅ Migrated: $page_name${NC}"
}

# Function to copy components directory
copy_components() {
    local source_dir=$1
    local target_dir=$2
    
    if [ -d "$source_dir" ]; then
        echo -e "${YELLOW}📁 Copying components...${NC}"
        cp -r "$source_dir" "$target_dir"
        echo -e "${GREEN}✅ Components copied${NC}"
    fi
}

# Navigate to frontend directory
cd "$FRONTEND_DIR"

echo -e "${BLUE}🔄 Phase 2: Migrating Public Pages${NC}"
echo ""

# Migrate search page
migrate_page "src/app/search/page.tsx" "src/app/[locale]/search/page.tsx" "Search Page"

# Copy search tests if they exist
if [ -d "src/app/search/__tests__" ]; then
    echo -e "${YELLOW}📁 Copying search tests...${NC}"
    cp -r "src/app/search/__tests__" "src/app/[locale]/search/"
    echo -e "${GREEN}✅ Search tests copied${NC}"
fi

# Migrate listings page
migrate_page "src/app/listings/page.tsx" "src/app/[locale]/listings/page.tsx" "Listings Page"

# Migrate listing detail page
migrate_page "src/app/listings/[id]/page.tsx" "src/app/[locale]/listings/[id]/page.tsx" "Listing Detail Page"

# Copy listing detail client component
if [ -f "src/app/listings/[id]/ListingDetailClient.tsx" ]; then
    cp "src/app/listings/[id]/ListingDetailClient.tsx" "src/app/[locale]/listings/[id]/ListingDetailClient.tsx"
    echo -e "${GREEN}✅ Listing Detail Client copied${NC}"
fi

# Copy listing components
copy_components "src/app/listings/[id]/components" "src/app/[locale]/listings/[id]/components"

# Migrate cars SEO page
migrate_page "src/app/cars/[[...params]]/page.tsx" "src/app/[locale]/cars/[[...params]]/page.tsx" "Cars SEO Page"

# Migrate contact page (if it exists)
if [ -f "src/app/contact/page.tsx" ]; then
    migrate_page "src/app/contact/page.tsx" "src/app/[locale]/contact/page.tsx" "Contact Page"
else
    echo -e "${YELLOW}⚠️  Contact page not found, skipping...${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Phase 2 Migration Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "✅ Search page migrated"
echo -e "✅ Listings pages migrated" 
echo -e "✅ Cars SEO page migrated"
echo -e "✅ Contact page migrated (if exists)"
echo -e "✅ Components and tests copied"
echo ""
echo -e "${YELLOW}🧪 Next: Test the migrated pages${NC}"
echo -e "   • /en/search"
echo -e "   • /ar/search" 
echo -e "   • /en/listings"
echo -e "   • /ar/listings"
