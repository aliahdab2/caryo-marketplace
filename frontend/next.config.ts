import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer';

const analyzeBundles = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "AdJ8m5EpqN6qPwEtH7XsKfRzV2yG9LcZ",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
  }
  // App Router handles i18n differently - configuration is done through LanguageProvider
};

export default analyzeBundles(nextConfig);
