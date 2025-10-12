import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}