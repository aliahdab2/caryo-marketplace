import { CarListing } from '@/services/api';

// Base schema interface
interface BaseSchema {
  '@context': 'https://schema.org';
  '@type': string;
  [key: string]: unknown;
}

// Vehicle schema interface following Schema.org Vehicle specification
export interface VehicleSchema extends BaseSchema {
  '@type': 'Vehicle';
  name: string;
  description?: string;
  vehicleIdentificationNumber?: string;
  brand: {
    '@type': 'Brand';
    name: string;
  };
  model: string;
  vehicleModelDate: number;
  mileageFromOdometer?: {
    '@type': 'QuantitativeValue';
    value: number;
    unitCode: 'KMT'; // Kilometers
  };
  fuelType?: string;
  vehicleTransmission?: string;
  bodyType?: string;
  vehicleEngine?: {
    '@type': 'EngineSpecification';
    name: string;
    fuelType?: string;
  };
  offers: {
    '@type': 'Offer';
    price: number;
    priceCurrency: 'SYP' | 'USD' | 'EUR';
    availability: 'https://schema.org/InStock' | 'https://schema.org/OutOfStock';
    url?: string;
    seller?: {
      '@type': 'Person' | 'Organization';
      name: string;
    };
  };
  image?: string[];
  url?: string;
  datePosted?: string;
  location?: {
    '@type': 'Place';
    name: string;
    address?: {
      '@type': 'PostalAddress';
      addressCountry: string;
      addressRegion?: string;
      addressLocality?: string;
    };
  };
}

// Organization schema interface
export interface OrganizationSchema extends BaseSchema {
  '@type': 'Organization';
  name: string;
  description: string;
  url: string;
  logo: string;
  contactPoint: {
    '@type': 'ContactPoint';
    telephone?: string;
    contactType: string;
    areaServed: string;
    availableLanguage: string[];
  };
  address?: {
    '@type': 'PostalAddress';
    addressCountry: string;
    addressRegion: string;
    addressLocality?: string;
  };
  sameAs?: string[];
  foundingDate?: string;
  numberOfEmployees?: string;
}

// Breadcrumb schema interface
export interface BreadcrumbSchema extends BaseSchema {
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

// Website schema interface
export interface WebSiteSchema extends BaseSchema {
  '@type': 'WebSite';
  name: string;
  description: string;
  url: string;
  potentialAction: {
    '@type': 'SearchAction';
    target: {
      '@type': 'EntryPoint';
      urlTemplate: string;
    };
    'query-input': string;
  };
}

// Constants for consistent schema generation
const SCHEMA_CONSTANTS = {
  CONTEXT: 'https://schema.org' as const,
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://caryo.sy',
  ORGANIZATION_NAME: 'Caryo Marketplace',
  DEFAULT_CURRENCY: 'SYP' as const,
  DEFAULT_COUNTRY: 'SY',
  DEFAULT_REGION: 'Damascus',
  SUPPORTED_LANGUAGES: ['Arabic', 'English'] as string[],
} as const;

/**
 * Generate Vehicle structured data for car listings with comprehensive Schema.org compliance
 */
export function generateVehicleSchema(
  listing: CarListing, 
  listingUrl: string,
  options: {
    includeLocation?: boolean;
    currency?: 'SYP' | 'USD' | 'EUR';
    baseUrl?: string;
  } = {}
): VehicleSchema {
  const { 
    includeLocation = true, 
    currency = SCHEMA_CONSTANTS.DEFAULT_CURRENCY,
    baseUrl = SCHEMA_CONSTANTS.BASE_URL 
  } = options;

  // Build the base schema
  const schema: VehicleSchema = {
    '@context': SCHEMA_CONSTANTS.CONTEXT,
    '@type': 'Vehicle',
    name: listing.title,
    description: listing.description || `${listing.brandNameEn} ${listing.modelNameEn} ${listing.modelYear}`,
    brand: {
      '@type': 'Brand',
      name: listing.brandNameEn || 'Unknown Brand'
    },
    model: listing.modelNameEn || 'Unknown Model',
    vehicleModelDate: listing.modelYear || new Date().getFullYear(),
    url: `${baseUrl}${listingUrl}`,
    datePosted: listing.createdAt,
    offers: {
      '@type': 'Offer',
      price: listing.price || 0,
      priceCurrency: currency,
      availability: listing.isSold 
        ? 'https://schema.org/OutOfStock' 
        : 'https://schema.org/InStock',
      url: `${baseUrl}${listingUrl}`
    }
  };

  // Add optional mileage information
  if (listing.mileage && listing.mileage > 0) {
    schema.mileageFromOdometer = {
      '@type': 'QuantitativeValue',
      value: listing.mileage,
      unitCode: 'KMT'
    };
  }

  // Add fuel type information
  if (listing.fuelType) {
    const fuelTypeDisplay = typeof listing.fuelType === 'object' ? listing.fuelType.displayNameEn : listing.fuelType;
    schema.fuelType = fuelTypeDisplay;
    
    // Add engine specification if fuel type is available
    schema.vehicleEngine = {
      '@type': 'EngineSpecification',
      name: `${fuelTypeDisplay} Engine`,
      fuelType: fuelTypeDisplay
    };
  }

  // Add transmission information
  if (listing.transmission) {
    const transmissionDisplay = typeof listing.transmission === 'object' ? listing.transmission.displayNameEn : listing.transmission;
    schema.vehicleTransmission = transmissionDisplay;
  }

  // Add seller information
  if (listing.sellerUsername) {
    schema.offers.seller = {
      '@type': 'Person',
      name: listing.sellerUsername
    };
  }

  // Add media/images
  if (listing.media && listing.media.length > 0) {
    schema.image = listing.media
      .filter(media => media.url) // Only include media with valid URLs
      .map(media => media.url);
  }

  // Add location information if requested
  if (includeLocation && listing.locationDetails) {
    schema.location = {
      '@type': 'Place',
      name: listing.locationDetails.displayNameEn,
      address: {
        '@type': 'PostalAddress',
        addressCountry: listing.locationDetails.countryCode || SCHEMA_CONSTANTS.DEFAULT_COUNTRY,
        addressRegion: listing.governorateNameEn || SCHEMA_CONSTANTS.DEFAULT_REGION,
        addressLocality: listing.locationDetails.displayNameEn
      }
    };
  }

  return schema;
}

/**
 * Generate Organization structured data for Caryo with enhanced business information
 */
export function generateOrganizationSchema(
  options: {
    includeFoundingDate?: boolean;
    includeSocialMedia?: boolean;
    customDescription?: string;
  } = {}
): OrganizationSchema {
  const { 
    includeFoundingDate = false, 
    includeSocialMedia = true,
    customDescription 
  } = options;

  const schema: OrganizationSchema = {
    '@context': SCHEMA_CONSTANTS.CONTEXT,
    '@type': 'Organization',
    name: SCHEMA_CONSTANTS.ORGANIZATION_NAME,
    description: customDescription || 'Leading automotive marketplace in Syria for buying and selling vehicles',
    url: SCHEMA_CONSTANTS.BASE_URL,
    logo: `${SCHEMA_CONSTANTS.BASE_URL}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      areaServed: SCHEMA_CONSTANTS.DEFAULT_COUNTRY,
      availableLanguage: SCHEMA_CONSTANTS.SUPPORTED_LANGUAGES
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: SCHEMA_CONSTANTS.DEFAULT_COUNTRY,
      addressRegion: SCHEMA_CONSTANTS.DEFAULT_REGION
    }
  };

  // Add optional founding date
  if (includeFoundingDate) {
    schema.foundingDate = '2024-01-01'; // Adjust to actual founding date
  }

  // Add social media profiles if requested
  if (includeSocialMedia) {
    schema.sameAs = [
      'https://www.facebook.com/caryomarketplace',
      'https://www.twitter.com/caryomarketplace',
      'https://www.instagram.com/caryomarketplace'
    ];
  }

  return schema;
}

/**
 * Generate Breadcrumb structured data with validation
 */
export function generateBreadcrumbSchema(
  breadcrumbs: Array<{ name: string; href: string }>,
  options: { baseUrl?: string } = {}
): BreadcrumbSchema {
  const { baseUrl = SCHEMA_CONSTANTS.BASE_URL } = options;

  // Validate breadcrumbs input
  if (!Array.isArray(breadcrumbs) || breadcrumbs.length === 0) {
    throw new Error('Breadcrumbs array cannot be empty');
  }

  // Validate each breadcrumb item
  breadcrumbs.forEach((crumb, index) => {
    if (!crumb.name || !crumb.href) {
      throw new Error(`Breadcrumb at index ${index} must have both name and href properties`);
    }
  });

  return {
    '@context': SCHEMA_CONSTANTS.CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.href.startsWith('http') ? crumb.href : `${baseUrl}${crumb.href}`
    }))
  };
}

/**
 * Generate WebSite structured data with search functionality
 */
export function generateWebSiteSchema(
  options: {
    searchUrlTemplate?: string;
    baseUrl?: string;
    customDescription?: string;
  } = {}
): WebSiteSchema {
  const { 
    searchUrlTemplate,
    baseUrl = SCHEMA_CONSTANTS.BASE_URL,
    customDescription 
  } = options;

  const defaultSearchTemplate = `${baseUrl}/search?q={search_term_string}`;

  return {
    '@context': SCHEMA_CONSTANTS.CONTEXT,
    '@type': 'WebSite',
    name: SCHEMA_CONSTANTS.ORGANIZATION_NAME,
    description: customDescription || 'Buy and sell cars in Syria - The leading automotive marketplace',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: searchUrlTemplate || defaultSearchTemplate
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

/**
 * Utility function to validate schema structure
 */
export function validateSchema(schema: Record<string, unknown>): boolean {
  try {
    // Basic validation - ensure required fields are present
    if (!schema['@context'] || !schema['@type']) {
      return false;
    }

    // Ensure it's valid JSON
    JSON.stringify(schema);
    
    return true;
  } catch (error) {
    console.error('Schema validation error:', error);
    return false;
  }
}

/**
 * Create a combined schema array for multiple structured data items
 */
export function combineSchemas(...schemas: Array<BaseSchema>): Array<BaseSchema> {
  return schemas.filter(schema => validateSchema(schema as Record<string, unknown>));
}
