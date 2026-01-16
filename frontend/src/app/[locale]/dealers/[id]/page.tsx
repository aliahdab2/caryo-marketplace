import { notFound } from 'next/navigation';
import { getPublicDealerProfile } from '@/services/publicDealerApi';
import { isApiError } from '@/lib/errors';
import DealerProfileClient from './DealerProfileClient';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
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
  const { id } = await params;
  const dealerId = Number(id);

  // Validate dealer ID
  if (isNaN(dealerId) || dealerId <= 0) {
    notFound();
  }

  try {
    // Fetch dealer profile on the server for better SEO and faster initial load
    const dealer = await getPublicDealerProfile(dealerId);
    
    // Pass the pre-fetched dealer data to the client component
    return <DealerProfileClient dealerId={dealerId} initialProfile={dealer} />;
  } catch (error) {
    // Handle 404 errors with Next.js's built-in not-found page
    if (isApiError(error) && error.isNotFound()) {
      notFound();
    }
    
    // For other errors, let them bubble up to the error boundary
    throw error;
  }
}
