"use client";

import React from 'react';
import SuccessAlertDemo from '@/components/ui/alerts/SuccessAlertDemo';

export default function SuccessAlertTestPage() {
  return (
    <div className="container mx-auto max-w-3xl py-10">
      <h1 className="text-2xl font-bold mb-6 text-center">Success Alert Component Test</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <SuccessAlertDemo />
      </div>
      
      <div className="mt-8 text-gray-600 dark:text-gray-400 text-sm">
        <h2 className="text-lg font-semibold mb-2">How to Use This Component</h2>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto">
          {`import SuccessAlert from '@/components/ui/alerts/SuccessAlert';

// In your component:
const [showSuccess, setShowSuccess] = useState(false);

// Show the alert
setShowSuccess(true);

// In your JSX:
<SuccessAlert 
  visible={showSuccess}
  message="Your action was completed successfully!"
  onComplete={() => setShowSuccess(false)}
  autoHideDuration={3000} // 3 seconds
/>`}
        </pre>
      </div>
    </div>
  );
}
