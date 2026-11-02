import Link from 'next/link'
import { statusLabel } from '@/lib/admin-shared'
import { dateBR, money } from '@/lib/format'
import type { Order, OrderStatus } from '@/lib/types'

export function StatusTag({ status }: { status: OrderStatus }) {
  return (
    <span className={`st st-${status}`}>
      <span aria-hidden className="st-dot" />
      {statusLabel[status]}
    </span>
  )
}

export function PageHead({ kicker, title, children }: { kicker?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="p-head">
      <div className="section-title">
        {kicker ? <span className="t-script">{kicker}</span> : null}
        <h1 className="t-h1">{title}</h1>
      </div>
      {children ? <div className="row wrap-row">{children}</div> : null}
    </div>
  )
}

export function orderSummary(o: Order) {
  if (o.source === 'personalizado') return `${o.custom_qty ?? 1}× ${o.custom_type ?? 'Personalizada'}: ${o.custom_description ?? ''}`
  return o.items.map((i) => `${i.qty}× ${i.product_name}`).join(', ')
}

export function orderValue(o: Order) {
  if (o.agreed_cents != null) return money(o.agreed_cents)
  if (o.source === 'personalizado') return 'a orçar'
  return money(o.total_cents)
}

export function OrdersTable({ orders }: { orders: Order[] }) {
  if (!orders.length) return <p className="box t-muted">Nenhum pedido por aqui.</p>
  return (
    <>
      <div className="table-wrap only-desktop-block">
        <table className="table">
          <thead>
            <tr>
              <th>Nº</th>
              <th>Cliente</th>
              <th>Peças</th>
              <th>Origem</th>
              <th>Status</th>
              <th>Valor</th>
              <th>Precisa até</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className={!o.seen_at ? 'is-new' : ''}>
                <td>
                  <Link href={`/admin/pedidos/${o.number}`} className="t-bold row-link">
                    #{o.number}
                  </Link>
                </td>
                <td className="t-bold">
                  {o.customer_name} {!o.seen_at ? <span className="badge badge-encomenda">novo</span> : null}
                </td>
                <td className="cell-trunc">{orderSummary(o)}</td>
                <td>{o.source === 'personalizado' ? 'Formulário' : o.source === 'lista' ? 'Lista do site' : 'Manual'}</td>
                <td>
                  <StatusTag status={o.status} />
                </td>
                <td className="t-bold">{orderValue(o)}</td>
                <td>{dateBR(o.needed_by) || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="order-cards only-mobile-block">
        {orders.map((o) => (
          <li key={o.id}>
            <Link href={`/admin/pedidos/${o.number}`} className={`order-card${!o.seen_at ? ' is-new' : ''}`}>
              <span className="row between">
                <strong>
                  #{o.number} · {o.customer_name}
                </strong>
                <StatusTag status={o.status} />
              </span>
              <span className="row between">
                <span className="t-sm t-muted cell-trunc">{orderSummary(o)}</span>
                <strong>{orderValue(o)}</strong>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
