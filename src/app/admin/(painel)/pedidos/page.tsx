import type { Metadata } from 'next'
import Link from 'next/link'
import { MobileTop } from '@/components/admin/Shell'
import { OrdersTable, PageHead } from '@/components/admin/ui'
import { getOrders, statusLabel } from '@/lib/admin'
import type { OrderStatus } from '@/lib/types'

export const metadata: Metadata = { title: 'Pedidos' }

const tabs: (OrderStatus | 'novos' | undefined)[] = [undefined, 'novos', 'orcamento', 'producao', 'pronto', 'entregue', 'cancelado']

export default async function PedidosPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams
  const current = tabs.includes(status as OrderStatus) ? (status as OrderStatus | 'novos') : undefined
  const orders = await getOrders(current)
  return (
    <>
      <MobileTop title="Pedidos" />
      <div className="p-body">
        <PageHead kicker="quem pediu o quê" title="Pedidos" />
        <div className="chips-scroll">
          {tabs.map((t) => (
            <Link key={t ?? 'todos'} href={t ? `/admin/pedidos?status=${t}` : '/admin/pedidos'} className="chip" aria-current={current === t}>
              {t === undefined ? 'Todos' : t === 'novos' ? 'Novos' : statusLabel[t]}
            </Link>
          ))}
        </div>
        <section className="panel-box">
          <OrdersTable orders={orders} />
        </section>
        <p className="hint">
          Quando um pedido vai pra “Em produção”, o estoque das peças baixa sozinho. Se cancelar, ele volta.
        </p>
      </div>
    </>
  )
}
