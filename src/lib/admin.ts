import 'server-only'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { mapProduct, PRODUCT_SELECT } from './data'
import { demoAlerts, demoCategories, demoDates, demoOccasions, demoOrders, demoProducts, demoSettings, demoSlides, demoTestimonials } from './demo'
import { isDemo, publicMediaUrl } from './supabase/env'
import { serverClient } from './supabase/server'
import type { Category, Occasion, Order, OrderStatus, Product, Settings, Slide, SpecialDate, StockAlert, Testimonial } from './types'

export type AdminSession = { demo: true; email: string } | { demo: false; email: string; userId: string }

/** Garante que é a Cintia, com verificação em 2 etapas. Senão manda pro login. */
export const requireAdmin = cache(async (): Promise<AdminSession> => {
  if (isDemo) return { demo: true, email: 'demo@cb3d' }
  const supabase = await serverClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal?.currentLevel !== 'aal2') redirect('/admin/verificar')
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/admin/login?erro=sem-acesso')
  return { demo: false, email: user.email ?? '', userId: user.id }
})

export { statusLabel } from './admin-shared'

/* eslint-disable @typescript-eslint/no-explicit-any */
const mapOrder = (r: any): Order => ({ ...r, custom_colors: r.custom_colors ?? [], items: r.items ?? [] })
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function getOrders(status?: OrderStatus | 'novos'): Promise<Order[]> {
  await requireAdmin()
  if (isDemo) {
    if (status === 'novos') return demoOrders.filter((o) => !o.seen_at)
    return status ? demoOrders.filter((o) => o.status === status) : demoOrders
  }
  const supabase = await serverClient()
  let q = supabase.from('orders').select('*, items:order_items(*)').order('created_at', { ascending: false }).limit(100)
  if (status === 'novos') q = q.is('seen_at', null)
  else if (status) q = q.eq('status', status)
  const { data } = await q
  return (data ?? []).map(mapOrder)
}

export async function getOrder(number: number): Promise<(Order & { reference_url: string | null }) | null> {
  await requireAdmin()
  if (isDemo) {
    const o = demoOrders.find((x) => x.number === number)
    return o ? { ...o, reference_url: null } : null
  }
  const supabase = await serverClient()
  const { data } = await supabase.from('orders').select('*, items:order_items(*)').eq('number', number).maybeSingle()
  if (!data) return null
  let reference_url: string | null = null
  if (data.reference_path) {
    const { data: signed } = await supabase.storage.from('referencias').createSignedUrl(data.reference_path, 60 * 30)
    reference_url = signed?.signedUrl ?? null
  }
  return { ...mapOrder(data), reference_url }
}

export async function getOrderCounts() {
  await requireAdmin()
  const orders = isDemo ? demoOrders : await getOrders()
  const count = (s: OrderStatus) => orders.filter((o) => o.status === s).length
  return {
    novos: orders.filter((o) => !o.seen_at).length,
    orcamento: count('orcamento'),
    producao: count('producao'),
    pronto: count('pronto'),
  }
}

export async function getAdminProducts(): Promise<Product[]> {
  await requireAdmin()
  if (isDemo) return demoProducts
  const supabase = await serverClient()
  const { data } = await supabase.from('products').select(PRODUCT_SELECT).order('position')
  return (data ?? []).map(mapProduct)
}

export async function getAdminProduct(id: string): Promise<Product | null> {
  await requireAdmin()
  if (isDemo) return demoProducts.find((p) => p.id === id) ?? null
  const supabase = await serverClient()
  const { data } = await supabase.from('products').select(PRODUCT_SELECT).eq('id', id).maybeSingle()
  return data ? mapProduct(data) : null
}

export async function getStockAlerts(productId: string): Promise<StockAlert[]> {
  await requireAdmin()
  if (isDemo) return demoAlerts.filter((a) => a.product_id === productId)
  const supabase = await serverClient()
  const { data } = await supabase.from('stock_alerts').select('*').eq('product_id', productId).order('created_at', { ascending: false })
  return (data as StockAlert[]) ?? []
}

export async function getTaxonomy(): Promise<{ categories: Category[]; occasions: Occasion[] }> {
  await requireAdmin()
  if (isDemo) return { categories: demoCategories, occasions: demoOccasions }
  const supabase = await serverClient()
  const [{ data: categories }, { data: occasions }] = await Promise.all([
    supabase.from('categories').select('*').order('position'),
    supabase.from('occasions').select('*').order('position'),
  ])
  return { categories: (categories as Category[]) ?? [], occasions: (occasions as Occasion[]) ?? [] }
}

export type SiteContent = {
  settings: Settings
  privateSettings: { notify_email_to: string; notify_phone: string; callmebot_apikey: string }
  slides: Slide[]
  testimonials: Testimonial[]
  dates: SpecialDate[]
}

export async function getSiteContent(): Promise<SiteContent> {
  await requireAdmin()
  if (isDemo)
    return {
      settings: demoSettings,
      privateSettings: { notify_email_to: 'cintia@exemplo.com', notify_phone: '', callmebot_apikey: '' },
      slides: demoSlides,
      testimonials: demoTestimonials,
      dates: demoDates,
    }
  const supabase = await serverClient()
  const [s, p, sl, t, d] = await Promise.all([
    supabase.from('settings').select('*').eq('id', 1).single(),
    supabase.from('settings_private').select('*').eq('id', 1).single(),
    supabase.from('slides').select('*').order('position'),
    supabase.from('testimonials').select('*').order('position'),
    supabase.from('special_dates').select('*').order('day'),
  ])
  return {
    settings: s.data as Settings,
    privateSettings: p.data ?? { notify_email_to: '', notify_phone: '', callmebot_apikey: '' },
    slides: ((sl.data as Slide[]) ?? []).map((x) => ({ ...x, image_path: x.image_path })),
    testimonials: (t.data as Testimonial[]) ?? [],
    dates: (d.data as SpecialDate[]) ?? [],
  }
}

export { publicMediaUrl }
