import { money, dateBR } from './format'
import type { ListItem } from './types'

export function waLink(phone: string, text?: string) {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

export function listMessage(opts: {
  items: ListItem[]
  name: string
  neededBy?: string
  notes?: string
  orderNumber?: number | null
}) {
  const lines = opts.items.map((i) => {
    const extras = [
      i.colorName && i.colorName,
      i.personalization && `nome: ${i.personalization}`,
      i.gift && `presente 🎁${i.gift_message ? ` (cartão: “${i.gift_message}”)` : ''}`,
    ].filter(Boolean)
    return `• ${i.qty}x ${i.name}${extras.length ? ` (${extras.join(' · ')})` : ''}`
  })
  const total = opts.items.reduce((s, i) => s + (i.price_cents + (i.gift ? i.gift_wrap_cents : 0)) * i.qty, 0)
  return [
    `Oi, Cintia! 💖 Vim pelo site e quero fazer um pedido${opts.orderNumber ? ` (#${opts.orderNumber})` : ''}:`,
    '',
    ...lines,
    '',
    `Total estimado: ${money(total)}`,
    opts.neededBy ? `Preciso até: ${dateBR(opts.neededBy)}` : '',
    opts.notes ? `Obs.: ${opts.notes}` : '',
    `Meu nome: ${opts.name}`,
  ]
    .filter((l, idx, arr) => l !== '' || (arr[idx - 1] !== '' && idx !== arr.length - 1))
    .join('\n')
}

export function customMessage(o: { number?: number | null; name: string; type: string; qty: number; neededBy?: string }) {
  return [
    `Oi, Cintia! ✨ Mandei uma ideia de peça personalizada pelo site${o.number ? ` (#${o.number})` : ''}.`,
    `${o.type} · ${o.qty} ${o.qty === 1 ? 'unidade' : 'unidades'}${o.neededBy ? ` · preciso até ${dateBR(o.neededBy)}` : ''}`,
    `Meu nome: ${o.name}`,
  ].join('\n')
}
