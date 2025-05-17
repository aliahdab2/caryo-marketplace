#!/usr/bin/env node

/**
 * CORS and API Check Script
 * 
 * This script checks the connectivity between the frontend and backend
 * to help diagnose CORS and other API connection issues.
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

const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  
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

// Check if required environment variables are set
function checkRequiredEnvVars() {
  const required = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_API_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ];
  
  const missing = [];
  
  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
    } else if (
      key === 'GOOGLE_CLIENT_SECRET' && 
      (process.env[key] === 'your-google-client-secret' || process.env[key].includes('placeholder'))
    ) {
      console.error(`⚠️ ${key} appears to be a placeholder value`);
    }
  });
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}

// Check Google OAuth configuration
async function checkGoogleOAuth() {
  console.log('\n4. Testing Google OAuth Configuration...');
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error('❌ Missing Google OAuth credentials in environment variables');
    return;
  }
  
  // Check if client ID is valid format (looks like a Google client ID)
  if (!clientId.match(/^\d+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com$/)) {
    console.error('⚠️ GOOGLE_CLIENT_ID doesn\'t match the expected format');
  } else {
    console.log('✅ GOOGLE_CLIENT_ID has the correct format');
  }
  
  // Check if client secret has correct format (typically starts with GOCSPX-)
  if (!clientSecret.match(/^GOCSPX-[a-zA-Z0-9]+$/)) {
    console.error('⚠️ GOOGLE_CLIENT_SECRET doesn\'t match the expected format');
  } else {
    console.log('✅ GOOGLE_CLIENT_SECRET has the correct format');
  }
  
  // Try to verify credentials by making a token discovery request
  try {
    const response = await fetch('https://accounts.google.com/.well-known/openid-configuration');
    
    if (response.ok) {
      console.log('✅ Successfully connected to Google OpenID configuration endpoint');
    } else {
      console.error('❌ Failed to connect to Google OpenID configuration endpoint');
    }
  } catch (error) {
    console.error('❌ Network error when connecting to Google services:', error.message);
  }
}

// Check NextAuth endpoints
async function checkNextAuthEndpoints(baseUrl) {
  console.log('\n5. Testing NextAuth endpoints...');
  
  const endpoints = [
    '/api/auth/signin',
    '/api/auth/session',
    '/api/auth/csrf',
    '/api/auth/providers'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const status = `${response.status} ${response.statusText}`;
      
      // Most NextAuth endpoints return 200 even for unauthenticated users
      if (response.ok) {
        console.log(`✅ ${endpoint}: ${status}`);
      } else {
        console.log(`⚠️ ${endpoint}: ${status}`);
      }
    } catch (error) {
      console.error(`❌ ${endpoint}: ${error.message}`);
    }
  }
}

// Main function
async function main() {
  console.log('🔍 API & CORS Check Tool\n');
  
  // Load environment variables
  console.log('Loading environment variables...');
  loadEnvFile();
  
  if (!checkRequiredEnvVars()) {
    console.log('\n⚠️ Fix the environment variables before continuing');
  }
  
  // Get API URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const FRONTEND_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  console.log(`\n📡 API Configuration:`);
  console.log(`- Frontend URL: ${FRONTEND_URL}`);
  console.log(`- Backend API URL: ${API_URL}`);
  
  console.log(`\n🔄 Testing API Connectivity...`);
  
  // Check NextAuth session endpoint
  console.log('\n1. Testing NextAuth session endpoint...');
  try {
    const response = await fetch(`${FRONTEND_URL}/api/auth/session`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
      console.log('✅ NextAuth session endpoint is working properly');
    } else {
      console.log('❌ NextAuth session endpoint returned an error');
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 500)}`);
    }
  } catch (error) {
    console.error('❌ Failed to connect to NextAuth session endpoint:', error.message);
  }
  
  // Check backend health endpoint
  console.log('\n2. Testing Backend API connectivity...');
  try {
    const response = await fetch(`${API_URL}/api/health`, {
      headers: {
        'Origin': FRONTEND_URL,
        'Accept': 'application/json'
      }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log('✅ Backend API is accessible');
      try {
        const data = await response.json();
        console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
      } catch (e) {
        const text = await response.text();
        console.log(`   Response (text): ${text.substring(0, 500)}`);
      }
    } else if (response.status === 401) {
      console.log('✅ Backend API is accessible (401 is expected if auth is required)');
    } else {
      console.log('❌ Backend API returned an error');
      try {
        const text = await response.text();
        console.log(`   Response: ${text.substring(0, 500)}`);
      } catch (e) {
        console.log('   Could not read response body');
      }
    }
    
    // Check CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers.get('access-control-allow-origin'),
      'Access-Control-Allow-Methods': response.headers.get('access-control-allow-methods'),
      'Access-Control-Allow-Headers': response.headers.get('access-control-allow-headers'),
      'Access-Control-Allow-Credentials': response.headers.get('access-control-allow-credentials')
    };
    
    console.log('\n3. Checking CORS Headers:');
    if (corsHeaders['Access-Control-Allow-Origin']) {
      console.log(`✅ Access-Control-Allow-Origin: ${corsHeaders['Access-Control-Allow-Origin']}`);
      
      if (corsHeaders['Access-Control-Allow-Origin'] === '*') {
        console.log('⚠️  CORS is set to allow requests from any origin');
      } else if (corsHeaders['Access-Control-Allow-Origin'].includes(FRONTEND_URL)) {
        console.log('✅ CORS correctly allows requests from your frontend URL');
      } else {
        console.log('❌ Your frontend URL is not in the allowed CORS origins');
      }
    } else {
      console.log('❌ No Access-Control-Allow-Origin header found');
    }
    
    if (corsHeaders['Access-Control-Allow-Methods']) {
      console.log(`✅ Access-Control-Allow-Methods: ${corsHeaders['Access-Control-Allow-Methods']}`);
    } else {
      console.log('❓ No Access-Control-Allow-Methods header found (might be OK)');
    }
    
    if (corsHeaders['Access-Control-Allow-Headers']) {
      console.log(`✅ Access-Control-Allow-Headers: ${corsHeaders['Access-Control-Allow-Headers']}`);
    } else {
      console.log('❓ No Access-Control-Allow-Headers header found (might be OK)');
    }
  } catch (error) {
    console.error('❌ Failed to connect to backend API:', error.message);
  }
  
  // Check Google OAuth configuration
  await checkGoogleOAuth();
  
  // Check NextAuth endpoints
  await checkNextAuthEndpoints(FRONTEND_URL);
  
  console.log('\n🔍 Summary and Recommendations:');
  console.log('- If NextAuth session endpoint check failed, try restarting your Next.js development server');
  console.log('- If Backend API check failed, ensure your Spring Boot server is running');
  console.log('- If CORS headers are missing, check CORS configuration in your Spring Security setup');
  console.log('- If Google OAuth configuration is incorrect, verify your credentials in .env.local');
  console.log('- For failed fetch errors, check network connectivity between frontend and backend servers');
  console.log('\nRun the restart-dev.sh script to restart your Next.js server after making changes!');
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
