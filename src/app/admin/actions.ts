'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { slugify } from '@/lib/format'
import { isDemo } from '@/lib/supabase/env'
import { serverClient } from '@/lib/supabase/server'
import type { OrderStatus, ProductStatus, StockPolicy, Highlight } from '@/lib/types'

export type ActionResult = { ok: true; message?: string; id?: string } | { ok: false; error: string }
const DEMO: ActionResult = { ok: false, error: 'Modo demonstração: configure o Supabase pra salvar de verdade.' }

function refreshSite() {
  revalidatePath('/', 'layout')
}

/* ------------------------------------------------------------------ */
/* Pedidos                                                             */
/* ------------------------------------------------------------------ */
const STATUSES: OrderStatus[] = ['orcamento', 'producao', 'pronto', 'entregue', 'cancelado']

export async function updateOrder(input: { id: string; status?: OrderStatus; agreed?: string; notes?: string }): Promise<ActionResult> {
  await requireAdmin()
  if (isDemo) return DEMO
  const patch: Record<string, unknown> = {}
  if (input.status) {
    if (!STATUSES.includes(input.status)) return { ok: false, error: 'Status inválido.' }
    patch.status = input.status
  }
  if (input.agreed !== undefined) {
    const v = input.agreed.trim()
    if (v === '') patch.agreed_cents = null
    else {
      const cents = Math.round(Number(v.replace(/\./g, '').replace(',', '.')) * 100)
      if (!Number.isFinite(cents) || cents < 0) return { ok: false, error: 'Valor inválido. Use por exemplo 150,00.' }
      patch.agreed_cents = cents
    }
  }
  if (input.notes !== undefined) patch.notes = input.notes.slice(0, 1000)
  const supabase = await serverClient()
  const { data, error } = await supabase.from('orders').update(patch).eq('id', input.id).select('number, status, reference_path').single()
  if (error) return { ok: false, error: 'Não salvou. Tenta de novo.' }
  // pedido encerrado: apaga a foto de referência (como diz a política de privacidade)
  if ((data.status === 'entregue' || data.status === 'cancelado') && data.reference_path) {
    await supabase.storage.from('referencias').remove([data.reference_path])
    await supabase.from('orders').update({ reference_path: null }).eq('id', input.id)
  }
  revalidatePath('/admin', 'layout')
  refreshSite() // estoque pode ter mudado
  return { ok: true, message: 'Pedido atualizado' }
}

export async function markOrderSeen(id: string) {
  await requireAdmin()
  if (isDemo) return
  const supabase = await serverClient()
  await supabase.from('orders').update({ seen_at: new Date().toISOString() }).eq('id', id).is('seen_at', null)
  revalidatePath('/admin', 'layout')
}

/* ------------------------------------------------------------------ */
/* Produtos                                                            */
/* ------------------------------------------------------------------ */
export type ProductPayload = {
  id?: string
  name: string
  slug: string
  description: string
  price: string
  production_time: string
  pickup_time: string
  stock: number
  stock_policy: StockPolicy
  measures: string
  material: string
  weight: string
  category_id: string | null
  highlight: Highlight
  status: ProductStatus
  customizable: boolean
  gift_wrap: boolean
  gift_wrap_price: string
  icon: string
  color: string
  occasion_ids: string[]
  colors: { name: string; hex: string }[]
  media: { path: string; kind: 'foto' | 'video'; alt: string }[]
  removed_paths: string[]
}

const ICONS = ['impressora', 'bobina', 'cubo', 'presente', 'coracao', 'brilho', 'chaveiro', 'ursinho']
const COLORS = ['rosa', 'amarelo', 'azul', 'roxo', 'nevoa']
const toCents = (s: string) => Math.round(Number(String(s).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.')) * 100)

export async function saveProduct(p: ProductPayload): Promise<ActionResult> {
  await requireAdmin()
  const name = p.name.trim().slice(0, 80)
  if (!name) return { ok: false, error: 'Dê um nome pra peça.' }
  const price = toCents(p.price)
  if (!Number.isFinite(price) || price < 0) return { ok: false, error: 'Confira o preço (ex.: 35,00).' }
  const giftPrice = toCents(p.gift_wrap_price || '0')
  const slug = slugify(p.slug || name)
  if (!slug) return { ok: false, error: 'Endereço da peça inválido.' }
  const colors = p.colors
    .map((c) => ({ name: c.name.trim().slice(0, 40), hex: c.hex.toUpperCase() }))
    .filter((c) => c.name && /^#[0-9A-F]{6}$/.test(c.hex))
    .slice(0, 12)
  if (isDemo) return DEMO

  const row = {
    name,
    slug,
    description: p.description.slice(0, 2000),
    price_cents: price,
    production_time: p.production_time.slice(0, 40) || '3 a 7 dias úteis',
    pickup_time: p.pickup_time.slice(0, 40) || '1 a 2 dias',
    stock: Math.max(0, Math.floor(Number(p.stock) || 0)),
    stock_policy: p.stock_policy,
    measures: p.measures.slice(0, 60),
    material: p.material.slice(0, 60),
    weight: p.weight.slice(0, 30),
    category_id: p.category_id || null,
    highlight: p.highlight,
    status: p.status,
    customizable: Boolean(p.customizable),
    gift_wrap: Boolean(p.gift_wrap),
    gift_wrap_cents: Number.isFinite(giftPrice) && giftPrice >= 0 ? giftPrice : 500,
    icon: ICONS.includes(p.icon) ? p.icon : 'cubo',
    color: COLORS.includes(p.color) ? p.color : 'rosa',
  }

  const supabase = await serverClient()
  const res = p.id
    ? await supabase.from('products').update(row).eq('id', p.id).select('id').single()
    : await supabase.from('products').insert(row).select('id').single()
  if (res.error) {
    if (res.error.code === '23505') return { ok: false, error: 'Já existe uma peça com esse endereço. Mude o nome ou o endereço.' }
    return { ok: false, error: 'Não salvou. Tenta de novo.' }
  }
  const id = res.data.id as string

  // filhos: substitui tudo (listas pequenas)
  await supabase.from('product_colors').delete().eq('product_id', id)
  if (colors.length) await supabase.from('product_colors').insert(colors.map((c, i) => ({ ...c, product_id: id, position: i })))
  await supabase.from('product_occasions').delete().eq('product_id', id)
  if (p.occasion_ids.length) await supabase.from('product_occasions').insert(p.occasion_ids.slice(0, 20).map((o) => ({ product_id: id, occasion_id: o })))
  await supabase.from('product_media').delete().eq('product_id', id)
  const media = p.media.filter((m) => /^[\w-]+\/[\w.-]+$/.test(m.path)).slice(0, 12)
  if (media.length) await supabase.from('product_media').insert(media.map((m, i) => ({ product_id: id, path: m.path, kind: m.kind, alt: m.alt.slice(0, 120), position: i })))
  const removed = p.removed_paths.filter((x) => /^[\w-]+\/[\w.-]+$/.test(x))
  if (removed.length) await supabase.storage.from('produtos').remove(removed)

  revalidatePath('/admin/produtos')
  refreshSite()
  return { ok: true, id, message: 'Peça salva' }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin()
  if (isDemo) return DEMO
  const supabase = await serverClient()
  const { data: media } = await supabase.from('product_media').select('path').eq('product_id', id)
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) return { ok: false, error: 'Não deu pra apagar.' }
  if (media?.length) await supabase.storage.from('produtos').remove(media.map((m) => m.path))
  revalidatePath('/admin/produtos')
  refreshSite()
  redirect('/admin/produtos')
}

export async function quickStock(id: string, stock: number): Promise<ActionResult> {
  await requireAdmin()
  if (isDemo) return DEMO
  const supabase = await serverClient()
  const { error } = await supabase.from('products').update({ stock: Math.max(0, Math.floor(stock)) }).eq('id', id)
  if (error) return { ok: false, error: 'Não salvou.' }
  revalidatePath('/admin/produtos')
  refreshSite()
  return { ok: true }
}

export async function updateStockAlert(id: string, action: 'avisado' | 'pendente' | 'apagar'): Promise<ActionResult> {
  await requireAdmin()
  if (isDemo) return DEMO
  const supabase = await serverClient()
  const { error } =
    action === 'apagar'
      ? await supabase.from('stock_alerts').delete().eq('id', id)
      : await supabase.from('stock_alerts').update({ notified: action === 'avisado' }).eq('id', id)
  if (error) return { ok: false, error: 'Não salvou.' }
  revalidatePath('/admin/produtos', 'layout')
  return { ok: true }
}

/* ------------------------------------------------------------------ */
/* Categorias e ocasiões                                               */
/* ------------------------------------------------------------------ */
type TaxItem = { id?: string; name: string; slug?: string; icon?: string; color?: string }

export async function saveTaxonomy(kind: 'categories' | 'occasions', items: TaxItem[]): Promise<ActionResult> {
  await requireAdmin()
  if (isDemo) return DEMO
  const supabase = await serverClient()
  const { data: current } = await supabase.from(kind).select('id')
  const keep = new Set(items.filter((i) => i.id).map((i) => i.id))
  const toDelete = (current ?? []).map((c) => c.id as string).filter((id) => !keep.has(id))
  if (toDelete.length) await supabase.from(kind).delete().in('id', toDelete)
  for (const [i, it] of items.entries()) {
    const name = it.name.trim().slice(0, 60)
    if (!name) continue
    const row: Record<string, unknown> = { name, slug: slugify(it.slug || name), position: i + 1 }
    if (kind === 'categories') {
      row.icon = ICONS.includes(it.icon ?? '') ? it.icon : 'cubo'
      row.color = COLORS.includes(it.color ?? '') ? it.color : 'rosa'
    }
    const { error } = it.id ? await supabase.from(kind).update(row).eq('id', it.id) : await supabase.from(kind).insert(row)
    if (error) return { ok: false, error: `Não salvou “${name}” (nome repetido?).` }
  }
  refreshSite()
  revalidatePath('/admin', 'layout')
  return { ok: true, message: 'Salvo' }
}

/* ------------------------------------------------------------------ */
/* Configurações do site                                               */
/* ------------------------------------------------------------------ */
export async function saveSettings(patch: Record<string, unknown>): Promise<ActionResult> {
  await requireAdmin()
  if (isDemo) return DEMO
  const allowed = [
    'whatsapp', 'instagram', 'tiktok', 'online_mode', 'hours', 'offline_message', 'notice_on', 'notice_text', 'notice_start', 'notice_end',
    'deadlines_text', 'pickup_text', 'notify_whatsapp', 'notify_email', 'notify_panel',
  ]
  const clean = Object.fromEntries(Object.entries(patch).filter(([k]) => allowed.includes(k)))
  if (typeof clean.whatsapp === 'string') {
    let d = clean.whatsapp.replace(/\D/g, '')
    if (d.length === 10 || d.length === 11) d = '55' + d
    if (!/^\d{12,13}$/.test(d)) return { ok: false, error: 'WhatsApp com DDD, ex.: (61) 9 1234-5678.' }
    clean.whatsapp = d
  }
  for (const k of ['notice_start', 'notice_end']) if (clean[k] === '') clean[k] = null
  const supabase = await serverClient()
  const { error } = await supabase.from('settings').update(clean).eq('id', 1)
  if (error) return { ok: false, error: 'Não salvou. Confira os campos.' }
  refreshSite()
  return { ok: true, message: 'Salvo' }
}

export async function savePrivateSettings(p: { notify_email_to: string; notify_phone: string; callmebot_apikey: string }): Promise<ActionResult> {
  await requireAdmin()
  if (isDemo) return DEMO
  const email = p.notify_email_to.trim().slice(0, 120)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'E-mail inválido.' }
  const supabase = await serverClient()
  const { error } = await supabase
    .from('settings_private')
    .update({ notify_email_to: email, notify_phone: p.notify_phone.replace(/[^\d+]/g, '').slice(0, 20), callmebot_apikey: p.callmebot_apikey.trim().slice(0, 40) })
    .eq('id', 1)
  if (error) return { ok: false, error: 'Não salvou.' }
  return { ok: true, message: 'Salvo' }
}

type ListKind = 'slides' | 'testimonials' | 'special_dates'
const FIELDS: Record<ListKind, string[]> = {
  slides: ['kicker', 'title', 'subtitle', 'button_label', 'button_href', 'icon', 'color', 'image_path', 'active'],
  testimonials: ['quote', 'author', 'place', 'stars', 'active'],
  special_dates: ['name', 'day', 'order_by', 'active'],
}

export async function saveList(kind: ListKind, items: Record<string, unknown>[]): Promise<ActionResult> {
  await requireAdmin()
  if (isDemo) return DEMO
  const supabase = await serverClient()
  const { data: current } = await supabase.from(kind).select('id')
  const keep = new Set(items.map((i) => i.id).filter(Boolean))
  const del = (current ?? []).map((c) => c.id as string).filter((id) => !keep.has(id))
  if (del.length) await supabase.from(kind).delete().in('id', del)
  for (const [i, it] of items.slice(0, 20).entries()) {
    const row: Record<string, unknown> = Object.fromEntries(FIELDS[kind].map((f) => [f, it[f]]))
    if (kind !== 'special_dates') row.position = i + 1
    if (kind === 'slides' && typeof row.button_href === 'string' && !row.button_href.startsWith('/')) row.button_href = '/catalogo'
    const { error } = it.id ? await supabase.from(kind).update(row).eq('id', it.id as string) : await supabase.from(kind).insert(row)
    if (error) return { ok: false, error: 'Algum campo ficou vazio ou inválido.' }
  }
  refreshSite()
  revalidatePath('/admin/config')
  return { ok: true, message: 'Salvo' }
}

/* ------------------------------------------------------------------ */
export async function signOut() {
  if (!isDemo) {
    const supabase = await serverClient()
    await supabase.auth.signOut()
  }
  redirect('/admin/login')
}
