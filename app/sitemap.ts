import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bespaarhulpfriesland.nl'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    where: { active: true, shopVisible: true },
    select: { id: true, updatedAt: true },
  })

  const productUrls = products.map((p) => ({
    url: `${BASE_URL}/producten/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/producten`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/gratis-advies`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...productUrls,
  ]
}
