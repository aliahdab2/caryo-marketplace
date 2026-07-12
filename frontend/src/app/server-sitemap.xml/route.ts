import { getServerSideSitemap, ISitemapField } from 'next-sitemap';
import { fetchCarListingsPublic } from '@/services/publicApi';
import { locales } from '@/app/i18n/config';

const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const PAGE_SIZE = 100;
// Caps the crawl at 5,000 listings per request to bound backend load;
// raise together with PAGE_SIZE if the marketplace outgrows it
const MAX_PAGES = 50;

export const dynamic = 'force-dynamic';

export async function GET() {
  const fields: ISitemapField[] = [];

  try {
    let page = 0;
    let last = false;

    while (!last && page < MAX_PAGES) {
      const result = await fetchCarListingsPublic({
        page,
        size: PAGE_SIZE,
        sort: 'createdAt,desc',
      });

      for (const listing of result.content) {
        const created = new Date(listing.createdAt);
        const lastmod = Number.isNaN(created.getTime())
          ? undefined
          : created.toISOString();

        for (const locale of locales) {
          fields.push({
            loc: `${SITE_URL}/${locale}/listings/${listing.id}`,
            lastmod,
            changefreq: 'daily',
            priority: 0.8,
          });
        }
      }

      last = result.last;
      page += 1;
    }
  } catch (error) {
    console.error('Error generating server sitemap:', error);
  }

  return getServerSideSitemap(fields);
}
