// Disable static generation for this page since it uses session data via MessagesPageComponent
export const dynamic = 'force-dynamic';

import MessagesPageComponent from '@/components/messaging/MessagesPage';

export default function MessagesPage() {
  return (
    <div className="-m-4 md:-m-8 -mb-20">
      <MessagesPageComponent />
    </div>
  );
}