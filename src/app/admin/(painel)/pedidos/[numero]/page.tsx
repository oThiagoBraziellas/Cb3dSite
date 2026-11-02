import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { OrderEditor } from '@/components/admin/OrderEditor'
import { MobileTop } from '@/components/admin/Shell'
import { PageHead, StatusTag } from '@/components/admin/ui'
import { Icon } from '@/components/icons'
import { getOrder } from '@/lib/admin'
import { dateBR, formatPhone, money } from '@/lib/format'
import { waLink } from '@/lib/whatsapp'

export const metadata: Metadata = { title: 'Pedido' }

export default async function PedidoPage({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params
  const o = await getOrder(Number(numero))
  if (!o) notFound()
  const created = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(o.created_at))
  const hello = `Oi, ${o.customer_name}! Aqui é a Cintia, da CB3D 💖 Recebi seu pedido #${o.number}.`

  return (
    <>
      <MobileTop title={`Pedido #${o.number}`} back="/admin/pedidos" />
      <div className="p-body">
        <PageHead kicker={`recebido em ${created}`} title={`Pedido #${o.number}`}>
          <StatusTag status={o.status} />
        </PageHead>
        <div className="order-cols">
          <div className="stack-lg">
            <section className="panel-box pad">
              <div className="row between">
                <div>
                  <h2 className="t-h2">{o.customer_name}</h2>
                  <p className="t-sm t-muted">
                    {o.customer_phone ? formatPhone(o.customer_phone) : 'sem WhatsApp'} · via {o.source === 'personalizado' ? 'formulário' : o.source === 'lista' ? 'lista do site' : 'cadastro manual'}
                  </p>
                </div>
                {o.customer_phone ? (
                  <a className="icon-btn wa" href={waLink(o.customer_phone.length <= 11 ? `55${o.customer_phone}` : o.customer_phone, hello)} target="_blank" rel="noopener" aria-label="Responder no WhatsApp">
                    <Icon name="whatsapp" />
                  </a>
                ) : null}
              </div>
            </section>

            {o.source === 'personalizado' ? (
              <section className="panel-box pad soft stack">
                <h2 className="t-h3">Peça personalizada</h2>
                <dl className="kv">
                  <dt>Tipo</dt>
                  <dd>{o.custom_type}</dd>
                  <dt>Quantidade</dt>
                  <dd>{o.custom_qty}</dd>
                  <dt>Cores</dt>
                  <dd>{o.custom_colors.join(', ') || '—'}</dd>
                  <dt>Tamanho</dt>
                  <dd>{o.custom_size}</dd>
                  <dt>Precisa até</dt>
                  <dd>{dateBR(o.needed_by) || '—'}</dd>
                </dl>
                <p className="quote-text">“{o.custom_description}”</p>
                {o.reference_url ? (
                  <a href={o.reference_url} target="_blank" rel="noopener" className="ref-photo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={o.reference_url} alt="Foto de referência enviada pela cliente" />
                  </a>
                ) : o.reference_path === null ? (
                  <p className="hint">Sem foto de referência.</p>
                ) : null}
              </section>
            ) : (
              <section className="panel-box">
                <div className="box-head">
                  <h2 className="t-h3">Peças</h2>
                </div>
                <ul className="items">
                  {o.items.map((i) => (
                    <li key={i.id}>
                      <span className="grow">
                        <strong>
                          {i.qty}× {i.product_name}
                        </strong>
                        <span className="t-sm t-muted">
                          {[i.color, i.personalization && `nome: ${i.personalization}`, i.gift && `presente 🎁${i.gift_message ? ` “${i.gift_message}”` : ''}`].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <strong>{money(i.unit_cents * i.qty)}</strong>
                    </li>
                  ))}
                  <li className="total">
                    <span className="grow t-h4">Total da lista</span>
                    <strong className="t-price">{money(o.total_cents)}</strong>
                  </li>
                </ul>
                {o.needed_by ? <p className="pad-x t-sm">Precisa até {dateBR(o.needed_by)}</p> : null}
                {o.notes ? <p className="pad-x t-sm t-muted">Obs.: {o.notes}</p> : null}
              </section>
            )}
          </div>
          <OrderEditor
            id={o.id}
            seen={!!o.seen_at}
            status={o.status}
            agreed={o.agreed_cents != null ? (o.agreed_cents / 100).toFixed(2).replace('.', ',') : ''}
            notes={o.source === 'personalizado' ? o.notes : ''}
            showNotes={o.source === 'personalizado'}
            stockApplied={o.stock_applied}
          />
        </div>
      </div>
    </>
  )
}
