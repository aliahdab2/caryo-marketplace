import withBundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';

const analyzeBundles = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// Get MinIO URL from environment
const minioUrl = process.env.NEXT_PUBLIC_MINIO_URL 
  ? new URL(process.env.NEXT_PUBLIC_MINIO_URL)
  : null;

if (!minioUrl) {
  console.error('NEXT_PUBLIC_MINIO_URL environment variable is not set');
}

const nextConfig: NextConfig = {
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_MINIO_URL: process.env.NEXT_PUBLIC_MINIO_URL
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

  // Using the stable turbopack configuration
  turbopack: {
    // You can add Turbopack-specific options here if needed
  }
};

export default analyzeBundles(nextConfig);
