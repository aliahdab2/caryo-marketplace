import type { Metadata } from "next";
import "../globals.css";
import { locales, isValidLocale } from "../i18n/config";
import { notFound } from "next/navigation";
import I18nProvider from "@/components/I18nProvider";
import SimpleLanguageProvider from "@/components/SimpleLanguageProvider";
import MainLayout from "@/components/layout/MainLayout";
import ClientProviders from "@/providers/ClientProviders";
import AuthDataHandler from "@/components/auth/AuthDataHandler";
import LocaleHtmlAttributes from "@/components/LocaleHtmlAttributes";
// Import secure logging to prevent sensitive data exposure
import "@/lib/secure-logging";

export const metadata: Metadata = {
  title: "Caryo Marketplace - Buy & Sell Cars in Syria",
  description: "Your trusted platform for buying and selling vehicles across Syria. Find Toyota, Honda, BMW and more in Damascus, Aleppo, Homs. Browse thousands of verified car listings.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://caryo.sy'),
  keywords: [
    "cars Syria", "buy car Damascus", "sell car Aleppo", "used cars Syria",
    "Toyota Syria", "Honda Syria", "BMW Syria", "car marketplace Syria",
    "automotive Syria", "vehicle listings Syria", "car dealer Syria"
  ],
  authors: [{ name: "Caryo Marketplace" }],
  creator: "Caryo Marketplace",
  publisher: "Caryo Marketplace",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL,
    languages: {
      'en': '/en',
      'ar': '/ar',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['ar_SY'],
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Caryo Marketplace',
    title: 'Caryo Marketplace - Buy & Sell Cars in Syria',
    description: 'Your trusted platform for buying and selling vehicles across Syria.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Caryo Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Caryo Marketplace - Buy & Sell Cars in Syria',
    description: 'Your trusted platform for buying and selling vehicles across Syria.',
    images: ['/images/og-image.png'],
  },
  category: "automotive",
  classification: "Business"
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <ClientProviders>
      <LocaleHtmlAttributes />
      <AuthDataHandler />
      <I18nProvider>
        <SimpleLanguageProvider>
          <MainLayout>{children}</MainLayout>
        </SimpleLanguageProvider>
      </I18nProvider>
    </ClientProviders>
  );
}
