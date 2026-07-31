import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import ClientRTLStylesLoader from "@/components/layout/ClientRTLStylesLoader";
import { isValidLocale, getLocaleDirection, defaultLocale, type Locale } from "./i18n/config";
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
  title: "Caryo Marketplace - Buy & Sell Cars in Syria",
  description: "Your trusted platform for buying and selling vehicles across Syria. Find Toyota, Honda, BMW and more in Damascus, Aleppo, Homs. Browse thousands of verified car listings.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://caryo.sy'),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Locale forwarded by proxy.ts; lang/dir must be server-rendered so Arabic
  // pages arrive as RTL instead of flipping after hydration.
  const headerLocale = (await headers()).get("x-locale");
  const locale: Locale = headerLocale && isValidLocale(headerLocale) ? headerLocale : defaultLocale;

  return (
    <html lang={locale} dir={getLocaleDirection(locale)} suppressHydrationWarning>
      <head>
        <ClientRTLStylesLoader />
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}