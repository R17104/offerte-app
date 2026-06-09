import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bespaarhulpfriesland-black.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/producten', '/gratis-advies'],
        disallow: ['/dashboard', '/quotes', '/leads', '/klanten', '/inloggen', '/api/', '/offerte/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
