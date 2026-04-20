import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@mypos/design-tokens', '@mypos/ui'],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
