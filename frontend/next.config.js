/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  /* config options here */
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "AdJ8m5EpqN6qPwEtH7XsKfRzV2yG9LcZ",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
  },
  // App Router handles i18n differently - configuration is done through LanguageProvider
  
  // Next.js Image configuration - domains that are allowed to be loaded
  images: {
    domains: ['placehold.co'],
  },
  
  // Using the stable turbopack configuration
  turbopack: {
    // You can add Turbopack-specific options here if needed
  }
};

module.exports = withBundleAnalyzer(nextConfig);
