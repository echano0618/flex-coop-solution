/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const apiTarget = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    // Strip trailing /api/v1 if present for base proxying
    const baseTarget = apiTarget.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${baseTarget}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
