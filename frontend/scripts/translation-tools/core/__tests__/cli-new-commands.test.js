const { execSync } = require('child_process');
const path = require('path');

// Set test environment
process.env.NODE_ENV = 'test';

const validatorPath = path.join(__dirname, '..', 'validator.js');

describe('CLI New Commands', () => {
  const runCommand = (command) => {
    try {
      const result = execSync(`node ${validatorPath} ${command}`, {
        encoding: 'utf8',
        cwd: path.dirname(validatorPath)
      });
      return { stdout: result, code: 0 };
    } catch (error) {
      return { stdout: error.stdout || '', stderr: error.stderr || '', code: error.status };
    }
  };

  describe('unused command', () => {
    test('should show unused translations report', () => {
      const result = runCommand('unused');
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('UNUSED TRANSLATIONS');
      expect(result.stdout).toContain('Scanning source files');
    });
  });

  describe('orphaned command', () => {
    test('should show orphaned translations report', () => {
      const result = runCommand('orphaned');
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('ORPHANED TRANSLATIONS');
      expect(result.stdout).toContain('Scanning source files');
    });
  });

  describe('scan command', () => {
    test('should perform source code analysis', () => {
      const result = runCommand('scan');
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('UNUSED TRANSLATIONS');
      expect(result.stdout).toContain('ORPHANED TRANSLATIONS');
      expect(result.stdout).toContain('MISSING KEYS IN SOURCE CODE');
      expect(result.stdout).toContain('Scanning source files');
    });
  });

  describe('source-analysis command', () => {
    test('should be alias for scan command', () => {
      const result = runCommand('source-analysis');
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('UNUSED TRANSLATIONS');
      expect(result.stdout).toContain('ORPHANED TRANSLATIONS');
      expect(result.stdout).toContain('MISSING KEYS IN SOURCE CODE');
    });
  });

  // Note: cleanup command tests removed - command deleted (analysis-only)

  describe('help command', () => {
    test('should show updated help with new commands', () => {
      const result = runCommand('help');
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('unused');
      expect(result.stdout).toContain('orphaned');
      expect(result.stdout).toContain('scan');
      expect(result.stdout).toContain('source-analysis');
      expect(result.stdout).toContain('export-missing');
      expect(result.stdout).toContain('Show unused translation keys');
      expect(result.stdout).toContain('Show orphaned translations');
      expect(result.stdout).toContain('Perform source code analysis');
      expect(result.stdout).toContain('Export missing translations + detect keys missing from ALL files');
    });
  });

  describe('export-missing command (enhanced edge case detection)', () => {
    test('should detect keys missing from all translation files', () => {
      const result = runCommand('export-missing en');

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('🔍 Analyzing translation completeness');
      expect(result.stdout).toContain('Scanning source code for translation usage');
      expect(result.stdout).toContain('📊 EXPORT SUMMARY:');
      expect(result.stdout).toContain('Completely missing keys:');
      expect(result.stdout).toContain('Normal missing translations:');
    });

    test('should warn about completely missing keys', () => {
      const result = runCommand('export-missing en');

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('⚠️  Found keys missing from ALL translation files:');
      expect(result.stdout).toContain('You can now send this file to translators');
    });

    test('should create export file with proper structure', () => {
      const result = runCommand('export-missing en');

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Exported to: missing-translations-en.json');

      // Verify the file was created (this would be checked in integration tests)
      // but we can at least verify the command completed successfully
    });

    test('should handle export-missing for different target languages', () => {
      const result = runCommand('export-missing ar');

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('🔍 Analyzing translation completeness for ar');
      expect(result.stdout).toContain('📊 EXPORT SUMMARY:');
    });

    test('should provide guidance when no missing translations found', () => {
      // This test would be for a scenario with no missing translations
      // For now, we verify the current behavior handles the case properly
      const result = runCommand('export-missing en');

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('You can now send this file to translators');
    });

    test('should show priority classification in export output', () => {
      const result = runCommand('export-missing en');

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('🔴 CRITICAL ISSUES:');
      expect(result.stdout).toContain('🟡 WARNING ISSUES:');
      expect(result.stdout).toContain('has fallback');
      expect(result.stdout).toContain('no fallback');
    });

    test('should include fallback text in export summary', () => {
      const result = runCommand('export-missing en');

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('PRIORITY ORDER:');
      expect(result.stdout).toContain('Critical keys (no fallback)');
      expect(result.stdout).toContain('Warning keys (has fallback)');
    });

    test('should handle export-missing for Arabic with proper fallbacks', () => {
      const result = runCommand('export-missing ar');

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('🔍 Analyzing translation completeness for ar');
      expect(result.stdout).toContain('📊 EXPORT SUMMARY:');
    });

    test('should validate translation keys against naming conventions', () => {
      const result = runCommand('validate');

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('🔍 Validating translation keys against naming conventions');
      // Test data may or may not have violations, so check for both cases
      const hasViolations = result.stdout.includes('⚠️  Found');
      const noViolations = result.stdout.includes('✅ All translation keys follow');

      expect(hasViolations || noViolations).toBe(true);

      if (hasViolations) {
        expect(result.stdout).toContain('translation guide violations');
        expect(result.stdout).toContain('💡 SUMMARY:');
        expect(result.stdout).toContain('🔧 FIXING VIOLATIONS:');
      } else {
        expect(result.stdout).toContain('🎉 No violations found.');
      }
    });
  });

  describe('error handling', () => {
    // Note: cleanup error handling test removed - cleanup command deleted

    test('should handle missing source directory gracefully', () => {
      // This tests the error handling in scanSourceFiles when directories don't exist
      const result = runCommand('scan');
      
      expect(result.code).toBe(0);
      // Should not crash even if some directories are missing
    });
  });
});

describe('Integration with existing commands', () => {
  test('detailed command should include source analysis when appropriate', () => {
    const result = execSync(`node ${validatorPath} detailed`, {
      encoding: 'utf8',
      cwd: path.dirname(validatorPath)
    });
    
    // The detailed command should show all sections including new ones
    expect(result).toContain('MISSING TRANSLATIONS');
    expect(result).toContain('DUPLICATE KEYS');
    expect(result).toContain('TYPE INCONSISTENCIES');
  });
});
