import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from 'next/headers';
import "./globals.css";
// RTL styles are conditionally loaded client-side for performance
import AuthProvider from "@/components/AuthProvider";
import LanguageProvider from "@/components/EnhancedLanguageProvider";
import I18nProvider from "@/components/I18nProvider";
import MainLayout from "@/components/layout/MainLayout";
import ClientRTLStylesLoader from "@/components/layout/ClientRTLStylesLoader";
import AuthDataHandler from "@/components/auth/AuthDataHandler";
import AutoLanguageDetector from "@/components/AutoLanguageDetector";
import LocaleDetector from "@/components/LocaleDetector";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Caryo Marketplace",
  description: "Your trusted platform for buying and selling vehicles",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Try to get the locale from cookies, defaulting to Arabic if not found
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get('NEXT_LOCALE')?.value || 'ar';
  
  // Use the saved locale from cookies for now
  // The LocaleDetector component will update the lang attribute client-side
  const locale = savedLocale;
  const isRTL = locale === 'ar';
  
  return (
    <html lang={savedLocale} dir={isRTL ? 'rtl' : 'ltr'}>
      <head>
        {/* ClientRTLStylesLoader will conditionally load RTL styles only when needed */}
        <ClientRTLStylesLoader />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <AuthDataHandler />
          <I18nProvider>
            <LanguageProvider>
              <AutoLanguageDetector />
              <LocaleDetector />
              <MainLayout>{children}</MainLayout>
            </LanguageProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
