#!/bin/bash
# organize_scripts.sh
# Script to organize the scripts directory for Caryo Marketplace
#
# This script will:
# 1. Create subdirectories by script type
# 2. Move scripts to appropriate directories
# 3. Create symlinks in the original location for backward compatibility
#
# Usage: ./scripts/organize_scripts.sh [--no-links]
# --no-links: Skip creating symlinks (optional)

set -e

# Color definitions
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Directory structure to create
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CREATE_LINKS=true

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --no-links) CREATE_LINKS=false; shift ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
done

echo -e "${CYAN}${BOLD}===== Organizing Scripts Directory =====${NC}"

# Create subdirectories
echo -e "${GREEN}Creating subdirectories...${NC}"
mkdir -p "$SCRIPT_DIR/image" "$SCRIPT_DIR/diagnostics" "$SCRIPT_DIR/workflows" "$SCRIPT_DIR/testing" "$SCRIPT_DIR/maintenance"

# Define script categories using simple variables instead of associative arrays
# Format: script_category_scriptname=category
# Define script categories using simple variables
# Image management scripts
script_category_fix_car_images_sh="image"
script_category_post_rebuild_sh="image"
script_category_ensure_minio_bucket_sh="image"

# Diagnostic scripts
script_category_diagnose_api_sh="diagnostics"
script_category_diagnose_postman_tests_sh="diagnostics"
script_category_diagnose_spring_boot_sh="diagnostics"
script_category_diagnose_user_auth_sh="diagnostics"

# Workflow testing scripts
script_category_test_workflows_sh="workflows"
script_category_test_all_workflows_sh="workflows"
script_category_test_reusable_workflows_sh="workflows"
script_category_fix_workflow_yaml_sh="workflows"
script_category_fix_postman_workflow_sh="workflows"

# Testing scripts
script_category_run_postman_tests_with_no_auth_sh="testing"
script_category_test_auth_paths_sh="testing"
script_category_mock_spring_boot_sh="testing"
script_category_test_docker_compose_yml="testing"

# Maintenance scripts
script_category_cleanup_sh="maintenance"
script_category_cleanup_image_scripts_sh="maintenance"

# Move scripts to appropriate directories
echo -e "${GREEN}Moving scripts to appropriate directories...${NC}"

# Process each script type manually
process_script() {
    local script="$1"
    local category="$2"
    
    if [[ -f "$SCRIPT_DIR/$script" ]]; then
        # Copy the script to the category directory
        cp "$SCRIPT_DIR/$script" "$SCRIPT_DIR/$category/"
        chmod +x "$SCRIPT_DIR/$category/$script"
        
        # Create a symlink if requested
        if [ "$CREATE_LINKS" = true ]; then
            # Backup the original script first
            mv "$SCRIPT_DIR/$script" "$SCRIPT_DIR/$script.bak"
            # Create a symlink
            ln -sf "$category/$script" "$SCRIPT_DIR/$script"
            echo -e "${CYAN}Created symlink: $script -> $category/$script${NC}"
            # Remove the backup
            rm "$SCRIPT_DIR/$script.bak"
        else
            # Remove the original script
            rm "$SCRIPT_DIR/$script"
            echo -e "${CYAN}Moved: $script -> $category/$script${NC}"
        fi
    else
        echo -e "${YELLOW}Warning: Script $script not found, skipping${NC}"
    fi
}

# Process each script
# Image management scripts
process_script "fix_car_images.sh" "image"
process_script "post_rebuild.sh" "image"
process_script "ensure-minio-bucket.sh" "image"

# Diagnostic scripts
process_script "diagnose-api.sh" "diagnostics"
process_script "diagnose-postman-tests.sh" "diagnostics"
process_script "diagnose-spring-boot.sh" "diagnostics"
process_script "diagnose-user-auth.sh" "diagnostics"

# Workflow testing scripts
process_script "test-workflows.sh" "workflows"
process_script "test-all-workflows.sh" "workflows"
process_script "test-reusable-workflows.sh" "workflows"
process_script "fix-workflow-yaml.sh" "workflows"
process_script "fix-postman-workflow.sh" "workflows"

# Testing scripts
process_script "run-postman-tests-with-no-auth.sh" "testing"
process_script "test-auth-paths.sh" "testing"
process_script "mock-spring-boot.sh" "testing"
process_script "test-docker-compose.yml" "testing"

# Maintenance scripts
process_script "cleanup.sh" "maintenance"
process_script "cleanup_image_scripts.sh" "maintenance"

# Move README files
if [[ -f "$SCRIPT_DIR/IMAGE_SCRIPTS_README.md" ]]; then
    cp "$SCRIPT_DIR/IMAGE_SCRIPTS_README.md" "$SCRIPT_DIR/image/README.md"
    if [ "$CREATE_LINKS" = true ]; then
        # Keep the original
        echo -e "${CYAN}Copied: IMAGE_SCRIPTS_README.md -> image/README.md${NC}"
    else
        # Remove the original
        rm "$SCRIPT_DIR/IMAGE_SCRIPTS_README.md"
        echo -e "${CYAN}Moved: IMAGE_SCRIPTS_README.md -> image/README.md${NC}"
    fi
fi

# Create category-specific README files
echo -e "${GREEN}Creating category-specific README files...${NC}"

# Diagnostics README
cat > "$SCRIPT_DIR/diagnostics/README.md" << 'EOL'
# Diagnostic Scripts

This directory contains scripts for diagnosing issues in the Caryo Marketplace application.

## Available Scripts

| Script | Description |
|--------|-------------|
| `diagnose-api.sh` | Performs comprehensive API diagnostics including endpoint health checks, authentication flows, and error reporting. |
| `diagnose-postman-tests.sh` | Diagnoses issues with Postman API tests, particularly in CI environments. |
| `diagnose-spring-boot.sh` | Helps diagnose Spring Boot startup issues and runtime errors. |
| `diagnose-user-auth.sh` | Specifically tests and diagnoses authentication and authorization flows. |

## Usage Examples

```bash
# Diagnose API issues
./scripts/diagnostics/diagnose-api.sh http://localhost:8080

# Diagnose Postman test failures
./scripts/diagnostics/diagnose-postman-tests.sh
```

For general script documentation, see the main [README.md](../README.md).
EOL

# Workflows README
cat > "$SCRIPT_DIR/workflows/README.md" << 'EOL'
# Workflow Testing Scripts

This directory contains scripts for testing GitHub Actions workflows locally.

## Available Scripts

| Script | Description |
|--------|-------------|
| `test-workflows.sh` | Main script for testing GitHub Action workflows locally using Act. |
| `test-all-workflows.sh` | Tests all defined workflows in sequence. |
| `test-reusable-workflows.sh` | Tests reusable GitHub Action workflows specifically. |
| `fix-workflow-yaml.sh` | Fixes common issues in workflow YAML files. |
| `fix-postman-workflow.sh` | Specifically fixes issues with the Postman test workflow. |

## Prerequisites

These scripts require [Act](https://github.com/nektos/act) to be installed.

## Usage Examples

```bash
# Test a specific workflow
./scripts/workflows/test-workflows.sh .github/workflows/ci.yml

# Test all workflows
./scripts/workflows/test-all-workflows.sh
```

For general script documentation, see the main [README.md](../README.md).
EOL

# Testing README
cat > "$SCRIPT_DIR/testing/README.md" << 'EOL'
# Testing Scripts

This directory contains scripts for testing the Caryo Marketplace application.

## Available Scripts

| Script | Description |
|--------|-------------|
| `run-postman-tests-with-no-auth.sh` | Runs Postman tests that don't require authentication. |
| `test-auth-paths.sh` | Tests various authentication paths and scenarios. |
| `mock-spring-boot.sh` | Creates a mock Spring Boot server for testing purposes. |
| `test-docker-compose.yml` | A Docker Compose file used for testing configurations. |

## Usage Examples

```bash
# Run Postman tests without authentication
./scripts/testing/run-postman-tests-with-no-auth.sh

# Test authentication paths
./scripts/testing/test-auth-paths.sh
```

For general script documentation, see the main [README.md](../README.md).
EOL

# Maintenance README
cat > "$SCRIPT_DIR/maintenance/README.md" << 'EOL'
# Maintenance Scripts

This directory contains scripts for maintaining the Caryo Marketplace repository.

## Available Scripts

| Script | Description |
|--------|-------------|
| `cleanup.sh` | General cleanup script for removing temporary files and containers. |
| `cleanup_image_scripts.sh` | Specifically cleans up redundant image management scripts. |

## Usage Examples

```bash
# Run general cleanup
./scripts/maintenance/cleanup.sh

# Clean up image scripts
./scripts/maintenance/cleanup_image_scripts.sh
```

For general script documentation, see the main [README.md](../README.md).
EOL

echo -e "${GREEN}${BOLD}Scripts organization complete!${NC}"
echo ""
echo -e "The scripts have been organized into the following categories:"
echo -e "  - ${CYAN}image/${NC} - Image management scripts"
echo -e "  - ${CYAN}diagnostics/${NC} - Diagnostic scripts"
echo -e "  - ${CYAN}workflows/${NC} - Workflow testing scripts"
echo -e "  - ${CYAN}testing/${NC} - Testing scripts"
echo -e "  - ${CYAN}maintenance/${NC} - Maintenance scripts"
echo ""

if [ "$CREATE_LINKS" = true ]; then
    echo -e "${YELLOW}Symlinks have been created for backward compatibility.${NC}"
    echo -e "This means existing scripts can still be called from their original locations."
else
    echo -e "${YELLOW}No symlinks were created. Scripts must be called from their new locations.${NC}"
fi

echo ""
echo -e "To call a script from its new location, use:"
echo -e "  ${CYAN}./scripts/<category>/<script>${NC}"
echo -e "For example:"
echo -e "  ${CYAN}./scripts/image/fix_car_images.sh${NC}"
echo ""
echo -e "For more information, see the category-specific README files or the main README.md"
