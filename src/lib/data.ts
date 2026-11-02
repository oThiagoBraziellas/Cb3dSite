import 'server-only'
import { cache } from 'react'
import { demoCategories, demoDates, demoOccasions, demoProducts, demoSettings, demoSlides, demoTestimonials } from './demo'
import { isDemo, publicMediaUrl } from './supabase/env'
import { publicClient } from './supabase/public'
import type { Category, Occasion, Product, Settings, Slide, SpecialDate, Testimonial } from './types'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapProduct(row: any): Product {
  return {
    ...row,
    colors: [...(row.colors ?? [])].sort((a, b) => a.position - b.position),
    media: [...(row.media ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((m) => ({ ...m, url: publicMediaUrl(m.path) })),
    occasion_ids: (row.occ ?? []).map((o: any) => o.occasion_id),
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const PRODUCT_SELECT = '*, colors:product_colors(*), media:product_media(*), occ:product_occasions(occasion_id)'

export const getSettings = cache(async (): Promise<Settings> => {
  if (isDemo) return demoSettings
  const { data } = await publicClient().from('settings').select('*').eq('id', 1).maybeSingle()
  return (data as Settings) ?? demoSettings
})

export const getCategories = cache(async (): Promise<Category[]> => {
  if (isDemo) return demoCategories
  const { data } = await publicClient().from('categories').select('*').order('position')
  return (data as Category[]) ?? []
})

export const getOccasions = cache(async (): Promise<Occasion[]> => {
  if (isDemo) return demoOccasions
  const { data } = await publicClient().from('occasions').select('*').order('position')
  return (data as Occasion[]) ?? []
})

/** Todas as peças visíveis (publicadas ou esgotadas). */
export const getProducts = cache(async (): Promise<Product[]> => {
  if (isDemo) return demoProducts
  const { data } = await publicClient()
    .from('products')
    .select(PRODUCT_SELECT)
    .in('status', ['publicado', 'esgotado'])
    .order('position')
  return (data ?? []).map(mapProduct)
})

export const getProduct = cache(async (slug: string): Promise<Product | null> => {
  const all = await getProducts()
  return all.find((p) => p.slug === slug) ?? null
})

export const getSlides = cache(async (): Promise<Slide[]> => {
  if (isDemo) return demoSlides
  const { data } = await publicClient().from('slides').select('*').eq('active', true).order('position')
  return ((data as Slide[]) ?? []).map((s) => ({ ...s, image_path: s.image_path ? publicMediaUrl(s.image_path) : null }))
})

export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  if (isDemo) return demoTestimonials
  const { data } = await publicClient().from('testimonials').select('*').eq('active', true).order('position')
  return (data as Testimonial[]) ?? []
})

export const getSpecialDates = cache(async (): Promise<SpecialDate[]> => {
  const today = new Date().toISOString().slice(0, 10)
  const list = isDemo
    ? demoDates
    : (((await publicClient().from('special_dates').select('*').eq('active', true).order('day')).data as SpecialDate[]) ?? [])
  return list.filter((d) => d.day >= today).slice(0, 4)
})

/* ---------------- filtros do catálogo ---------------- */
export type CatalogFilters = {
  cat?: string
  ocasiao?: string
  q?: string
  preco?: string
  cor?: string
  disp?: string
  ordem?: string
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export const priceRanges = [
  { value: '30', label: 'Até R$ 30', test: (c: number) => c <= 3000 },
  { value: '50', label: 'Até R$ 50', test: (c: number) => c <= 5000 },
  { value: '100', label: 'Até R$ 100', test: (c: number) => c <= 10000 },
  { value: '100+', label: 'Acima de R$ 100', test: (c: number) => c > 10000 },
]

export const sortOptions = [
  { value: 'populares', label: 'Mais pedidos' },
  { value: 'novos', label: 'Novidades' },
  { value: 'menor', label: 'Menor preço' },
  { value: 'maior', label: 'Maior preço' },
]

export function isAvailable(p: Product) {
  return p.status !== 'esgotado' && (p.stock > 0 || p.stock_policy === 'encomenda')
}

export function filterProducts(all: Product[], f: CatalogFilters, cats: Category[], occs: Occasion[]) {
  let list = [...all]
  if (f.cat) {
    const c = cats.find((x) => x.slug === f.cat)
    list = c ? list.filter((p) => p.category_id === c.id) : []
  }
  if (f.ocasiao) {
    const o = occs.find((x) => x.slug === f.ocasiao)
    list = o ? list.filter((p) => p.occasion_ids.includes(o.id)) : []
  }
  if (f.q) {
    const q = norm(f.q.trim())
    list = list.filter((p) => norm(`${p.name} ${p.description}`).includes(q))
  }
  const range = priceRanges.find((r) => r.value === f.preco)
  if (range) list = list.filter((p) => range.test(p.price_cents))
  if (f.cor) {
    const cor = norm(f.cor)
    list = list.filter((p) => p.colors.some((c) => norm(c.name) === cor))
  }
  if (f.disp === 'pronta') list = list.filter((p) => p.stock > 0 && p.status !== 'esgotado')
  if (f.disp === 'encomenda') list = list.filter((p) => p.stock_policy === 'encomenda')
  switch (f.ordem) {
    case 'novos':
      list.sort((a, b) => b.created_at.localeCompare(a.created_at))
      break
    case 'menor':
      list.sort((a, b) => a.price_cents - b.price_cents)
      break
    case 'maior':
      list.sort((a, b) => b.price_cents - a.price_cents)
      break
    default:
      list.sort((a, b) => b.popularity - a.popularity || a.position - b.position)
  }
  return list
}

/** Cores que aparecem no catálogo (para o filtro) */
export function catalogColors(all: Product[]) {
  const map = new Map<string, string>()
  all.forEach((p) => p.colors.forEach((c) => map.set(c.name, c.hex)))
  return [...map.entries()].map(([name, hex]) => ({ name, hex }))
}
