// Disable static generation for all protected pages since they require authentication
export const dynamic = 'force-dynamic';

import AuthGuard from '@/components/auth/AuthGuard';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}
