import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let productUrls: MetadataRoute.Sitemap = []
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { sku: true, updatedAt: true },
    })
    productUrls = products.map((p) => ({
      url: `https://theforestry.me/product/${p.sku}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
  } catch {
    // DB unavailable at build time — product URLs omitted, static pages still served
  }

  return [
    { url: 'https://theforestry.me',                               lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: 'https://theforestry.me/products',                      lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: 'https://theforestry.me/about',                         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://theforestry.me/request-access',                lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://theforestry.me/materials/fiberglass-planters', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: 'https://theforestry.me/materials/grc-planters',        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: 'https://theforestry.me/faq',                           lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://theforestry.me/enquiry',                       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ...productUrls,
  ]
}
