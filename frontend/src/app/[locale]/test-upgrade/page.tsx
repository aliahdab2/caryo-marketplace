'use client';

import React, { useState } from 'react';
import UpgradeModal from '@/components/dealer/UpgradeModal';

export default function TestUpgradePage() {
  const [isOpen, setIsOpen] = useState(true);

  const handleSelectPayment = (tierId: string, paymentMethod: string) => {
    console.log('Selected:', { tierId, paymentMethod });
    alert(`Selected: ${tierId} with ${paymentMethod}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Upgrade Modal Test Page</h1>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Open Upgrade Modal
        </button>
        
        <UpgradeModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSelectPayment={handleSelectPayment}
          currentTier="trial"
        />
      </div>
    </div>
  );
}
