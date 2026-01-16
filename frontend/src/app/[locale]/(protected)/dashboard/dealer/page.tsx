"use client";

// Force dynamic rendering for protected pages
export const dynamic = 'force-dynamic';

// Import the dealer dashboard component
import DealerDashboard from '@/components/dealer/DealerDashboard';

/**
 * Dealer Overview Page
 * Shows dealer analytics, stats, and quick actions
 * This is the main landing page for dealers in the dashboard
 */
export default function DealerOverviewPage() {
  return <DealerDashboard />;
}
