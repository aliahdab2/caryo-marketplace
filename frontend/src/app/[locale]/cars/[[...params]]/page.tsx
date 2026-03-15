import { redirect } from 'next/navigation';
import SearchRedirector from '@/components/search/SearchRedirector';

interface PageProps {
  params: Promise<{
    params?: string[];
  }>;
  searchParams?: Promise<{
    page?: string;
    brand?: string;
    model?: string;
    location?: string;
    minYear?: string;
    maxYear?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }>;
}

/**
 * SEO-friendly car search URLs handler
 *
 * This page handles URLs like:
 * - /cars → Redirect to /search (unified experience)
 * - /cars/toyota-camry/damascus → brand=toyota&model=toyota-camry&locations=damascus
 * - /cars/2024/toyota-camry/damascus → years=2024&brand=toyota&model=toyota-camry&locations=damascus
 * - /cars/new/toyota-camry/damascus → condition=new&brand=toyota&model=toyota-camry&locations=damascus
 * - /cars/toyota-camry/under-50k/damascus → brand=toyota&model=toyota-camry&maxPrice=50000&locations=damascus
 *
 * Format:
 * - No params: Redirect to /search
 * - With params: Process SEO URL and redirect to search with filters
 */
export default async function CarsPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const segments = resolvedParams.params;

  // If no segments, redirect to search page for unified experience
  if (!segments || segments.length === 0) {
    const resolvedSearchParams = searchParams ? await searchParams : {};

    // Preserve any existing search parameters
    const searchParamsString = new URLSearchParams();
    Object.entries(resolvedSearchParams).forEach(([key, value]) => {
      if (value) {
        searchParamsString.append(key, value);
      }
    });

    const redirectUrl = `/search${searchParamsString.toString() ? `?${searchParamsString.toString()}` : ''}`;
    redirect(redirectUrl);
  }

  // If segments exist, handle SEO URL redirection
  return <SearchRedirector segments={segments} />;
}

// Generate metadata for SEO
export async function generateMetadata({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const segments = resolvedParams.params;

  // If no segments, it's a redirect to search page
  if (!segments || segments.length === 0) {
    const brand = resolvedSearchParams?.brand;
    const location = resolvedSearchParams?.location;

    let title = 'Search Cars for Sale in Syria';
    let description = 'Search and browse thousands of cars for sale across Syria. Find your perfect car from trusted sellers.';

    if (brand && location) {
      title = `${brand.charAt(0).toUpperCase() + brand.slice(1)} Cars in ${location.charAt(0).toUpperCase() + location.slice(1)} - Syria`;
      description = `Search ${brand} cars for sale in ${location}, Syria. Browse listings from verified sellers.`;
    } else if (brand) {
      title = `${brand.charAt(0).toUpperCase() + brand.slice(1)} Cars for Sale in Syria`;
      description = `Search ${brand} cars for sale across Syria. Find your perfect ${brand} from trusted sellers.`;
    } else if (location) {
      title = `Cars for Sale in ${location.charAt(0).toUpperCase() + location.slice(1)}, Syria`;
      description = `Search cars for sale in ${location}, Syria. Browse listings from local sellers.`;
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
  }

  // For SEO URLs, generate dynamic metadata
  return {
    title: `Search Cars - ${segments.join(' ')} | Caryo`,
    description: `Search cars matching ${segments.join(', ')} in Syria. Browse listings from verified sellers.`,
    openGraph: {
      title: `Search Cars - ${segments.join(' ')}`,
      description: `Search cars matching ${segments.join(', ')} in Syria.`,
      type: 'website',
    },
  };
}
