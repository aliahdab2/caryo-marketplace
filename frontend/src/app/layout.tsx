import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from 'next/headers';
import "./globals.css";
import "./rtl.css";  // Import RTL specific styles
import AuthProvider from "@/components/AuthProvider";
import LanguageProvider from "@/components/LanguageProvider";
import I18nProvider from "@/components/I18nProvider";
import MainLayout from "@/components/layout/MainLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoTrader Marketplace",
  description: "Your trusted platform for buying and selling vehicles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Use default locale setting since we're in a Server Component
  // The actual language detection and switching happens in the client-side LanguageProvider
  const defaultLocale = 'ar'; // Default to Arabic
  const defaultDir = 'rtl'; // Default to RTL for Arabic
  
  return (
    <html lang={defaultLocale} dir={defaultDir}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <I18nProvider>
            <LanguageProvider>
              <MainLayout>{children}</MainLayout>
            </LanguageProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
