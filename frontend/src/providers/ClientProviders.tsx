"use client";

import { ReactNode } from 'react';
import QueryProvider from '@/providers/QueryProvider';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';

interface ClientProvidersProps {
  children: ReactNode;
  session?: Session | null;
}

export default function ClientProviders({ children, session }: ClientProvidersProps) {
  return (
    <QueryProvider>
      <SessionProvider
        session={session}
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
