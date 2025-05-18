#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Simplified Caryo Diagnostics Tool
 * 
 * A streamlined tool that performs essential checks for the Caryo Marketplace app.
 */

// Disable punycode deprecation warning
process.removeAllListeners('warning');
const originalEmit = process.emit;
process.emit = function(name, data, ...args) {
  if (
    name === 'warning' && 
    data && 
    data.name === 'DeprecationWarning' && 
    data.message && 
    data.message.includes('punycode')
  ) {
    return false;
  }
  return originalEmit.call(process, name, data, ...args);
};

// Import fetch compatibly with CommonJS and ESM
let fetch;
try {
  fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
} catch { // Removed unused 'error' variable
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  fetch = require('node-fetch'); 
}

import path from 'path';
import fs from 'fs';

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '../..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    if (!line || line.startsWith('#')) return;
    
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      value = value.replace(/^(['"])(.*)(\1)$/, '$2');
      
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
  return true;
}

// Check essential config
async function checkEssentialConfig() {
  console.log('📋 Checking essential configuration...\n');
  
  const config = {
    'NEXT_PUBLIC_API_URL': process.env.NEXT_PUBLIC_API_URL || 'Not set',
    'NEXTAUTH_URL': process.env.NEXTAUTH_URL || 'Not set',
    'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID ? 'Set ✓' : 'Not set ✗',
    'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET ? 'Set ✓' : 'Not set ✗'
  };
  
  console.log('Essential configuration:');
  console.table(config);
  console.log('');
}

// Quick connectivity checks
async function runConnectivityChecks() {
  console.log('🔌 Running connectivity checks...\n');
  
  // API check
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      console.log(`Testing API connectivity (${apiUrl})...`);
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Origin': process.env.NEXTAUTH_URL || 'http://localhost:3000' }
      });
      
      const statusCode = response.status;
      if (statusCode === 401) {
        console.log('✅ API is reachable (401 unauthorized is expected)');
      } else if (response.ok) {
        console.log('✅ API is reachable and returned a success response');
      } else {
        console.log(`⚠️ API returned status: ${statusCode}`);
      }
      
      // Check CORS headers
      const corsHeader = response.headers.get('access-control-allow-origin');
      if (corsHeader) {
        console.log(`✅ CORS headers detected: ${corsHeader}`);
      } else {
        console.log('⚠️ No CORS headers detected in the response');
      }
    } catch (error) {
      console.log(`❌ API connectivity failed: ${error.message}`);
    }
  } else {
    console.log('❌ NEXT_PUBLIC_API_URL not set, skipping API check');
  }
  
  console.log('');
  
  // Simple NextAuth endpoint check (no auth status)
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    console.log(`Checking NextAuth endpoints (${baseUrl})...`);
    
    const response = await fetch(`${baseUrl}/api/auth/providers`);
    
    if (response.ok) {
      const data = await response.json();
      const providers = Object.keys(data);
      console.log(`✅ NextAuth is properly configured with these providers: ${providers.join(', ')}`);
    } else {
      console.log(`❌ NextAuth endpoint check failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ NextAuth endpoint error: ${error.message}`);
  }
}

// Main function
async function main() {
  console.log('🔍 Caryo Diagnostics Tool\n');
  
  // Load environment variables
  console.log('Loading environment variables...');
  if (loadEnvFile()) {
    console.log('✅ Environment variables loaded\n');
  } else {
    console.log('⚠️ Using default environment\n');
  }
  
  // Check configuration
  await checkEssentialConfig();
  
  // Run connectivity checks
  await runConnectivityChecks();
  
  console.log('\n✅ Diagnostics completed');
}

// Run the script
main().catch(error => {
  console.error('❌ An unexpected error occurred:', error);
  process.exit(1);
});
