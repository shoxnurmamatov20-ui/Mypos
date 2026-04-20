import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: [
    '@mypos/api-client',
    '@mypos/design-tokens',
    '@mypos/ui',
    '@mypos/utils',
  ],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
