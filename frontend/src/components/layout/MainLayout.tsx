"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { MainLayoutProps } from "@/types/components";
// Import DevTools component conditionally
import dynamic from "next/dynamic";

// Dynamically import DevTools to ensure it only runs on the client side
const DevTools = dynamic(() => import("@/components/debug/DevTools"), {
  ssr: false,
});

// Dynamically import DevNavLink for development navigation
const DevNavLink = dynamic(() => import("@/components/dev/DevNavLink"), {
  ssr: false,
});

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const _isHomePage = pathname === '/' || pathname === '/en' || pathname === '/ar';

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow pt-[64px] sm:pt-[72px] md:pt-[80px]">
        {/* Content must never wait for the auth session: gating children on
            session loading suppressed server-side rendering site-wide (crawlers
            saw only a spinner). Protected pages enforce auth via AuthGuard. */}
        <div className="w-full max-w-[94%] xs:max-w-[92%] sm:max-w-[90%] md:max-w-[88%] lg:max-w-6xl xl:max-w-7xl mx-auto pt-0 pb-2 px-2 xs:pb-3 xs:px-3 sm:pb-4 sm:px-3 md:pb-5 md:px-4 lg:pb-6 lg:px-6">
          {children}
        </div>
      </main>

      <Footer />

      {/* DevTools will only render in development mode */}
      <DevTools />

      {/* Dev Navigation Link for easy access to test pages */}
      <DevNavLink />
    </div>
  );
}
