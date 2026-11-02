'use client'
import { useOptimistic, useTransition } from 'react'
import { updateStockAlert } from '@/app/admin/actions'
import { formatPhone } from '@/lib/format'
import type { StockAlert } from '@/lib/types'
import { waLink } from '@/lib/whatsapp'
import { Icon } from '../icons'

/** Quem pediu “avisar quando voltar” para esta peça. */
export function StockAlerts({ alerts, productName, productUrl }: { alerts: StockAlert[]; productName: string; productUrl: string }) {
  const [list, apply] = useOptimistic(alerts, (cur, a: { id: string; action: 'avisado' | 'pendente' | 'apagar' }) =>
    a.action === 'apagar' ? cur.filter((x) => x.id !== a.id) : cur.map((x) => (x.id === a.id ? { ...x, notified: a.action === 'avisado' } : x)),
  )
  const [, start] = useTransition()
  const act = (id: string, action: 'avisado' | 'pendente' | 'apagar') =>
    start(async () => {
      apply({ id, action })
      await updateStockAlert(id, action)
    })
  const waiting = list.filter((a) => !a.notified).length

  return (
    <section className="panel-box pad stack">
      <div className="row between">
        <h2 className="t-h3">Esperando voltar</h2>
        {waiting ? <span className="side-count">{waiting}</span> : null}
      </div>
      <p className="t-sm t-muted">Clientes que pediram aviso quando a peça voltar ao estoque.</p>
      {list.length ? (
        <ul className="alerts">
          {list.map((a) => {
            const msg = `Oi, ${a.name}! Aqui é a Cintia, da CB3D 💖 O ${productName} voltou! Ainda quer? ${productUrl}`
            const phone = a.phone.length <= 11 ? `55${a.phone}` : a.phone
            return (
              <li key={a.id} className={a.notified ? 'is-done' : ''}>
                <span className="grow">
                  <strong>{a.name}</strong>
                  <span className="t-sm t-muted">
                    {formatPhone(a.phone)} · {a.notified ? 'já avisada' : 'esperando'}
                  </span>
                </span>
                <a className="icon-btn small wa" href={waLink(phone, msg)} target="_blank" rel="noopener" aria-label={`Avisar ${a.name} no WhatsApp`} onClick={() => !a.notified && act(a.id, 'avisado')}>
                  <Icon name="whatsapp" size={18} />
                </a>
                <button type="button" className="icon-btn small" aria-label={a.notified ? 'Marcar como não avisada' : 'Marcar como avisada'} onClick={() => act(a.id, a.notified ? 'pendente' : 'avisado')}>
                  <Icon name={a.notified ? 'seta-esq' : 'check'} size={16} />
                </button>
                <button type="button" className="icon-btn small" aria-label={`Apagar ${a.name} da lista`} onClick={() => act(a.id, 'apagar')}>
                  <Icon name="lixeira" size={16} />
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="t-sm">Ninguém na espera.</p>
      )}
    </section>
  )
}
