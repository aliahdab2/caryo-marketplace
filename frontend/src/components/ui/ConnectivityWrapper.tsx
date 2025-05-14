"use client";

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the connectivity status component
const ConnectivityStatus = dynamic(
  () => import("@/components/ui/ConnectivityStatus"),
  { ssr: false }
);

export default function ConnectivityWrapper() {
  // Use reactive mode that only checks when API requests are made
  return <ConnectivityStatus 
    checkInterval={0} // Disable regular interval checking completely
    autoHide={true} 
    reactive={true} 
  />;
}
