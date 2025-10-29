import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchCarListingPublic } from '@/services/publicApi';
import ListingDetailClient from './ListingDetailClient';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { id } = await params;
    const listing = await fetchCarListingPublic(Number(id));

    if (!listing) {
      return {
        title: 'Listing Not Found | Caryo Marketplace',
        description: 'The car listing you are looking for could not be found.',
      };
    }

    const title = `${listing.title} | Caryo Marketplace`;
    const description = `${listing.description || listing.title} - ${listing.brandNameEn} ${listing.modelNameEn} ${listing.modelYear} for sale in ${listing.governorateNameEn}. Contact seller for more details.`;
    const images = listing.media?.length > 0 ? [listing.media[0].url] : [];

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images,
      },
    };
  } catch (error) {
    console.error('Error generating metadata for listing:', error);
    return {
      title: 'Listing | Caryo Marketplace',
      description: 'View car listing details on Caryo Marketplace',
    };
  }
}

export default async function ListingDetailPage({ params }: PageProps) {
  try {
    const { id } = await params;
    const listing = await fetchCarListingPublic(Number(id));

    if (!listing) {
      notFound();
    }

    return (
      <ListingDetailClient initialListing={listing} />
    );
  } catch (error) {
    console.error('Error fetching listing:', error);
    notFound();
  }
}
