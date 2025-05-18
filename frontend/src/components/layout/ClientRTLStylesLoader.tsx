"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * ClientRTLStylesLoader - A client component that conditionally loads RTL styles
 * This helps optimize bundle size by only loading RTL styles when needed
 */
export default function ClientRTLStylesLoader() {
  const pathname = usePathname();
  const [isRTL, setIsRTL] = useState(false);

  // First effect detects RTL setting
  useEffect(() => {
    // Check if the document direction is RTL
    const dir = document.documentElement.dir;
    setIsRTL(dir === "rtl");
  }, [pathname]); // Re-run when pathname changes to handle language switches
  
  // Second effect handles the stylesheet
  useEffect(() => {
    // Only proceed in RTL mode
    if (!isRTL) return;

    // Add RTL stylesheet dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/rtl-specific.css';
    link.setAttribute('data-testid', 'rtl-stylesheet');
    document.head.appendChild(link);
    
    // Cleanup function
    return () => {
      const linkElem = document.querySelector('link[data-testid="rtl-stylesheet"]');
      if (linkElem) linkElem.remove();
    };
  }, [isRTL]);
  
  return null;
}
