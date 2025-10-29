import Script from 'next/script';
import {
  VehicleSchema,
  OrganizationSchema,
  BreadcrumbSchema,
  WebSiteSchema
} from '@/utils/structuredData';

// Union type for all supported schema types
type StructuredDataType = VehicleSchema | OrganizationSchema | BreadcrumbSchema | WebSiteSchema;

interface StructuredDataProps {
  data: StructuredDataType;
  id?: string;
}

/**
 * Component to inject JSON-LD structured data into the page head
 * Optimized for performance and SEO best practices
 */
export default function StructuredData({
  data,
  id = 'structured-data'
}: StructuredDataProps) {
  // Validate data before rendering
  if (!data || !data['@context'] || !data['@type']) {
    console.warn('Invalid structured data provided to StructuredData component');
    return null;
  }

  // Use afterInteractive for all structured data to comply with Next.js requirements
  const strategy = 'afterInteractive';

  return (
    <Script
      id={id}
      type="application/ld+json"
      strategy={strategy}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 0) // Minified JSON for production
      }}
    />
  );
}

/**
 * Multiple structured data items component with optimized rendering
 */
interface MultipleStructuredDataProps {
  items: Array<{
    data: StructuredDataType;
    id: string;
    priority?: 'high' | 'low';
  }>;
}

export function MultipleStructuredData({ items }: MultipleStructuredDataProps) {
  // Filter out invalid items
  const validItems = items.filter(item =>
    item.data &&
    item.data['@context'] &&
    item.data['@type'] &&
    item.id
  );

  if (validItems.length === 0) {
    console.warn('No valid structured data items provided to MultipleStructuredData');
    return null;
  }

  return (
    <>
      {validItems.map((item) => (
        <StructuredData
          key={item.id}
          id={item.id}
          data={item.data}
        />
      ))}
    </>
  );
}

/**
 * Combined structured data component for pages that need multiple schemas
 * More efficient than multiple separate components
 */
interface CombinedStructuredDataProps {
  schemas: StructuredDataType[];
  id?: string;
}

export function CombinedStructuredData({
  schemas,
  id = 'combined-structured-data'
}: CombinedStructuredDataProps) {
  // Filter and validate schemas
  const validSchemas = schemas.filter(schema =>
    schema && schema['@context'] && schema['@type']
  );

  if (validSchemas.length === 0) {
    return null;
  }

  // For single schema, render directly; for multiple, render as array
  const jsonData = validSchemas.length === 1 ? validSchemas[0] : validSchemas;

  return (
    <Script
      id={id}
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonData, null, 0)
      }}
    />
  );
}
