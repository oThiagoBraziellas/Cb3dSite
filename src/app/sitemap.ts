import type { MetadataRoute } from 'next'
import { getProducts } from '@/lib/data'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const products = await getProducts()
  const pages = ['', '/catalogo', '/personalizada', '/sobre', '/ajuda', '/trocas', '/privacidade']
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.7 })),
    ...products.map((p) => ({ url: `${base}/catalogo/${p.slug}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
  ]
}
