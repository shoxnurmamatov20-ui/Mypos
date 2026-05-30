import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  basePath: '/panel/kitchen',
  transpilePackages: ['@mypos/api-client', '@mypos/design-tokens', '@mypos/ui', '@mypos/utils'],
  typedRoutes: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
