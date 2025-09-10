# Translation Management Scripts

This directory contains consolidated translation management tools for the Caryo Marketplace application.

## Translation Tools Suite

All translation management functionality has been consolidated into the `translation-tools/` directory for better organization and maintenance.

### Available Tools

```bash
# Unified CLI interface
npm run translation <command>

# Core validation and analysis
npm run translation validate        # Check guide compliance
npm run translation integrity-check # Complete integrity + duplicates
npm run translation sync-check      # EN/AR key synchronization

# Automated fixes
npm run translation fix-guide       # Auto-fix translation violations

# Workflow orchestration
npm run translation maintenance     # Complete maintenance workflow
```

### Directory Structure

```
scripts/translation-tools/
├── cli/index.js              # Unified CLI interface
├── core/                     # Core tools (validator, translator, etc.)
├── analysis/                 # Analysis tools (sync-check, integrity-checker)
├── fixes/                    # Auto-fix tools (guide-fixer)
└── workflow/                 # Orchestration (maintenance)
```

## Migration Notes

- Old individual scripts have been consolidated into the unified `translation-tools` suite
- All package.json scripts now point to the new consolidated tools
- Better error handling, comprehensive logging, and improved maintainability

For detailed documentation, see: `scripts/translation-tools/README.md`
