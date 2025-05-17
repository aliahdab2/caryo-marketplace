#!/usr/bin/env node

// Test script to verify Google OAuth credentials
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
    if (!line || line.startsWith('#')) return;
    
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      // Remove surrounding quotes if they exist
      let value = match[2] || '';
      value = value.replace(/^(['"])(.*)(\1)$/, '$2');
      
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
  
  return true;
}

// Main function
async function main() {
  console.log('🔍 Testing Google OAuth Credentials\n');
  
  // Load environment variables
  console.log('Loading environment variables...');
  if (!loadEnvFile()) {
    process.exit(1);
  }
  
  // Check for required environment variables
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId) {
    console.error('❌ GOOGLE_CLIENT_ID not found in .env.local');
    process.exit(1);
  }
  
  if (!clientSecret) {
    console.error('❌ GOOGLE_CLIENT_SECRET not found in .env.local');
    process.exit(1);
  }
  
  console.log('✅ Found both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
  console.log(`   Client ID: ${clientId.substring(0, 8)}...${clientId.substring(clientId.length - 5)}`);
  console.log(`   Client Secret: ${clientSecret.substring(0, 8)}...${clientSecret.substring(clientSecret.length - 5)}`);
  
  // Validate credentials by making a request to Google's OAuth token endpoint
  console.log('\nValidating credentials with Google...');
  
  // Create form data for token endpoint
  const data = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code: 'invalid_code', // We expect this to fail with invalid_grant, not invalid_client
    redirect_uri: 'http://localhost:3000/api/auth/callback/google'
  }).toString();
  
  // Make request to Google's token endpoint
  const options = {
    hostname: 'oauth2.googleapis.com',
    port: 443,
    path: '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  
  const req = https.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(responseData);
        
        // Check for response errors
        if (response.error === 'invalid_client') {
          console.error('❌ Invalid client credentials. The client_id and/or client_secret are incorrect.');
          console.error('   Error details:', response.error_description || response.error);
          
          // Check common issues
          console.log('\n🔍 Common causes:');
          console.log('  1. Incorrect client ID or secret in .env.local file');
          console.log('  2. The OAuth client hasn\'t been properly configured in Google Cloud Console');
          console.log('  3. The OAuth client is disabled in Google Cloud Console');
          console.log('  4. The redirect URI hasn\'t been authorized in Google Cloud Console');
          
          console.log('\n🛠️ Solution:');
          console.log('  1. Verify your client credentials in Google Cloud Console');
          console.log('  2. Ensure the OAuth client is enabled');
          console.log('  3. Add http://localhost:3000/api/auth/callback/google as an authorized redirect URI');
          process.exit(1);
        } 
        else if (response.error === 'invalid_grant') {
          console.log('✅ Client credentials appear valid! (We got "invalid_grant" which is expected since we used a fake code)');
          console.log('   This means your client_id and client_secret are correctly configured.');
          
          console.log('\n🚀 Next steps:');
          console.log('  1. Make sure http://localhost:3000/api/auth/callback/google is added as an');
          console.log('     Authorized redirect URI in your Google Cloud Console OAuth client settings');
          console.log('  2. Check that the domain with your OAuth client is verified (if applicable)');
          console.log('  3. Restart your Next.js development server to ensure it loads the latest env vars');
        }
        else {
          console.log('⚠️ Unexpected response:', response);
          console.log('   This requires further investigation.');
        }
      } catch (error) {
        console.error('❌ Error parsing response:', error);
        console.error('Response:', responseData);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Network error:', error);
  });
  
  req.write(data);
  req.end();
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
