#!/usr/bin/env node

/**
 * Translation Tools Modular Test Runner
 * Runs all tests for the modular translation system
 */

const path = require('path');
const { spawn } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..', '..', '..', '..', '..');
const TEST_DIR = path.join(__dirname);

console.log('🚀 Running Translation Tools Modular Tests');
console.log('==========================================\n');

// Test files to run
const testFiles = [
  'duplicates.test.js',
  'loader.test.js',
  'utils.test.js'
];

let passedTests = 0;
let failedTests = 0;
const results = [];

function runTest(testFile) {
  return new Promise((resolve) => {
    const testPath = path.join(TEST_DIR, testFile);
    console.log(`📋 Running ${testFile}...`);

    const jest = spawn('npx', [
      'jest',
      testPath,
      '--verbose',
      '--no-coverage',
      '--testTimeout=30000'
    ], {
      cwd: ROOT_DIR,
      stdio: ['inherit', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    jest.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    jest.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    jest.on('close', (code) => {
      const success = code === 0;
      const result = {
        file: testFile,
        success,
        code,
        output: stdout,
        errors: stderr
      };

      results.push(result);

      if (success) {
        console.log(`✅ ${testFile} PASSED`);
        passedTests++;
      } else {
        console.log(`❌ ${testFile} FAILED (exit code: ${code})`);
        if (stderr) {
          console.log(`   Error: ${stderr.trim()}`);
        }
        failedTests++;
      }

      console.log('');
      resolve(result);
    });

    jest.on('error', (error) => {
      console.log(`❌ ${testFile} ERROR: ${error.message}`);
      failedTests++;
      results.push({
        file: testFile,
        success: false,
        code: -1,
        output: '',
        errors: error.message
      });
      resolve();
    });
  });
}

async function runAllTests() {
  console.log(`📂 Test Directory: ${TEST_DIR}`);
  console.log(`🎯 Found ${testFiles.length} test files to run\n`);

  for (const testFile of testFiles) {
    await runTest(testFile);
  }

  // Print summary
  console.log('==========================================');
  console.log('🏁 TEST SUMMARY');
  console.log('==========================================');
  console.log(`Total Tests: ${testFiles.length}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log('');

  if (failedTests > 0) {
    console.log('❌ FAILED TESTS:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`   - ${result.file}`);
      if (result.errors) {
        console.log(`     Error: ${result.errors.trim()}`);
      }
    });
    console.log('');
    process.exit(1);
  } else {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('');
    console.log('📊 Test Coverage:');
    console.log('   ✅ Duplicates Detection & Fixing');
    console.log('   ✅ File Loading & Parsing');
    console.log('   ✅ Utility Functions');
    console.log('   ✅ Error Handling');
    console.log('   ✅ Performance');
    console.log('   ✅ Integration');
    console.log('');
    console.log('💡 The modular translation system is working correctly!');
  }
}

// Check if Jest is available
function checkJest() {
  return new Promise((resolve) => {
    const check = spawn('npx', ['jest', '--version'], {
      cwd: ROOT_DIR,
      stdio: 'pipe'
    });

    check.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Jest is available');
        resolve(true);
      } else {
        console.log('❌ Jest is not available. Please install dependencies first:');
        console.log('   npm install');
        resolve(false);
      }
    });

    check.on('error', () => {
      console.log('❌ Jest is not available. Please install dependencies first:');
      console.log('   npm install');
      resolve(false);
    });
  });
}

// Main execution
async function main() {
  const jestAvailable = await checkJest();

  if (!jestAvailable) {
    process.exit(1);
  }

  console.log('');
  await runAllTests();
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  runTest
};
