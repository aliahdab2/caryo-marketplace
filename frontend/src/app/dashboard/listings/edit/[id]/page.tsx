/* eslint-disable @typescript-eslint/no-explicit-any */
import ClientPage from './client-page';

// Using 'any' type here to bypass the Next.js App Router type issue
// This is a temporary workaround until a better solution is found
export default async function Page({ params }: any) {
  const { id } = await params;
  return <ClientPage id={id} />;
}

// Separate metadata function also using 'any'
export async function generateMetadata({ params }: any) {
  const { id } = await params;
  return {
    title: `Edit Listing ${id}`,
  };
}
