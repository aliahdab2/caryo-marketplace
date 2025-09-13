import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from 'next/headers';
import "./globals.css";
// RTL styles are conditionally loaded client-side for performance

import LanguageProvider from "@/components/EnhancedLanguageProvider";
import I18nProvider from "@/components/I18nProvider";
import MainLayout from "@/components/layout/MainLayout";
import ClientRTLStylesLoader from "@/components/layout/ClientRTLStylesLoader";
import AuthDataHandler from "@/components/auth/AuthDataHandler";
import AutoLanguageDetector from "@/components/AutoLanguageDetector";
import ClientProviders from "@/providers/ClientProviders";
// Import secure logging to prevent sensitive data exposure
import "@/lib/secure-logging";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Caryo Marketplace - Buy & Sell Cars in Syria",
    template: "%s | Caryo Marketplace"
  },
  description: "Your trusted platform for buying and selling vehicles across Syria. Find Toyota, Honda, BMW and more in Damascus, Aleppo, Homs. Browse thousands of verified car listings.",
  keywords: ["cars", "vehicles", "Syria", "Damascus", "Aleppo", "Homs", "Toyota", "Honda", "BMW", "car marketplace", "used cars", "new cars", "automotive"],
  authors: [{ name: "Caryo Team", url: "https://caryo.sy" }],
  creator: "Caryo Marketplace",
  publisher: "Caryo Marketplace",
  applicationName: "Caryo",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://caryo.sy'),
  alternates: {
    canonical: "/",
    languages: {
      'en': '/en',
      'ar': '/ar',
      'x-default': '/'
    }
  },
  openGraph: {
    title: "Caryo Marketplace - Buy & Sell Cars in Syria",
    description: "Your trusted platform for buying and selling vehicles across Syria",
    url: "/",
    siteName: "Caryo Marketplace",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Caryo Marketplace - Car Trading Platform"
      }
    ],
    locale: "en_US",
    alternateLocale: ["ar_SY"],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Caryo Marketplace - Buy & Sell Cars in Syria",
    description: "Your trusted platform for buying and selling vehicles across Syria",
    images: ["/twitter-image.jpg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  category: "automotive",
  classification: "Business"
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Try to get the locale from cookies, defaulting to Arabic if not found
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get('NEXT_LOCALE')?.value || 'ar';
  const isRTL = savedLocale === 'ar';
  
  return (
    <html lang={savedLocale} dir={isRTL ? 'rtl' : 'ltr'}>
      <head>
        {/* ClientRTLStylesLoader will conditionally load RTL styles only when needed */}
        <ClientRTLStylesLoader />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientProviders>
          <AuthDataHandler />
          <I18nProvider>
            <LanguageProvider>
              <AutoLanguageDetector />
              <MainLayout>{children}</MainLayout>
            </LanguageProvider>
          </I18nProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
