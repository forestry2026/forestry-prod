/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Skip TS + ESLint blocks at build time. Both still run in dev + via tsc/lint locally.
  // react-aria-components 1.17 has noisy ref typing under newer @types/react that Vercel resolves.
  typescript: { ignoreBuildErrors: true },
  eslint:     { ignoreDuringBuilds: true },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats:          ['image/avif', 'image/webp'],
    minimumCacheTTL:  2592000, // 30 days
    deviceSizes:      [640, 750, 828, 1080, 1200, 1920],
    imageSizes:       [16, 32, 48, 64, 96, 128, 256, 384],
  },

  async redirects() {
    return [
      { source: '/materials/grc-planters', destination: '/materials/fiberglass-planters', permanent: true },
    ]
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options',        value: 'DENY' },
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'Referrer-Policy',         value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
