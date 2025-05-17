#!/usr/bin/env node

/**
 * CORS and API Check Script
 * 
 * This script checks the connectivity between the frontend and backend
 * to help diagnose CORS and other API connection issues.
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
} catch (error) {
  // Fall back to CommonJS import (for older Node versions)
  fetch = require('node-fetch');
}

const path = require('path');
const fs = require('fs');

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

  // Check if client secret is a placeholder
  if (clientSecret === 'your-google-client-secret' || clientSecret.includes('placeholder')) {
    console.error('❌ GOOGLE_CLIENT_SECRET appears to be a placeholder');
    console.error('   Please replace it with your actual client secret');
  } else {
    console.log('✅ GOOGLE_CLIENT_SECRET is set');
  }
  
  // Try to connect to Google's discovery endpoint
  try {
    const response = await fetch('https://accounts.google.com/.well-known/openid-configuration');
    if (response.ok) {
      console.log('✅ Successfully connected to Google\'s OAuth discovery endpoint');
    } else {
      console.error(`❌ Failed to connect to Google's OAuth discovery endpoint: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`❌ Error connecting to Google's OAuth discovery endpoint: ${error.message}`);
  }
}

// Check NextAuth endpoints
async function checkNextAuthEndpoints() {
  console.log('\n5. Testing NextAuth Endpoints...');
  
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  // Check session endpoint
  try {
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`);
    
    if (sessionResponse.ok) {
      console.log('✅ NextAuth session endpoint is responding properly');
    } else {
      console.error(`❌ NextAuth session endpoint returned error: ${sessionResponse.status} ${sessionResponse.statusText}`);
    }
  } catch (error) {
    console.error(`❌ Error connecting to NextAuth session endpoint: ${error.message}`);
  }
  
  // Check providers endpoint
  try {
    const providersResponse = await fetch(`${baseUrl}/api/auth/providers`);
    
    if (providersResponse.ok) {
      console.log('✅ NextAuth providers endpoint is responding properly');
      
      const data = await providersResponse.json();
      const providers = Object.keys(data);
      
      if (providers.includes('google')) {
        console.log('✅ Google provider is properly configured in NextAuth');
      } else {
        console.error('❌ Google provider is missing from NextAuth configuration');
      }
    } else {
      console.error(`❌ NextAuth providers endpoint returned error: ${providersResponse.status} ${providersResponse.statusText}`);
    }
  } catch (error) {
    console.error(`❌ Error connecting to NextAuth providers endpoint: ${error.message}`);
  }
}

// Main function to run all checks
async function main() {
  console.log('🔍 API and CORS Connectivity Check\n');
  
  // Load environment variables from .env.local
  console.log('1. Loading environment variables from .env.local...');
  if (!loadEnvFile()) {
    console.error('   Unable to load environment variables. Please check your .env.local file.');
    return;
  }
  console.log('✅ Environment variables loaded successfully');
  
  // Check if required environment variables are set
  console.log('\n2. Checking required environment variables...');
  if (!checkRequiredEnvVars()) {
    console.error('   Please set all required environment variables and try again.');
    return;
  }
  console.log('✅ All required environment variables are set');
  
  // Check API connectivity
  console.log('\n3. Testing API connectivity...');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (!apiUrl) {
    console.error('❌ NEXT_PUBLIC_API_URL is not set');
    return;
  }
  
  console.log(`   Attempting to connect to API at: ${apiUrl}`);
  
  try {
    // First try with a simple OPTIONS request (preflight)
    const optionsResponse = await fetch(apiUrl, {
      method: 'OPTIONS',
      headers: {
        'Origin': process.env.NEXTAUTH_URL || 'http://localhost:3000'
      }
    });
    
    console.log(`   OPTIONS request status: ${optionsResponse.status} ${optionsResponse.statusText}`);
    
    // Check CORS headers
    const corsHeader = optionsResponse.headers.get('access-control-allow-origin');
    if (corsHeader) {
      console.log(`✅ CORS is properly configured. Access-Control-Allow-Origin: ${corsHeader}`);
    } else {
      console.error('⚠️ No CORS headers detected in the response');
    }
    
    // Now try with an actual GET request
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Origin': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   GET request status: ${response.status} ${response.statusText}`);
    
    if (response.status === 401) {
      console.log('✅ API responded with 401 (Unauthorized), which is expected if authentication is required');
      console.log('   This confirms the API is reachable, but you need to authenticate to access resources');
    } else if (response.ok) {
      console.log('✅ Successfully connected to the API');
      
      try {
        const data = await response.json();
        console.log('   API response:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
      } catch (error) {
        console.log('   API returned a non-JSON response');
      }
    } else {
      console.error(`❌ API returned an error status: ${response.status} ${response.statusText}`);
      console.error('   This might be expected if authentication is required or the endpoint is protected');
    }
  } catch (error) {
    console.error(`❌ Failed to connect to API: ${error.message}`);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('   Make sure your API server is running and accessible');
    } else if (error.message.includes('CERT')) {
      console.error('   There appears to be an SSL/TLS certificate issue with your API');
    }
  }
  
  // Check Google OAuth configuration
  await checkGoogleOAuth();
  
  // Check NextAuth endpoints
  await checkNextAuthEndpoints();
  
  console.log('\n✅ Check completed');
}

// Run the main function
main().catch(error => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
});
