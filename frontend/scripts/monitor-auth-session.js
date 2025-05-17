#!/usr/bin/env node

/**
 * NextAuth Session Monitor
 * 
 * This script monitors the NextAuth session endpoint to check for authentication status
 * and help diagnose authentication-related issues.
 */

// Import fetch compatibly with CommonJS and ESM
let fetch;
try {
  // Try ESM import (for newer Node versions)
  fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
} catch (error) {
  // Fall back to CommonJS import (for older Node versions)
  fetch = require('node-fetch');
}

import path from 'path';
import fs from 'fs';

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
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
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.user) {
          process.stdout.write(`✓ Authenticated as: ${data.user.name || data.user.email}\n`);
        } else {
          process.stdout.write('✗ Not authenticated\n');
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
  loadEnvFile();
  
  // Get frontend URL
  const FRONTEND_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  // Monitor session with 3-second polling
  await monitorSession(FRONTEND_URL, 3000);
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
