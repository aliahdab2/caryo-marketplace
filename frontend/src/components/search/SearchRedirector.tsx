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
 * Helper function to check if a segment is a valid year
 */
function isValidYear(segment: string): boolean {
  const year = parseInt(segment);
  return !isNaN(year) && year >= 1990 && year <= new Date().getFullYear() + 1;
}

/**
 * Helper function to check if a segment is a condition filter
 */
function isConditionFilter(segment: string): boolean {
  return ['new', 'used', 'certified'].includes(segment.toLowerCase());
}

/**
 * Helper function to check if a segment is a price filter
 */
function isPriceFilter(segment: string): boolean {
  return segment.startsWith('under-') || segment.startsWith('over-') || segment.includes('-to-');
}

/**
 * Helper function to parse price filters
 */
function parsePriceFilter(segment: string): { minPrice?: number; maxPrice?: number } {
  if (segment.startsWith('under-')) {
    const price = parseInt(segment.replace('under-', ''));
    return isNaN(price) ? {} : { maxPrice: price * 1000 }; // Convert to actual price
  }
  
  if (segment.startsWith('over-')) {
    const price = parseInt(segment.replace('over-', ''));
    return isNaN(price) ? {} : { minPrice: price * 1000 };
  }
  
  if (segment.includes('-to-')) {
    const [min, max] = segment.split('-to-').map(p => parseInt(p));
    const result: { minPrice?: number; maxPrice?: number } = {};
    if (!isNaN(min)) result.minPrice = min * 1000;
    if (!isNaN(max)) result.maxPrice = max * 1000;
    return result;
  }
  
  return {};
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
 * Helper function to check if a segment is a known location
 */
function isKnownLocation(segment: string): boolean {
  const knownLocations = new Set(['damascus', 'aleppo', 'homs', 'latakia', 'hama', 'raqqa', 'deir-ez-zor', 'hasaka', 'daraa', 'quneitra', 'idlib', 'as-suwayda', 'tartus', 'rif-dimashq']);
  return knownLocations.has(segment);
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
 * Enhanced URL Format: /cars/[year]/[condition]/model1-slug/model2-slug/[price-filter]/location1-location2
 * 
 * Supported patterns:
 * - Basic: /cars/toyota-camry/damascus
 * - With year: /cars/2024/toyota-camry/damascus
 * - With condition: /cars/new/toyota-camry/damascus
 * - With year + condition: /cars/2024/used/toyota-camry/damascus
 * - With price filter: /cars/toyota-camry/under-50k/damascus
 * - Full pattern: /cars/2024/used/toyota-camry/under-50k/damascus
 * - Multiple models: /cars/toyota-camry/honda-civic/damascus
 * - Multiple locations: /cars/toyota-camry/damascus-aleppo
 * 
 * Order matters:
 * 1. Year (optional, must be first): 1990-2025
 * 2. Condition (optional): new, used, certified
 * 3. Brand/Model segments: toyota-camry, bmw-x3, etc.
 * 4. Price filter (optional): under-50k, over-100k, 50k-to-100k
 * 5. Location segments: damascus, aleppo, etc.
 * 
 * Examples:
 * - /cars/toyota-camry/damascus → brand=toyota&model=toyota-camry&locations=damascus
 * - /cars/2024/toyota-camry/damascus → years=2024&brand=toyota&model=toyota-camry&locations=damascus
 * - /cars/new/toyota-camry/damascus → condition=new&brand=toyota&model=toyota-camry&locations=damascus
 * - /cars/toyota-camry/under-50k/damascus → brand=toyota&model=toyota-camry&maxPrice=50000&locations=damascus
 */
export default function SearchRedirector({ segments }: SearchRedirectorProps) {
  const router = useRouter();

  useEffect(() => {
    if (!segments || segments.length === 0) {
      // If no segments, redirect to search page without parameters
      router.replace('/search');
      return;
    }

    try {
      const sanitizedSegments = segments.map(sanitizeSegment);
      console.log('Processing segments:', sanitizedSegments);
      
      // Initialize search parameters
      const searchParams = new URLSearchParams();
      let segmentIndex = 0;
      
      // Check for year filter (must be first if present)
      if (segmentIndex < sanitizedSegments.length && isValidYear(sanitizedSegments[segmentIndex])) {
        const year = parseInt(sanitizedSegments[segmentIndex]);
        searchParams.set('years', year.toString());
        console.log('Found year filter:', year);
        segmentIndex++;
      }
      
      // Check for condition filter (new/used/certified)
      if (segmentIndex < sanitizedSegments.length && isConditionFilter(sanitizedSegments[segmentIndex])) {
        searchParams.set('condition', sanitizedSegments[segmentIndex]);
        console.log('Found condition filter:', sanitizedSegments[segmentIndex]);
        segmentIndex++;
      }
      
      // Collect brand/model segments until we hit a location or price filter
      const brandModelSegments: string[] = [];
      while (segmentIndex < sanitizedSegments.length) {
        const segment = sanitizedSegments[segmentIndex];
        
        // If it's a price filter, stop collecting brand/model segments
        if (isPriceFilter(segment)) {
          break;
        }
        
        // If it's a known location, stop collecting brand/model segments
        if (isKnownLocation(segment)) {
          break;
        }
        
        brandModelSegments.push(segment);
        segmentIndex++;
      }
      
      // Parse brand/model segments
      if (brandModelSegments.length > 0) {
        const { brands, models } = parseBrandModelSegments(brandModelSegments);
        
        // Add brands to search params
        brands.forEach(brand => {
          if (brand) searchParams.append('brand', brand);
        });
        
        // Add models to search params
        models.forEach(model => {
          if (model) searchParams.append('model', model);
        });
      }
      
      // Check for price filter
      if (segmentIndex < sanitizedSegments.length && isPriceFilter(sanitizedSegments[segmentIndex])) {
        const priceParams = parsePriceFilter(sanitizedSegments[segmentIndex]);
        if (priceParams.minPrice) searchParams.set('minPrice', priceParams.minPrice.toString());
        if (priceParams.maxPrice) searchParams.set('maxPrice', priceParams.maxPrice.toString());
        console.log('Found price filter:', priceParams);
        segmentIndex++;
      }
      
      // Process remaining segments as locations
      const locationSegments = sanitizedSegments.slice(segmentIndex);
      if (locationSegments.length > 0) {
        const allLocations: string[] = [];
        locationSegments.forEach(segment => {
          const locations = parseLocationSegment(segment);
          allLocations.push(...locations);
        });
        
        if (allLocations.length > 0) {
          searchParams.set('locations', allLocations.join('-'));
        }
      }
      
      // Build the redirect URL
      const redirectUrl = `/search${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      
      // Log for debugging (can be removed in production)
      console.log('Enhanced SEO URL parsing:', {
        originalSegments: segments,
        sanitizedSegments,
        redirectUrl,
        searchParams: Object.fromEntries(searchParams.entries())
      });
      
      // Redirect to search page with extracted parameters
      router.replace(redirectUrl);
      
    } catch (error) {
      console.error('Error parsing SEO URL segments:', error);
      // Fallback to basic search page
      router.replace('/search');
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
