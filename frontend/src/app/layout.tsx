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
