"use client";

import { useState } from "react";

export default function NewListingPage() {
  const [currentStep, _setCurrentStep] = useState(1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1>Test Page</h1>
        <p>Current step: {currentStep}</p>
      </div>
    </div>
  );
}
