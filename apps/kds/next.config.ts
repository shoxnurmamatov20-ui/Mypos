import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mypos/design-tokens', '@mypos/ui', '@mypos/utils'],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
