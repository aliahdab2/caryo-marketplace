#!/usr/bin/env node

/**
 * Translation Tools CLI
 * Unified interface for all translation maintenance tools
 */

const path = require('path');

const COMMANDS = {
  // Core validation (refactored modular validator)
  'validate': '../core/validator-refactored.js validate',
  'summary': '../core/validator-refactored.js summary',
  'detailed': '../core/validator-refactored.js detailed',
  'missing': '../core/validator-refactored.js missing',
  'duplicates': '../core/validator-refactored.js duplicates',
  'fix-duplicates': '../core/validator-refactored.js fix-duplicates',
  'orphaned': '../core/validator-refactored.js orphaned',
  'export': '../core/validator-refactored.js export',
  'export-missing': '../core/validator-refactored.js export-missing',

  // Analysis tools
  'sync-check': '../analysis/sync-check.js',
  'integrity-check': '../analysis/translation-integrity-checker.js',
  'usage-analysis': '../core/validator-refactored.js source-analysis', // Use refactored validator

  // Fix tools
  'fix-guide': '../fixes/guide-fixer.js',

  // Workflow tools
  'maintenance': '../workflow/maintenance.js'
};

function showHelp() {
  console.log(`
🎯 TRANSLATION TOOLS CLI
========================

USAGE:
  npm run translation <command> [options]

CORE VALIDATION (existing):
  validate           Validate translation guide compliance
  summary            Show summary report
  detailed           Show detailed report
  missing            Show missing translations
  duplicates         Show duplicate keys
  fix-duplicates     🛠️  Safely remove duplicate keys (keeps last occurrence)
  unused             Show unused translation keys
  orphaned           Show orphaned translations
  scan               Scan for translation usage
  source-analysis    Complete source code analysis
  export             Export detailed report
  export-missing     Export missing translations

ANALYSIS TOOLS:
  sync-check         Check EN/AR key synchronization
  integrity-check    Validate key consistency and language correctness
  usage-analysis     Analyze component usage vs translations

FIX TOOLS:
  fix-guide          Auto-fix translation guide violations

WORKFLOW TOOLS:
  maintenance        Run complete maintenance workflow

EXAMPLES:
  npm run translation validate
  npm run translation duplicates          # Check for duplicates
  npm run translation fix-duplicates      # Safely remove duplicates
  npm run translation sync-check
  npm run translation integrity-check
  npm run translation usage-analysis
  npm run translation fix-guide
  npm run translation maintenance

SHORTCUTS:
  npm run translation:validate    # Core validation
  npm run translation:sync-check  # Sync checking
  npm run translation:usage       # Usage analysis
  npm run translation:fix         # Auto-fixing
  npm run translation:maintenance # Full workflow
`);
}

function runCommand(command, args) {
  if (!COMMANDS[command]) {
    console.error(`❌ Unknown command: ${command}`);
    showHelp();
    process.exit(1);
  }

  const scriptPath = path.join(__dirname, COMMANDS[command]);
  const fullCommand = `node ${scriptPath} ${args.join(' ')}`;

  console.log(`🚀 Running: ${command}`);
  console.log(`📄 Script: ${COMMANDS[command]}`);
  console.log(`💻 Command: ${fullCommand}`);
  console.log('─'.repeat(50));

  try {
    require('child_process').execSync(fullCommand, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..', '..', '..')
    });
  } catch (error) {
    console.error(`❌ Command failed: ${error.message}`);
    process.exit(1);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
  } else {
    const command = args[0];
    const commandArgs = args.slice(1);
    runCommand(command, commandArgs);
  }
}

module.exports = { COMMANDS, showHelp, runCommand };
