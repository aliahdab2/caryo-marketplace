#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * NextAuth Session Monitor
 * 
 * This script monitors the NextAuth session endpoint to check for authentication status
 * and help diagnose authentication-related issues.
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
  // Try ESM import (for newer Node versions)
  fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
} catch {
  // Fall back to CommonJS import (for older Node versions)
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
    // Skip comments and empty lines
    if (!line || line.startsWith('#') || line.startsWith('//')) return;
    
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

// Poll the session endpoint and display status
async function monitorSession(baseUrl, pollInterval = 3000) {
  console.log(`Monitoring NextAuth session at ${baseUrl}/api/auth/session`);
  console.log(`Polling every ${pollInterval/1000} seconds... (Ctrl+C to exit)`);
  console.log('----------------------------------------------------------');
  
  let count = 0;
  
  while (true) {
    count++;
    try {
      process.stdout.write(`[${new Date().toLocaleTimeString()}] Checking session... `);
      
      const response = await fetch(`${baseUrl}/api/auth/session`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Origin': baseUrl,
          'Referer': baseUrl,
          'Cookie': process.env.SESSION_COOKIE || '' // If you provide a session cookie via env var
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.user) {
          process.stdout.write(`✓ Authenticated as: ${data.user.name || data.user.email}\n`);
        } else {
          // Show more details about the session response
          process.stdout.write('✗ Not authenticated\n');
          
          // Check if there's any session data at all
          if (Object.keys(data).length > 0) {
            console.log(`   Session data received but no user: ${JSON.stringify(data)}`);
          } else {
            console.log('   Empty session data received');
          }
        }
      } else {
        process.stdout.write(`✗ Error: ${response.status} ${response.statusText}\n`);
      }
    } catch (error) {
      process.stdout.write(`✗ Connection error: ${error.message}\n`);
    }
    
    // Print a blank line every 10 polls for readability
    if (count % 10 === 0) {
      console.log('----------------------------------------------------------');
    }
    
    // Wait for the poll interval
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
}

async function main() {
  console.log('🔍 NextAuth Session Monitor\n');
  
  // Load environment variables
  console.log('Loading environment variables...');
  if (!loadEnvFile()) {
    console.log('No .env.local file found, using defaults');
  }
  console.log('✅ Environment loaded\n');
  
  // Get base URL from environment or use default
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  // Start monitoring
  await monitorSession(baseUrl);
}

// Run the main function
main().catch(error => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
});
