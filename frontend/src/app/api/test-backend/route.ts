// Test API endpoint to check if frontend can make external API calls
import { NextResponse } from 'next/server';

export async function GET() {
  console.log('[Test API] Testing backend connectivity from Next.js API route');
  
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const response = await fetch(`${backendUrl}/api/listings/filter`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('[Test API] Backend response status:', response.status);
    const data = await response.json();
    console.log('[Test API] Backend response data:', data.content?.length, 'listings');
    
    return NextResponse.json({ 
      success: true, 
      status: response.status,
      listingsCount: data.content?.length || 0,
      backendUrl
    });
  } catch (error) {
    console.error('[Test API] Error calling backend:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      backendUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    }, { status: 500 });
  }
}
