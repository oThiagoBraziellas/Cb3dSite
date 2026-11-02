'use server'

import { randomUUID } from 'node:crypto'
import { after } from 'next/server'
import { notifyNewOrder } from '@/lib/notify'
import { isDemo } from '@/lib/supabase/env'
import { publicClient } from '@/lib/supabase/public'
import { onlyDigits } from '@/lib/format'

type Result = { ok: true; number: number | null } | { ok: false; error: string }

const clean = (v: FormDataEntryValue | null, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const validDate = (s: string) => (/^\d{4}-\d{2}-\d{2}$/.test(s) && s >= new Date().toISOString().slice(0, 10) ? s : null)
const bot = (fd: FormData) => clean(fd.get('site')) !== ''

/* ---------------- lista → pedido ---------------- */
export type OrderInput = {
  name: string
  phone?: string
  neededBy?: string
  notes?: string
  items: { product_id: string; qty: number; color: string; personalization: string; gift: boolean; gift_message: string }[]
}

export async function submitOrder(input: OrderInput): Promise<Result> {
  const name = (input.name ?? '').trim().slice(0, 80)
  if (!name) return { ok: false, error: 'Coloca seu nome pra Cintia saber quem é 🙂' }
  if (!Array.isArray(input.items) || input.items.length === 0) return { ok: false, error: 'Sua lista está vazia.' }
  if (input.items.length > 30) return { ok: false, error: 'Lista grande demais. Fala direto com a Cintia no WhatsApp.' }
  const neededBy = input.neededBy ? validDate(input.neededBy) : null
  if (input.neededBy && !neededBy) return { ok: false, error: 'A data precisa ser hoje ou depois.' }

  if (isDemo) return { ok: true, number: null }

  const items = input.items.map((i) => ({
    product_id: String(i.product_id),
    qty: Math.max(1, Math.min(99, Math.floor(Number(i.qty) || 1))),
    color: String(i.color ?? '').slice(0, 40),
    personalization: String(i.personalization ?? '').slice(0, 60),
    gift: Boolean(i.gift),
    gift_message: String(i.gift_message ?? '').slice(0, 200),
  }))
  const { data, error } = await publicClient().rpc('submit_order', {
    p_name: name,
    p_phone: onlyDigits(input.phone ?? '').slice(0, 15),
    p_needed_by: neededBy,
    p_notes: (input.notes ?? '').slice(0, 1000),
    p_items: items,
  })
  if (error || !data?.[0]) {
    const msg = error?.message ?? ''
    if (msg.includes('esgotada') || msg.includes('indisponível'))
      return { ok: false, error: 'Uma das peças acabou de esgotar. Confere a lista e tenta de novo.' }
    return { ok: false, error: 'Não deu pra registrar agora. Você ainda pode mandar pelo WhatsApp.' }
  }
  const number = data[0].order_number as number
  after(() =>
    notifyNewOrder({
      number,
      kind: 'lista',
      name,
      summary: `${items.reduce((n, i) => n + i.qty, 0)} peça(s)${neededBy ? ` · até ${neededBy}` : ''}`,
    }),
  )
  return { ok: true, number }
}

/* ---------------- peça personalizada ---------------- */
export type CustomState = { ok: true; number: number | null; wa: { name: string; type: string; qty: number; neededBy: string } } | { ok: false; error: string } | null

const TYPES = ['Presente', 'Decoração', 'Brinquedo', 'Chaveiro', 'Lembrancinha', 'Outra']
const SIZES = ['Pequeno (até 5 cm)', 'Médio (até 12 cm)', 'Grande (até 20 cm)', 'Não sei']
const IMG = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const

export async function submitCustomRequest(_prev: CustomState, fd: FormData): Promise<CustomState> {
  if (bot(fd)) return { ok: true, number: null, wa: { name: '', type: '', qty: 1, neededBy: '' } }
  const name = clean(fd.get('name'), 80)
  const phone = onlyDigits(clean(fd.get('phone'), 30))
  const type = TYPES.includes(clean(fd.get('type'))) ? clean(fd.get('type')) : 'Outra'
  const description = clean(fd.get('description'), 2000)
  const size = SIZES.includes(clean(fd.get('size'))) ? clean(fd.get('size')) : 'Não sei'
  const qty = Math.max(1, Math.min(10000, Math.floor(Number(fd.get('qty')) || 1)))
  const colors = fd.getAll('colors').map((c) => clean(c, 30)).filter(Boolean).slice(0, 8)
  const neededRaw = clean(fd.get('needed_by'), 10)
  const neededBy = neededRaw ? validDate(neededRaw) : null

  if (!name) return { ok: false, error: 'Coloca seu nome.' }
  if (phone.length < 10) return { ok: false, error: 'Confere seu WhatsApp com DDD.' }
  if (description.length < 5) return { ok: false, error: 'Conta um pouquinho mais da ideia.' }
  if (neededRaw && !neededBy) return { ok: false, error: 'A data precisa ser hoje ou depois.' }
  if (fd.get('consent') !== 'on') return { ok: false, error: 'Marque que concorda com o uso dos dados pra responder o pedido.' }

  const file = fd.get('photo')
  let referencePath: string | null = null
  if (file instanceof File && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) return { ok: false, error: 'A foto passa de 10 MB. Manda uma menor ou envia depois no WhatsApp.' }
    const ext = IMG[file.type as keyof typeof IMG]
    if (!ext) return { ok: false, error: 'A foto precisa ser JPG, PNG ou WebP.' }
    if (!isDemo) {
      referencePath = `pedidos/${randomUUID()}.${ext}`
      const { error } = await publicClient().storage.from('referencias').upload(referencePath, file, { contentType: file.type, upsert: false })
      if (error) referencePath = null
    }
  }

  const wa = { name, type, qty, neededBy: neededBy ?? '' }
  if (isDemo) return { ok: true, number: null, wa }

  const { data, error } = await publicClient().rpc('submit_custom_request', {
    p_name: name,
    p_phone: phone,
    p_needed_by: neededBy,
    p_type: type,
    p_description: description,
    p_colors: colors,
    p_size: size,
    p_qty: qty,
    p_reference_path: referencePath,
  })
  if (error) return { ok: false, error: 'Não deu pra enviar agora. Tenta de novo ou chama a Cintia no WhatsApp.' }
  const number = data as number
  after(() => notifyNewOrder({ number, kind: 'personalizado', name, summary: `${type} · ${qty} un.${neededBy ? ` · até ${neededBy}` : ''}\n${description.slice(0, 180)}` }))
  return { ok: true, number, wa }
}

/* ---------------- avisar quando voltar ---------------- */
export async function subscribeStockAlert(_prev: { ok?: boolean; error?: string } | null, fd: FormData) {
  if (bot(fd)) return { ok: true }
  const name = clean(fd.get('name'), 80)
  const phone = onlyDigits(clean(fd.get('phone'), 30))
  const productId = clean(fd.get('product_id'), 40)
  if (!name || phone.length < 10) return { error: 'Confere seu nome e WhatsApp com DDD.' }
  if (isDemo) return { ok: true }
  const { error } = await publicClient().rpc('subscribe_stock_alert', { p_product: productId, p_name: name, p_phone: phone })
  if (error) return { error: 'Não deu pra salvar agora. Tenta de novo daqui a pouco.' }
  return { ok: true }
}
