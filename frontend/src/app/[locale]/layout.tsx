import { ReactNode } from 'react';
import { CacheDebugger } from '@/components/debug/CacheDebugger';

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default async function LocaleLayout({ children, params: _params }: LocaleLayoutProps) {
  return (
    <>
      {children}
      <CacheDebugger />
    </>
  );
} 