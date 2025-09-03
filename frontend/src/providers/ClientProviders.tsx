"use client";

import { ReactNode } from 'react';
import QueryProvider from '@/providers/QueryProvider';
import { SessionProvider } from 'next-auth/react';

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <QueryProvider>
      <SessionProvider
        refetchInterval={5 * 60} // 5 minutes
        refetchOnWindowFocus={false}
        refetchWhenOffline={false}
        basePath="/api/auth"
      >
        {children}
      </SessionProvider>
    </QueryProvider>
  );
}
