import { Metadata } from 'next';
import ClientPage from './client-page';

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ClientPage id={id} />;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Edit Listing ${id}`,
  };
}
