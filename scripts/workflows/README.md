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
