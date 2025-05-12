"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useSession } from "next-auth/react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { status } = useSession();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow">
        {status === "loading" ? (
          <div className="flex justify-center items-center h-full py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
