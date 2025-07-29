/* eslint-disable @typescript-eslint/no-explicit-any */
import ClientPage from './client-page';

// Using 'any' type here to bypass the Next.js App Router type issue
// This is a temporary workaround until a better solution is found
export default function Page({ params }: any) {
  return <ClientPage id={params.id} />;
}

// Separate metadata function also using 'any'
export async function generateMetadata({ params }: any) {
  return {
    title: `Edit Listing ${params.id}`,
  };
}
