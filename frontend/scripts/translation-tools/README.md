# Translation Tools Suite

A comprehensive, organized toolkit for translation management and maintenance in the Caryo Marketplace application.

## 📁 Directory Structure

```
scripts/translation-tools/
├── cli/
│   └── index.js              # Unified CLI interface
├── core/
│   ├── validator.js          # Translation validation & analysis
│   ├── translation-service.js # OpenAI translation service
│   └── github-service.js     # GitHub integration
├── analysis/
│   └── sync-check.js         # EN/AR synchronization validation
├── fixes/
│   ├── guide-fixer.js        # Auto-fix translation guide violations
│   └── cleaner.js            # Namespace-specific cleanup
├── workflow/
│   └── maintenance.js        # Automated maintenance workflow
└── README.md                 # This file
```

## 🚀 Usage

### Unified CLI Interface

```bash
# Use the unified interface
npm run translation <command> [options]

# Or use specific shortcuts
npm run translation:validate
npm run translation:sync-check
npm run translation:usage-analysis
```

### Available Commands

#### Core Validation (Existing)
```bash
npm run translation validate     # Guide compliance & naming
npm run translation summary      # Summary reports
npm run translation detailed     # Detailed analysis
npm run translation missing      # Missing translations
npm run translation duplicates   # Duplicate keys
npm run translation unused       # Unused keys
npm run translation orphaned     # Orphaned translations
npm run translation scan         # Basic scanning
npm run translation export       # Export reports
```

#### Analysis Tools
```bash
npm run translation sync-check        # EN/AR synchronization
npm run translation integrity-check   # Key consistency + language validation + DUPLICATE DETECTION
npm run translation usage-analysis    # Component usage analysis (uses core validator)
```

#### Fix Tools
```bash
npm run translation fix-guide         # Auto-fix guide violations
```

#### Workflow Tools
```bash
npm run translation maintenance       # Complete maintenance workflow
```

## 🔧 Tool Categories

### 🎯 Core Tools
- **Validator**: Comprehensive analysis of translation files (existing)
- **Translation Service**: OpenAI GPT-powered translation
- **GitHub Service**: PR creation and management

### 📊 Analysis Tools
- **Sync Check**: Validates EN/AR key synchronization (NEW)
- **Integrity Check**: Complete validation + duplicate detection + language verification (NEW)
- **Usage Analysis**: Component usage analysis (uses core validator)

### 🔧 Fix Tools
- **Guide Fixer**: Automatically fixes translation guide violations (NEW)

### ⚡ Workflow Tools
- **Maintenance**: Orchestrates complete translation maintenance workflow (NEW)

## 🎯 Consolidation Notes

- **usage-analysis** uses the core validator's `source-analysis` command
- **No duplicates** - each tool has a unique purpose
- **Backward compatible** - all existing commands still work
- **Organized structure** - tools grouped by functionality
- **Duplicate Detection** - integrity-check now detects duplicate translation values

## 📋 Workflow Examples

### Daily Maintenance
```bash
# Quick validation
npm run translation:validate

# Check synchronization
npm run translation:sync-check
```

### Before Deployment
```bash
# Complete analysis
npm run translation:usage-analysis

# Auto-fix issues
npm run translation:fix-guide
```

### Weekly Cleanup
```bash
# Full maintenance workflow
npm run translation:maintenance
```

### Namespace-Specific Work
```bash
# Clean specific namespace
npm run translation clean-favorites

# Analyze specific namespace
npm run translation usage-analysis -- --namespace favorites
```

## 🎯 Key Features

- ✅ **Organized Structure**: Tools grouped by functionality
- ✅ **Unified Interface**: Single CLI for all operations
- ✅ **Backward Compatible**: All existing commands still work
- ✅ **Extensible**: Easy to add new tools
- ✅ **Well Documented**: Clear usage and examples
- ✅ **No Duplications**: Each tool has unique purpose

## 🔄 Migration from Old Structure

### Old Structure (Before)
```
scripts/
├── translation-validator/
│   ├── validator.js
│   └── translation-service.js
├── check-translation-sync.js
├── analyze-translation-usage.js
└── fix-translation-guide-violations.js
```

### New Structure (After)
```
scripts/translation-tools/
├── cli/index.js           # Unified interface
├── core/validator.js      # Main validator
├── analysis/               # Analysis tools
├── fixes/                  # Auto-fix tools
└── workflow/               # Orchestration tools
```

### Backward Compatibility
All existing npm scripts continue to work:
```bash
npm run translation:validate    # Still works
npm run translation:sync-check  # Still works
npm run translation:fix-guide   # Still works
```

## 🚀 Getting Started

1. **Use the unified interface**:
   ```bash
   npm run translation --help
   ```

2. **Run validation**:
   ```bash
   npm run translation validate
   ```

3. **Check synchronization**:
   ```bash
   npm run translation sync-check
   ```

4. **Analyze usage**:
   ```bash
   npm run translation usage-analysis
   ```

## 📈 Benefits

- **🔍 Better Organization**: Tools grouped by purpose
- **⚡ Faster Access**: Unified CLI interface
- **🛠️ Easier Maintenance**: Clear separation of concerns
- **📚 Better Documentation**: Centralized help and examples
- **🔧 Extensible**: Easy to add new tools
- **🎯 Focused**: Each tool has specific responsibility

## 🤝 Contributing

When adding new translation tools:

1. Place in appropriate category folder (`core/`, `analysis/`, `fixes/`, `workflow/`)
2. Update the CLI interface in `cli/index.js`
3. Add npm script shortcut in `package.json`
4. Update this README

## 📞 Support

For issues or questions about translation tools:
- Check the unified help: `npm run translation --help`
- Run diagnostics: `npm run translation validate`
- Check specific tool help: `node scripts/translation-tools/cli/index.js <command> --help`
