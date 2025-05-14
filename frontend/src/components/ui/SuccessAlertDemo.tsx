"use client";

import React, { useState } from 'react';
import SuccessAlert from './SuccessAlert';

export default function SuccessAlertDemo() {
  const [showSuccess, setShowSuccess] = useState(false);
  
  const handleButtonClick = () => {
    setShowSuccess(true);
  };
  
  const handleAlertComplete = () => {
    setShowSuccess(false);
    // You can perform additional actions after the alert disappears
    console.log('Success alert dismissed');
  };
  
  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h2 className="text-xl font-bold mb-4">Success Alert Demo</h2>
      
      <button
        onClick={handleButtonClick}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
      >
        Show Success Alert
      </button>
      
      <SuccessAlert 
        visible={showSuccess}
        message="Your action was completed successfully!"
        onComplete={handleAlertComplete}
        autoHideDuration={5000} // 5 seconds
      />
      
      <p className="text-sm text-gray-600 mt-4">
        Click the button above to see the success alert in action.
        It will automatically dismiss after 5 seconds.
      </p>
    </div>
  );
}
