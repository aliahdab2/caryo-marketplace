import { notFound } from 'next/navigation';
import { getPublicDealerProfile } from '@/services/publicDealerApi';
import { isApiError } from '@/lib/errors';
import DealerProfileClient from './DealerProfileClient';
import type { Metadata } from 'next';
import type { PublicDealerProfile } from '@/types/dealer';

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

/**
 * Generate JSON-LD structured data for the dealer profile
 * 
 * This follows Schema.org AutoDealer specification for better SEO:
 * @see https://schema.org/AutoDealer
 */
function generateDealerJsonLd(dealer: PublicDealerProfile, locale: string) {
  // Day abbreviation mapping for Schema.org
  const dayAbbrevMap: Record<string, string> = {
    monday: 'Mo',
    tuesday: 'Tu', 
    wednesday: 'We',
    thursday: 'Th',
    friday: 'Fr',
    saturday: 'Sa',
    sunday: 'Su',
  };

  // Parse working hours if available
  // Format can be: { "monday": "9:00 AM - 6:00 PM", "sunday": "Closed" }
  let openingHours: string[] | undefined;
  if (dealer.workingHours) {
    try {
      const hours = JSON.parse(dealer.workingHours) as Record<string, string>;
      openingHours = Object.entries(hours)
        .filter(([, value]) => value && value.toLowerCase() !== 'closed')
        .map(([day, value]) => {
          const abbrev = dayAbbrevMap[day.toLowerCase()] || day.slice(0, 2);
          // Convert "9:00 AM - 6:00 PM" to "09:00-18:00" format for Schema.org
          return `${abbrev} ${value}`;
        });
    } catch {
      // Invalid JSON, skip working hours
    }
  }

  // Parse social links if available
  let sameAs: string[] | undefined;
  if (dealer.socialLinks) {
    try {
      const social = JSON.parse(dealer.socialLinks) as Record<string, string>;
      sameAs = Object.values(social).filter(Boolean);
    } catch {
      // Invalid JSON, skip social links
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    '@id': `https://caryo.com/${locale}/dealers/${dealer.id}`,
    name: dealer.businessName,
    description: locale === 'ar' && dealer.descriptionAr ? dealer.descriptionAr : dealer.description,
    telephone: dealer.businessPhone,
    address: dealer.tradingAddress ? {
      '@type': 'PostalAddress',
      streetAddress: dealer.tradingAddress,
    } : undefined,
    image: dealer.logoUrl,
    logo: dealer.logoUrl,
    ...(openingHours?.length ? { openingHours } : {}),
    ...(sameAs?.length ? { sameAs } : {}),
    ...(dealer.stats ? {
      makesOffer: {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Vehicle',
        },
        availableAtOrFrom: {
          '@type': 'Place',
          name: dealer.businessName,
        },
      },
      aggregateRating: dealer.stats.soldCount > 0 ? {
        '@type': 'AggregateOffer',
        offerCount: dealer.stats.activeListings,
      } : undefined,
    } : {}),
  };
}

/**
 * Generate metadata for the dealer profile page
 * This enables SEO-friendly dealer pages
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const dealerId = Number(id);

  if (isNaN(dealerId)) {
    return {
      title: 'Dealer Not Found',
    };
  }

  try {
    const dealer = await getPublicDealerProfile(dealerId);
    return {
      title: `${dealer.businessName} - Caryo Marketplace`,
      description: dealer.description || `View listings from ${dealer.businessName}`,
      openGraph: {
        title: dealer.businessName,
        description: dealer.description || `View listings from ${dealer.businessName}`,
        images: dealer.logoUrl ? [dealer.logoUrl] : undefined,
      },
    };
  } catch {
    return {
      title: 'Dealer Not Found',
    };
  }
}

/**
 * Dealer Profile Page - Server Component
 * 
 * This follows Next.js App Router best practices:
 * 1. Server-side data fetching for SEO and performance
 * 2. Proper 404 handling with notFound()
 * 3. Typed error handling with ApiError
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/not-found
 */
export default async function DealerProfilePage({ params }: PageProps) {
  const { id, locale } = await params;
  const dealerId = Number(id);

  // Validate dealer ID
  if (isNaN(dealerId) || dealerId <= 0) {
    notFound();
  }

  try {
    // Fetch dealer profile on the server for better SEO and faster initial load
    const dealer = await getPublicDealerProfile(dealerId);
    
    // Generate structured data for SEO
    const jsonLd = generateDealerJsonLd(dealer, locale);
    
    // Pass the pre-fetched dealer data to the client component
    return (
      <>
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <DealerProfileClient dealerId={dealerId} initialProfile={dealer} />
      </>
    );
  } catch (error) {
    // Handle 404 errors with Next.js's built-in not-found page
    if (isApiError(error) && error.isNotFound()) {
      notFound();
    }
    
    // For other errors, let them bubble up to the error boundary
    throw error;
  }
}
