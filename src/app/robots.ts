import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/product/', '/request-access', '/enquiry'],
        disallow: [
          '/admin',
          '/portal',
          '/manager',
          '/dashboard',
          '/jobs',
          '/quotations',
          '/orders',
          '/api/',
          '/production-queue',
          '/login',
        ],
      },
    ],
    sitemap: 'https://theforestry.me/sitemap.xml',
  }
}
