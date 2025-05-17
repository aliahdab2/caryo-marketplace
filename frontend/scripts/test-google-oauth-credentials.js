#!/usr/bin/env node

/**
 * Google OAuth Credentials Test Script
 * 
 * This script verifies that your Google OAuth credentials are valid and properly configured.
 * It tests basic connectivity to Google's OAuth endpoints and validates credential format.
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

// Check if Google OAuth credentials are set and valid
async function validateGoogleCredentials() {
  console.log('Validating Google OAuth credentials...\n');
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  if (!clientId) {
    console.error('❌ GOOGLE_CLIENT_ID is not set in your .env.local file');
    return false;
  }
  
  if (!clientSecret) {
    console.error('❌ GOOGLE_CLIENT_SECRET is not set in your .env.local file');
    return false;
  }
  
  // Validate client ID format
  console.log('Checking client ID format...');
  if (!clientId.match(/^\d+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com$/)) {
    console.error('⚠️ GOOGLE_CLIENT_ID doesn\'t match the expected format');
    console.error(`   Current value: ${clientId}`);
    console.error('   Expected format: <numbers>-<alphanumeric>.apps.googleusercontent.com');
  } else {
    console.log('✅ GOOGLE_CLIENT_ID format is valid');
  }
  
  // Validate client secret format
  console.log('\nChecking client secret format...');
  if (clientSecret === 'your-google-client-secret' || 
      clientSecret.includes('placeholder')) {
    console.error('❌ GOOGLE_CLIENT_SECRET appears to be a placeholder');
    console.error('   Please replace it with your actual client secret from Google Cloud Console');
    return false;
  }
  
  if (!clientSecret.match(/^GOCSPX-[a-zA-Z0-9]+$/)) {
    console.error('⚠️ GOOGLE_CLIENT_SECRET doesn\'t match the expected format');
    console.error('   Most Google client secrets start with GOCSPX-');
  } else {
    console.log('✅ GOOGLE_CLIENT_SECRET format is valid');
  }
  
  // Check Google OAuth discovery endpoint
  console.log('\nChecking connectivity to Google OAuth servers...');
  try {
    const response = await fetch('https://accounts.google.com/.well-known/openid-configuration');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Successfully connected to Google OAuth discovery endpoint');
      
      // Verify that we have necessary endpoints
      if (data.authorization_endpoint && data.token_endpoint) {
        console.log('✅ Google OAuth endpoints are available:');
        console.log(`   - Authorization: ${data.authorization_endpoint}`);
        console.log(`   - Token: ${data.token_endpoint}`);
      }
    } else {
      console.error(`❌ Failed to connect to Google OAuth discovery endpoint: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Network error when connecting to Google services:', error.message);
    return false;
  }
  
  // Check configured redirect URI
  console.log('\nChecking redirect URI configuration...');
  console.log(`Your NextAuth URL is: ${redirectUri}`);
  console.log('Make sure this exact URL (including http/https) is in your Google Cloud Console Authorized redirect URIs');
  console.log(`Specifically: ${redirectUri}/api/auth/callback/google`);
  
  return true;
}

async function main() {
  console.log('🔍 Google OAuth Credentials Test Tool\n');
  
  // Load environment variables
  console.log('Loading environment variables...');
  const loaded = loadEnvFile();
  if (!loaded) {
    console.error('Failed to load environment variables. Make sure .env.local exists.');
    process.exit(1);
  }
  
  // Validate Google credentials
  const valid = await validateGoogleCredentials();
  
  console.log('\n🔍 Summary:');
  if (valid) {
    console.log('✅ Google OAuth credentials appear to be correctly formatted');
    console.log('✅ Connection to Google OAuth servers is working');
    console.log('\nNext steps:');
    console.log('1. Ensure your redirect URI is configured in Google Cloud Console');
    console.log('2. If still having issues, check console for specific error messages when attempting login');
    console.log('3. Run the restart-dev.sh script to restart your Next.js server');
  } else {
    console.log('❌ Issues detected with Google OAuth credentials');
    console.log('\nTroubleshooting steps:');
    console.log('1. Check your .env.local file for correct GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
    console.log('2. Verify credentials in Google Cloud Console (https://console.cloud.google.com)');
    console.log('3. Ensure the OAuth2 API is enabled for your project');
    console.log('4. Check that your redirect URI is correctly configured');
    console.log('5. Run the restart-dev.sh script after making changes');
  }
}

main().catch(error => {
  console.error('\n❌ Unhandled error:', error);
  process.exit(1);
});
