import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  basePath: '/panel/manager',
  transpilePackages: [
    '@mypos/analytics',
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

export default withNextIntl(nextConfig);
