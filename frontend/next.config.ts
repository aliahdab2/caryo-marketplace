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
  // ESLint configuration for Next.js integration
  eslint: {
    // Skip ESLint during builds - we use our own lint scripts
    ignoreDuringBuilds: true,
  },
  
  // Performance optimizations
  experimental: {
    // Enable optimizePackageImports for better tree shaking
    optimizePackageImports: [
      'lucide-react',
      'react-icons',
      '@heroicons/react',
      'lodash-es'
    ]
  },
  
  // Turbopack optimizations
  turbopack: {
    // Add turbopack-specific options here if needed in the future
  },
  
  // Compression
  compress: true,
  
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

// Only apply bundle analyzer when explicitly requested
export default process.env.ANALYZE === 'true' ? analyzeBundles(nextConfig) : nextConfig;
