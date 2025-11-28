import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@tpmjs/ui', '@tpmjs/utils', '@tpmjs/db', '@tpmjs/types', '@tpmjs/env'],
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.tpmjs.com',
          },
        ],
        destination: 'https://tpmjs.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
