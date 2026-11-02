import type { BrandIconName } from '@/components/icons'

export type BrandColor = 'rosa' | 'amarelo' | 'azul' | 'roxo' | 'nevoa'
export type ProductStatus = 'publicado' | 'rascunho' | 'oculto' | 'esgotado'
export type StockPolicy = 'esgotado' | 'encomenda' | 'avisar'
export type Highlight = 'nenhum' | 'novo' | 'destaque'
export type OrderStatus = 'orcamento' | 'producao' | 'pronto' | 'entregue' | 'cancelado'
export type OrderSource = 'lista' | 'personalizado' | 'whatsapp' | 'manual'

export type Category = { id: string; slug: string; name: string; icon: BrandIconName; color: BrandColor; position: number }
export type Occasion = { id: string; slug: string; name: string; position: number }
export type ProductColor = { id: string; name: string; hex: string; position: number }
export type ProductMedia = { id: string; path: string; kind: 'foto' | 'video'; alt: string; position: number; url: string }

export type Product = {
  id: string
  slug: string
  name: string
  description: string
  price_cents: number
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
  gift_wrap_cents: number
  icon: BrandIconName
  color: BrandColor
  position: number
  popularity: number
  created_at: string
  colors: ProductColor[]
  media: ProductMedia[]
  occasion_ids: string[]
}

export type Hours = Record<'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab', [string, string] | null>

export type Settings = {
  whatsapp: string
  instagram: string
  tiktok: string
  online_mode: 'auto' | 'ligado' | 'desligado'
  hours: Hours
  offline_message: string
  notice_on: boolean
  notice_text: string
  notice_start: string | null
  notice_end: string | null
  deadlines_text: string
  pickup_text: string
  notify_whatsapp: boolean
  notify_email: boolean
  notify_panel: boolean
}

export type Slide = {
  id: string
  kicker: string
  title: string
  subtitle: string
  button_label: string
  button_href: string
  icon: BrandIconName
  color: BrandColor
  image_path: string | null
  active: boolean
  position: number
}

export type Testimonial = { id: string; quote: string; author: string; place: string; stars: number; active: boolean; position: number }
export type SpecialDate = { id: string; name: string; day: string; order_by: string; active: boolean }

export type OrderItem = {
  id: string
  product_id: string | null
  product_name: string
  color: string
  personalization: string
  gift: boolean
  gift_message: string
  qty: number
  unit_cents: number
}

export type Order = {
  id: string
  number: number
  source: OrderSource
  status: OrderStatus
  customer_name: string
  customer_phone: string
  needed_by: string | null
  notes: string
  total_cents: number
  agreed_cents: number | null
  custom_type: string | null
  custom_description: string | null
  custom_colors: string[]
  custom_size: string | null
  custom_qty: number | null
  reference_path: string | null
  stock_applied: boolean
  seen_at: string | null
  created_at: string
  items: OrderItem[]
}

/** Item da "minha lista" guardado no navegador */
export type ListItem = {
  key: string
  product_id: string
  slug: string
  name: string
  icon: BrandIconName
  color: BrandColor
  price_cents: number
  gift_wrap_cents: number
  colorName: string
  personalization: string
  gift: boolean
  gift_message: string
  qty: number
}
