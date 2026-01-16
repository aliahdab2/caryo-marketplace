import { redirect } from 'next/navigation';

/**
 * Dashboard Root Page
 * Redirects to the appropriate dashboard based on user role
 * For now, redirects all users to dealer dashboard
 * 
 * Future: Add role-based routing logic here
 * - Dealers -> /dashboard/dealer
 * - Buyers -> /dashboard/buyer (when created)
 * - Admins -> /dashboard/admin
 */
export default function DashboardPage() {
  // For now, redirect to dealer dashboard
  // TODO: Add role-based routing when buyer dashboard is implemented
  redirect('/dashboard/dealer');
}
