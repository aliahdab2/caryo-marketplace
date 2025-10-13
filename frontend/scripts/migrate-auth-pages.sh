#!/bin/bash

# 🔐 AUTH PAGES MIGRATION UTILITY
# Migrates all auth pages to locale structure

set -e

FRONTEND_DIR="/Users/aliahdab/Documents/caryo-marketplace/frontend"
BASE_DIR="$FRONTEND_DIR/src/app"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 AUTH PAGES MIGRATION - Phase 3${NC}"
echo "======================================="

# Navigate to frontend directory
cd "$FRONTEND_DIR"

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

# Function to migrate auth pages
migrate_auth_page() {
    local auth_path=$1
    local page_name=$2
    
    echo -e "${YELLOW}🔐 Migrating: $page_name${NC}"
    
    # Create target directory
    local target_dir="$BASE_DIR/[locale]/auth/$auth_path"
    mkdir -p "$target_dir"
    
    # Check if source exists
    local source_file="$BASE_DIR/auth/$auth_path/page.tsx"
    if [ ! -f "$source_file" ]; then
        echo -e "${RED}❌ Source not found: $source_file${NC}"
        return 1
    fi
    
    # Copy the page
    cp "$source_file" "$target_dir/page.tsx"
    
    # Fix import paths
    fix_import_paths "$target_dir/page.tsx"
    
    echo -e "${GREEN}✅ Migrated: $page_name${NC}"
}

# Function to copy auth directories with all contents
copy_auth_directory() {
    local auth_path=$1
    local dir_name=$2
    
    echo -e "${YELLOW}📁 Copying directory: $dir_name${NC}"
    
    local source_dir="$BASE_DIR/auth/$auth_path"
    local target_dir="$BASE_DIR/[locale]/auth/$auth_path"
    
    if [ -d "$source_dir" ]; then
        # Create parent directory
        mkdir -p "$(dirname "$target_dir")"
        
        # Copy entire directory
        cp -r "$source_dir" "$target_dir"
        
        # Fix import paths in all tsx files
        find "$target_dir" -name "*.tsx" -type f | while read -r file; do
            fix_import_paths "$file"
        done
        
        echo -e "${GREEN}✅ Directory copied: $dir_name${NC}"
    else
        echo -e "${YELLOW}⚠️  Directory not found: $source_dir${NC}"
    fi
}

echo -e "${BLUE}🔄 Migrating Auth Pages${NC}"
echo ""

# Create auth directory structure
mkdir -p "$BASE_DIR/[locale]/auth"

# Migrate individual auth pages
migrate_auth_page "signin" "Sign In Page"
migrate_auth_page "signup" "Sign Up Page" 
migrate_auth_page "check-email" "Check Email Page"
migrate_auth_page "forgot-password" "Forgot Password Page"
migrate_auth_page "reset-password" "Reset Password Page"
migrate_auth_page "verify-email" "Verify Email Page"

# Copy complex auth directories (with subdirectories)
copy_auth_directory "buyer-signup" "Buyer Signup Flow"
copy_auth_directory "dealer-signup" "Dealer Signup Flow"
copy_auth_directory "dealer-onboarding" "Dealer Onboarding Flow"
copy_auth_directory "role-selection" "Role Selection Flow"
copy_auth_directory "demo" "Demo Pages"
copy_auth_directory "signup/email" "Email Signup Flow"

echo ""
echo -e "${GREEN}🎉 AUTH PAGES MIGRATION COMPLETE!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "✅ Sign in/up pages migrated"
echo -e "✅ Password reset flow migrated"
echo -e "✅ Email verification migrated"
echo -e "✅ Buyer/dealer signup flows migrated"
echo -e "✅ Onboarding flows migrated"
echo -e "✅ All import paths fixed"
echo ""
echo -e "${YELLOW}🧪 Next: Test auth pages${NC}"
echo -e "   • /en/auth/signin"
echo -e "   • /ar/auth/signin"
echo -e "   • /en/auth/signup"
echo -e "   • /ar/auth/signup"
