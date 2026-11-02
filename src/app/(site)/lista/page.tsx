import type { Metadata } from 'next'
import { ListView } from '@/components/site/ListView'
import { getProducts, getSettings, isAvailable } from '@/lib/data'

export const metadata: Metadata = { title: 'Minha lista', robots: { index: false } }

export default async function ListaPage() {
  const [products, settings] = await Promise.all([getProducts(), getSettings()])
  const live = Object.fromEntries(products.map((p) => [p.id, { price_cents: p.price_cents, available: isAvailable(p), icon: p.icon, color: p.color }]))
  return (
    <div className="wrap section-top stack-xl">
      <div className="section-title">
        <span className="t-script">seu pedido, do seu jeito</span>
        <h1 className="t-hero">Minha lista</h1>
        <p className="t-lg t-muted">Aqui não tem pagamento online: a lista vai pro WhatsApp da Cintia e vocês combinam tudo por lá.</p>
      </div>
      <ListView whatsapp={settings.whatsapp} live={live} pickupText={settings.pickup_text} />
    </div>
  )
}
