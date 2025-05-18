"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Head from 'next/head';

/**
 * ClientRTLStylesLoader - A client component that conditionally loads RTL styles
 * This helps optimize bundle size by only loading RTL styles when needed
 */
export default function ClientRTLStylesLoader() {
  const pathname = usePathname();
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    // Check if the document direction is RTL
    const dir = document.documentElement.dir;
    setIsRTL(dir === "rtl");
  }, [pathname]); // Re-run when pathname changes to handle language switches

  if (!isRTL) {
    return null;
  }

  return (
    <Head>
      <link 
        rel="stylesheet" 
        href="/rtl-specific.css" 
        data-testid="rtl-stylesheet"
      />
    </Head>
  );
}
