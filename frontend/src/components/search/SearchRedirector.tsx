"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SearchRedirectorProps {
  segments: string[];
}

/**
 * Helper function to validate and sanitize URL segments
 */
function sanitizeSegment(segment: string): string {
  return segment.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
}

/**
 * Helper function to parse brand-model segments
 * For /cars/toyota-camry/damascus, we treat "toyota-camry" as a single model slug
 * For /cars/toyota-camry-corolla/damascus, we treat both "toyota-camry" and "toyota-corolla" as model slugs
 */
function parseBrandModelSegments(segments: string[]): { brands: string[], models: string[] } {
  const brands: string[] = [];
  const models: string[] = [];
  
  segments.forEach(segment => {
    const sanitizedSegment = sanitizeSegment(segment);
    
    if (sanitizedSegment) {
      // For now, treat each segment as a complete model slug (e.g., "toyota-camry")
      // The frontend search will handle the model slug and the backend will parse it
      models.push(sanitizedSegment);
      
      // Extract brand from the model slug (first part before first hyphen)
      const parts = sanitizedSegment.split('-');
      if (parts.length > 0 && parts[0]) {
        const brand = parts[0];
        if (!brands.includes(brand)) {
          brands.push(brand);
        }
      }
    }
  });
  
  return { brands, models };
}

/**
 * Helper function to parse location segments
 */
function parseLocationSegment(segment: string): string[] {
  return segment.split('-').filter(loc => loc.trim()).map(sanitizeSegment).filter(loc => loc);
}

/**
 * SearchRedirector component that handles SEO-friendly URLs and redirects to search
 * 
 * URL Format: /cars/model1-slug/model2-slug/location1-location2
 * Each segment before the last one is a complete model slug (e.g., "toyota-camry", "honda-civic")
 * The final segment contains hyphen-separated locations
 * 
 * Examples:
 * - /cars/toyota-camry/damascus → /search?brand=toyota&model=toyota-camry&locations=damascus
 * - /cars/toyota-camry/honda-civic/damascus-aleppo → /search?brand=toyota&brand=honda&model=toyota-camry&model=honda-civic&locations=damascus-aleppo
 * - /cars/bmw-x3/damascus → /search?brand=bmw&model=bmw-x3&locations=damascus
 */
export default function SearchRedirector({ segments }: SearchRedirectorProps) {
  const router = useRouter();

  useEffect(() => {
    if (!segments || segments.length === 0) {
      // If no segments, redirect to search page without parameters using replace: true equivalent
      router.replace('/search');
      return;
    }

    try {
      const searchParams = new URLSearchParams();
      
      // If there's only one segment, treat it as locations only
      if (segments.length === 1) {
        const locations = parseLocationSegment(segments[0]);
        if (locations.length > 0) {
          searchParams.set('locations', locations.join('-'));
        }
      } else {
        // Multiple segments - all but the last are brand-model combinations
        const brandModelSegments = segments.slice(0, -1);
        const locationSegment = segments[segments.length - 1];
        
        // Process brand-model segments
        const { brands, models } = parseBrandModelSegments(brandModelSegments);
        
        // Add brands to search params
        brands.forEach(brand => {
          if (brand) searchParams.append('brand', brand);
        });
        
        // Add models to search params
        models.forEach(model => {
          if (model) searchParams.append('model', model);
        });
        
        // Process location segment
        if (locationSegment) {
          const locations = parseLocationSegment(locationSegment);
          if (locations.length > 0) {
            searchParams.set('locations', locations.join('-'));
          }
        }
      }
      
      // Build the redirect URL
      const redirectUrl = `/search${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      
      // Log for debugging (can be removed in production)
      console.log('SEO URL parsing:', {
        originalSegments: segments,
        redirectUrl,
        searchParams: Object.fromEntries(searchParams.entries())
      });
      
      // Redirect to search page with extracted parameters using replace: true equivalent
      // This replaces the current history entry instead of adding a new one
      router.replace(redirectUrl);
      
    } catch (error) {
      console.error('Error parsing SEO URL segments:', error);
      // Fallback to basic search page
      router.replace('/search', { scroll: false });
    }
  }, [segments, router]);

  // Show a brief loading indicator while redirecting
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading search results...</p>
      </div>
    </div>
  );
}
