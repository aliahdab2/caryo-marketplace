import DealerProfileClient from './DealerProfileClient';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DealerProfilePage({ params }: PageProps) {
  const { id } = await params;
  return <DealerProfileClient dealerId={Number(id)} />;
}
