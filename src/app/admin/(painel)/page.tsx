import Link from 'next/link'
import { MobileTop } from '@/components/admin/Shell'
import { OrdersTable, PageHead, orderSummary } from '@/components/admin/ui'
import { OnlineToggle } from '@/components/admin/OnlineToggle'
import { BrandIcon, Icon } from '@/components/icons'
import { getAdminProducts, getOrderCounts, getOrders, getSiteContent } from '@/lib/admin'
import { dateBR } from '@/lib/format'

export default async function AdminHome() {
  const [orders, counts, products, content] = await Promise.all([getOrders(), getOrderCounts(), getAdminProducts(), getSiteContent()])
  const soldOut = products.filter((p) => p.stock === 0 && p.stock_policy !== 'encomenda').length
  const fresh = orders.filter((o) => !o.seen_at)
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' }).format(new Date()))
  const hi = hour < 12 ? 'bom dia, Cintia!' : hour < 18 ? 'boa tarde, Cintia!' : 'boa noite, Cintia!'

  return (
    <>
      <MobileTop title="Olá, Cintia 💖" />
      <div className="p-body">
        <PageHead kicker={hi} title="Início">
          <OnlineToggle mode={content.settings.online_mode} />
          <Link href="/admin/produtos/nova" className="btn">
            <Icon name="mais" size={18} /> Nova peça
          </Link>
        </PageHead>

        {fresh.slice(0, 2).map((o) => (
          <Link key={o.id} href={`/admin/pedidos/${o.number}`} className="alert-new">
            <BrandIcon name="brilho" size={40} />
            <span className="grow">
              <strong className="t-h4">
                Novo {o.source === 'personalizado' ? 'pedido personalizado' : 'pedido'} de {o.customer_name}
              </strong>
              <span className="t-sm cell-trunc">
                {orderSummary(o)}
                {o.needed_by ? ` · precisa até ${dateBR(o.needed_by)}` : ''}
              </span>
            </span>
            <span className="btn btn-branco only-desktop">Abrir pedido</span>
            <Icon name="seta-dir" className="only-mobile" />
          </Link>
        ))}

        <div className="stats">
          {(
            [
              [counts.orcamento, 'Orçamentos', 'var(--bg-surface)', 'pedidos', '/admin/pedidos?status=orcamento'],
              [counts.producao, 'Em produção', 'var(--brand-azul)', 'impressora', '/admin/pedidos?status=producao'],
              [counts.pronto, 'Prontos pra retirar', 'var(--brand-amarelo)', 'presente', '/admin/pedidos?status=pronto'],
              [soldOut, 'Peças sem estoque', 'var(--brand-rosa)', 'caixa', '/admin/produtos?status=sem-estoque'],
            ] as const
          ).map(([n, l, bg, ic, href]) => (
            <Link key={l} href={href} className="stat" style={{ background: bg }}>
              <span className="row between">
                <strong className="stat-n">{n}</strong>
                {ic === 'impressora' || ic === 'presente' ? <BrandIcon name={ic} size={52} /> : <Icon name={ic} size={40} />}
              </span>
              <span className="t-bold">{l}</span>
            </Link>
          ))}
        </div>

        <section className="panel-box">
          <div className="row between box-head">
            <h2 className="t-h3">Pedidos recentes</h2>
            <Link href="/admin/pedidos" className="link">
              Ver todos
            </Link>
          </div>
          <OrdersTable orders={orders.slice(0, 6)} />
        </section>
      </div>
    </>
  )
}
