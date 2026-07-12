import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchCarListingPublic } from '@/services/publicApi';
import { generateVehicleSchema } from '@/utils/structuredData';
import { getResizedImageUrl } from '@/utils/imgproxy';
import ListingDetailClient from './ListingDetailClient';

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

const SCHEMA_CURRENCIES = ['SYP', 'USD', 'EUR'] as const;
type SchemaCurrency = (typeof SCHEMA_CURRENCIES)[number];

function toSchemaCurrency(value?: string): SchemaCurrency | undefined {
  return SCHEMA_CURRENCIES.includes(value as SchemaCurrency)
    ? (value as SchemaCurrency)
    : undefined;
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
    const { locale, id } = await params;
    const listing = await fetchCarListingPublic(Number(id));

    if (!listing) {
      notFound();
    }

    const vehicleSchema = generateVehicleSchema(listing, `/${locale}/listings/${id}`, {
      currency: toSchemaCurrency(listing.currency),
    });

    // Media URLs from the API are storage file keys; resolve them through
    // imgproxy so the schema carries real, crawlable image URLs
    const schemaImages = (listing.media ?? [])
      .filter((media) => media.mediaType !== 'video' && media.url)
      .map((media) => getResizedImageUrl(media.url, 1200))
      .filter((url) => url.startsWith('http'));
    vehicleSchema.image = schemaImages.length > 0 ? schemaImages : undefined;

    return (
      <>
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleSchema) }}
        />
        <ListingDetailClient initialListing={listing} />
      </>
    );
  } catch (error) {
    console.error('Error fetching listing:', error);
    notFound();
  }
}
