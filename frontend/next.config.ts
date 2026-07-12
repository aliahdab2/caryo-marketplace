import withBundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';

const analyzeBundles = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// Function to create development configurations with sensible defaults
const getConfigForEnvironment = () => {
  // In development mode, we'll use predefined values
  if (process.env.NODE_ENV === 'development') {
    return {
      minioUrl: new URL('http://localhost:9000'),
      showWarnings: false,
    };
  }
  
  // In production, we require proper configuration
  return {
    minioUrl: process.env.NEXT_PUBLIC_MINIO_URL ? new URL(process.env.NEXT_PUBLIC_MINIO_URL) : null,
    showWarnings: true,
  };
};

const { minioUrl, showWarnings } = getConfigForEnvironment();

// Only show warnings in production
if (!minioUrl && showWarnings) {
  console.error('⚠️ NEXT_PUBLIC_MINIO_URL environment variable is not set in production');
  console.error('→ Media storage functionality may not work correctly');
}

const nextConfig: NextConfig = {
  // Performance optimizations
  experimental: {
    // Enable optimizePackageImports for better tree shaking
    optimizePackageImports: [
      'lucide-react',
      'react-icons',
      'lodash-es'
    ]
  },
  
  // Turbopack optimizations
  turbopack: {
    // Add turbopack-specific options here if needed in the future
  },
  
  // Compression
  compress: true,

  // Security headers for all rendered pages (API responses get theirs from the backend).
  // No CSP yet: it needs runtime testing against imgproxy/MinIO/OAuth/YouTube origins first.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]
            : []),
        ],
      },
    ];
  },
  
  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Resolve alias for better tree shaking
    config.resolve.alias = {
      ...config.resolve.alias,
      'lodash': 'lodash-es',
    };
    
    return config;
  },
  
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    // For development simplicity, we provide a default MinIO URL if not set
    // This prevents unnecessary warnings and errors during development
    // In production, proper configuration should be provided via environment variables
    NEXT_PUBLIC_MINIO_URL: process.env.NEXT_PUBLIC_MINIO_URL || 'http://localhost:9000',
    // Video feature configuration
    NEXT_PUBLIC_VIDEO_UPLOAD_ENABLED: process.env.NEXT_PUBLIC_VIDEO_UPLOAD_ENABLED || 'true',
    NEXT_PUBLIC_VIDEO_URL_ENABLED: process.env.NEXT_PUBLIC_VIDEO_URL_ENABLED || 'true'
  },
  
  images: {
    // Enable modern image formats for better compression
    formats: ['image/avif', 'image/webp'],
    // Custom device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimize external image processing for dynamic URLs
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      // YouTube thumbnail images
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/**',
      },
      // MinIO configuration based on environment
      ...(minioUrl ? [{
        protocol: minioUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: minioUrl.hostname,
        port: minioUrl.port || undefined,
        pathname: '/**',
      }] : []),
      // Allow Docker container hostname
      {
        protocol: 'http',
        hostname: 'minio',
        port: '9000',
        pathname: '/**',
      },
      // Allow localhost MinIO for development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
    ],
  },

  // Additional turbopack configuration can be added to the existing turbopack section above
};

import { withSentryConfig } from '@sentry/nextjs';

// Only apply bundle analyzer when explicitly requested
const config = process.env.ANALYZE === 'true' ? analyzeBundles(nextConfig) : nextConfig;

export default withSentryConfig(
  config,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // tunnelRoute: "/monitoring",

    // Webpack-specific Sentry options
    webpack: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      treeshake: { removeDebugLogging: true },

      // Enables automatic instrumentation of Vercel Cron Monitors.
      automaticVercelMonitors: true,
    },
  }
);
