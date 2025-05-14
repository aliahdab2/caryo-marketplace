"use client";

import React, { useState } from 'react';
import SimpleSuccessAlert from '@/components/ui/alerts/SimpleSuccessAlert';

export default function SimpleSuccessAlertTest() {
  const [showAlert, setShowAlert] = useState(false);
  
  const handleShowAlert = () => {
    setShowAlert(true);
  };
  
  const handleAlertComplete = () => {
    setShowAlert(false);
  };
  
  return (
    <div className="container mx-auto max-w-3xl py-10">
      <h1 className="text-2xl font-bold mb-6 text-center">Simple Success Alert Test</h1>
      
      <div className="flex justify-center mb-8">
        <button
          onClick={handleShowAlert}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Show Success Alert
        </button>
      </div>
      
      {showAlert && (
        <SimpleSuccessAlert
          visible={showAlert}
          onComplete={handleAlertComplete}
          autoHideDuration={3000}
          message="Success!"
        />
      )}
      
      <div className="mt-8 text-gray-600 dark:text-gray-400">
        <p className="text-center">
          This is a simple success alert that closely matches the example provided.
        </p>
      </div>
    </div>
  );
}
