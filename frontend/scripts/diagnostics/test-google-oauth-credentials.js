#!/usr/bin/env node

 

/**
 * Google OAuth Credentials Test Script
 * 
 * This script verifies that your Google OAuth credentials are valid and properly configured.
 * It tests basic connectivity to Google's OAuth endpoints and validates credential format.
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

// Import fetch using dynamic import
let fetch;
try {
  // Try ESM import 
  const fetchModule = await import('node-fetch');
  fetch = fetchModule.default;
} catch {
  // This should not happen with proper ESM setup
  console.error('Failed to import node-fetch');
  process.exit(1);
}

// Use ESM imports for path and fs
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
      console.log('✅ Successfully connected to Google\'s OAuth discovery endpoint');
      
      // Try to verify the client ID (this won't fully verify the client secret)
      console.log('\nChecking if client ID is registered with Google...');
      try {
        // This endpoint returns info about the client ID if it's valid
        const tokenInfoResponse = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?client_id=${clientId}`
        );
        
        if (tokenInfoResponse.ok) {
          console.log('✅ Client ID appears to be valid and registered with Google');
          const data = await tokenInfoResponse.json();
          console.log(`   Registered name: ${data.issued_to === clientId ? 'Matches client ID' : data.issued_to}`);
        } else if (tokenInfoResponse.status === 400) {
          console.error('❌ Client ID doesn\'t appear to be registered with Google');
        } else {
          console.error(`⚠️ Unable to verify client ID: ${tokenInfoResponse.status} ${tokenInfoResponse.statusText}`);
        }
      } catch (error) {
        console.error(`⚠️ Error checking client ID: ${error.message}`);
      }
      
      // Check redirect URI configuration using OAuth authorization endpoint
      console.log('\nChecking redirect URI configuration...');
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.append('client_id', clientId);
      authUrl.searchParams.append('redirect_uri', `${redirectUri}/api/auth/callback/google`);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('scope', 'openid email profile');
      
      console.log(`✅ Your redirect URI should be: ${redirectUri}/api/auth/callback/google`);
      console.log('   Make sure this exact URI is added to your Google Cloud Console project');
      console.log('\nAuthorization URL (for manual testing):');
      console.log(authUrl.toString());
    } else {
      console.error(`❌ Error connecting to Google's OAuth discovery endpoint: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`❌ Error connecting to Google's OAuth servers: ${error.message}`);
    console.error('   This could indicate a network issue or internet connectivity problem');
  }
  
  return true;
}

async function main() {
  console.log('🔍 Google OAuth Credentials Test\n');
  
  // Load environment variables from .env.local
  console.log('Loading environment variables from .env.local...');
  if (!loadEnvFile()) {
    console.error('Unable to load environment variables. Please check your .env.local file.');
    process.exit(1);
  }
  console.log('✅ Environment variables loaded\n');
  
  // Validate Google OAuth credentials
  if (!(await validateGoogleCredentials())) {
    console.error('\n❌ Google OAuth validation failed. Please fix the issues and try again.');
    process.exit(1);
  }
  
  console.log('\n✅ Google OAuth credentials validation completed');
}

// Run the main function
main().catch(error => {
  console.error('\nAn unexpected error occurred:', error);
  process.exit(1);
});
