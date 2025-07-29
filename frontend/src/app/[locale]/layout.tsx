import { ReactNode } from 'react';

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
    </>
  );
} 