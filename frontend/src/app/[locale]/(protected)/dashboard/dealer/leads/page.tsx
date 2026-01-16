// Disable static generation for this page since it uses session data via MessagesPageComponent
export const dynamic = 'force-dynamic';

import MessagesPageComponent from '@/components/messaging/MessagesPage';

/**
 * Dealer Leads Page
 * Shows customer inquiries and messages (industry term: "leads")
 * This is the same messaging functionality but with dealer-appropriate terminology
 */
export default function LeadsPage() {
  return (
    <div className="-m-4 md:-m-8 -mb-20">
      <MessagesPageComponent />
    </div>
  );
}
