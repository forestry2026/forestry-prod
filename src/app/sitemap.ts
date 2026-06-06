import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { sku: true, updatedAt: true },
  })

  const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
    url: `https://theforestry.me/product/${p.sku}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: 'https://theforestry.me',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: 'https://theforestry.me/request-access',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://theforestry.me/enquiry',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...productUrls,
  ]
}
