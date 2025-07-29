import SearchRedirector from '@/components/search/SearchRedirector';

interface PageProps {
  params: Promise<{
    params?: string[];
  }>;
}

/**
 * SEO-friendly car search URLs handler
 * 
 * This page handles URLs like:
 * - /cars/toyota-camry/damascus → brand=toyota&model=toyota-camry&locations=damascus
 * - /cars/honda-civic/toyota-camry/damascus-aleppo → brand=honda&brand=toyota&model=honda-civic&model=toyota-camry&locations=damascus-aleppo
 * - /cars/bmw-x3/damascus → brand=bmw&model=bmw-x3&locations=damascus
 * 
 * Format:
 * - Each segment before the last one is a complete model slug (e.g., "toyota-camry")
 * - The final segment contains hyphen-separated locations
 * - Redirects to /search with appropriate query parameters
 */
export default async function SEOCarsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const segments = resolvedParams.params || [];

  return <SearchRedirector segments={segments} />;
}

/**
 * Generate metadata for SEO-friendly URLs
 */
export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const segments = resolvedParams.params || [];
  
  if (segments.length === 0) {
    return {
      title: 'Search Cars - Caryo Marketplace',
      description: 'Find your perfect car on Caryo Marketplace',
    };
  }

  try {
    let title = 'Cars';
    let description = 'Find cars on Caryo Marketplace';
    
    if (segments.length === 1) {
      // Only locations
      const locations = segments[0].split('-').filter(loc => loc.trim());
      if (locations.length > 0) {
        const locationNames = locations.map(loc => 
          loc.charAt(0).toUpperCase() + loc.slice(1).replace(/-/g, ' ')
        ).join(', ');
        title = `Cars in ${locationNames} - Caryo Marketplace`;
        description = `Find cars for sale in ${locationNames} on Caryo Marketplace`;
      }
    } else {
      // Model segments + locations
      const modelSegments = segments.slice(0, -1);
      const locationSegment = segments[segments.length - 1];
      
      // Extract brands and models from model slugs
      const brands = new Set<string>();
      const models = new Set<string>();
      
      modelSegments.forEach(segment => {
        // Each segment is a complete model slug like "toyota-camry"
        models.add(segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '));
        
        // Extract brand from model slug (first part before first hyphen)
        const parts = segment.split('-');
        if (parts.length > 0 && parts[0]) {
          brands.add(parts[0].charAt(0).toUpperCase() + parts[0].slice(1));
        }
      });
      
      // Extract locations
      const locations = locationSegment.split('-').filter(loc => loc.trim())
        .map(loc => loc.charAt(0).toUpperCase() + loc.slice(1).replace(/-/g, ' '));
      
      // Build title
      const modelList = Array.from(models);
      const locationList = locations.join(', ');
      
      if (modelList.length > 0) {
        title = `${modelList.join(', ')} Cars`;
      } else {
        const brandList = Array.from(brands).join(', ');
        title = `${brandList} Cars`;
      }
      
      if (locationList) {
        title += ` in ${locationList}`;
      }
      
      title += ' - Caryo Marketplace';
      
      // Build description
      description = `Find ${modelList.length > 0 ? modelList.join(', ') : Array.from(brands).join(', ')} cars for sale`;
      if (locationList) {
        description += ` in ${locationList}`;
      }
      description += ' on Caryo Marketplace. Browse our selection of quality vehicles.';
    }
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
    };
  } catch (error) {
    console.error('Error generating SEO metadata:', error);
    return {
      title: 'Search Cars - Caryo Marketplace',
      description: 'Find your perfect car on Caryo Marketplace',
    };
  }
}
