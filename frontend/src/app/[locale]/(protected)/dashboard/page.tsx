"use client";

// Force dynamic rendering for protected pages
export const dynamic = 'force-dynamic';

// Import the new enhanced dealer dashboard
import DealerDashboard from '@/components/dealer/DealerDashboard';

export default function Dashboard() {
  return <DealerDashboard />;
}