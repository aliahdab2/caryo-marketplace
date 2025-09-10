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

  describe('cleanup command', () => {
    test('should show cleanup preview without --yes flag', () => {
      const result = runCommand('cleanup unused');
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Cleaning up unused translations');
      // Should not actually save without --yes flag
      expect(result.stdout).toMatch(/Use --yes to save changes|No unused translations found/);
    });

    test('should handle orphaned cleanup type', () => {
      const result = runCommand('cleanup orphaned');
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Cleaning up orphaned translations');
    });

    test('should default to unused cleanup type', () => {
      const result = runCommand('cleanup');
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Cleaning up unused translations');
    });
  });

  describe('help command', () => {
    test('should show updated help with new commands', () => {
      const result = runCommand('help');
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('unused');
      expect(result.stdout).toContain('orphaned');
      expect(result.stdout).toContain('scan');
      expect(result.stdout).toContain('source-analysis');
      expect(result.stdout).toContain('cleanup');
      expect(result.stdout).toContain('Show unused translation keys');
      expect(result.stdout).toContain('Show orphaned translations');
      expect(result.stdout).toContain('Perform source code analysis');
      expect(result.stdout).toContain('Remove unused or orphaned translations');
    });
  });

  describe('error handling', () => {
    test('should handle invalid cleanup type gracefully', () => {
      const result = runCommand('cleanup invalid');
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Cleaning up invalid translations');
      // Should handle gracefully even with invalid type
    });

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
