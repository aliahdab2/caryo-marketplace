/**
 * Translation Validator Tool - CLI Test Suite
 */

const { spawn } = require('child_process');
const path = require('path');

describe('Translation Validator CLI', () => {
  const cliPath = path.join(__dirname, '..', 'validator.js');

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should run summary command when no arguments provided', (done) => {
    const child = spawn('node', [cliPath], {
      cwd: path.join(__dirname, '..', '..'),
      stdio: 'pipe'
    });

    let output = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      expect(code).toBe(0);
      expect(output).toContain('TRANSLATION VALIDATION REPORT');
      expect(output).toContain('TRANSLATION COMPLETENESS');
      done();
    });
  });

  test('should display help when help command is used', (done) => {
    const child = spawn('node', [cliPath, 'help'], {
      cwd: path.join(__dirname, '..', '..'),
      stdio: 'pipe'
    });

    let output = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      expect(code).toBe(0);
      expect(output).toContain('Translation Validator Tool for Caryo Marketplace');
      expect(output).toContain('Commands:');
      done();
    });
  });

  test('should run summary command successfully', (done) => {
    const child = spawn('node', [cliPath, 'summary'], {
      cwd: path.join(__dirname, '..', '..'),
      stdio: 'pipe'
    });

    let output = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      expect(code).toBe(0);
      expect(output).toContain('TRANSLATION VALIDATION REPORT');
      expect(output).toContain('TRANSLATION COMPLETENESS');
      done();
    });
  }, 15000); // Increase timeout for file operations

  test('should handle invalid commands gracefully', (done) => {
    const child = spawn('node', [cliPath, 'invalid-command'], {
      cwd: path.join(__dirname, '..', '..'),
      stdio: 'pipe'
    });

    let output = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      expect(code).toBe(0);
      expect(output).toContain('Translation Validator Tool');
      expect(output).toContain('help');
      done();
    });
  });

  test('should export report to JSON file', (done) => {
    const testOutputPath = path.join(__dirname, '..', '..', 'test-report.json');

    const child = spawn('node', [cliPath, 'export', testOutputPath], {
      cwd: path.join(__dirname, '..', '..'),
      stdio: 'pipe'
    });

    let output = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      expect(code).toBe(0);
      expect(output).toContain('Report exported to');

      // Check if file was created
      const fs = require('fs');
      if (fs.existsSync(testOutputPath)) {
        const reportData = JSON.parse(fs.readFileSync(testOutputPath, 'utf8'));
        expect(reportData).toHaveProperty('generatedAt');
        expect(reportData).toHaveProperty('languages');
        expect(reportData).toHaveProperty('summary');

        // Clean up
        fs.unlinkSync(testOutputPath);
      }

      done();
    });
  }, 15000);
});

describe('Translation Validator Integration', () => {
  test('should work with npm scripts', (done) => {
    const child = spawn('npm', ['run', 'translation:summary'], {
      cwd: path.join(__dirname, '..', '..'),
      stdio: 'pipe'
    });

    let output = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      expect(code).toBe(0);
      expect(output).toContain('Loading translation files...');
      expect(output).toContain('TRANSLATION VALIDATION REPORT');
      done();
    });
  }, 20000);

  test('should handle missing translation files gracefully', (done) => {
    // Test with a non-existent directory (this would normally fail)
    const child = spawn('node', [path.join(__dirname, '..', 'validator.js'), 'summary'], {
      cwd: '/tmp', // Use a directory without translation files
      stdio: 'pipe'
    });

    let output = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      // Should not crash, even with missing files
      expect(code).toBe(0);
      done();
    });
  }, 10000);
});
