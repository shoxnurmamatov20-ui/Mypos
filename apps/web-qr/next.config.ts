import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  output: 'standalone',
  basePath: '/panel/qr',
  transpilePackages: ['@mypos/analytics', 
    '@mypos/api-client',
    '@mypos/design-tokens',
    '@mypos/ui',
    '@mypos/utils',
  ],
  experimental: {
    typedRoutes: true,
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
