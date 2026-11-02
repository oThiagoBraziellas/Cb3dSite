'use client'
import { useEffect, useState, useTransition } from 'react'
import { markOrderSeen, updateOrder } from '@/app/admin/actions'
import { statusLabel } from '@/lib/admin-shared'
import type { OrderStatus } from '@/lib/types'

const order: OrderStatus[] = ['orcamento', 'producao', 'pronto', 'entregue', 'cancelado']

export function OrderEditor(p: { id: string; seen: boolean; status: OrderStatus; agreed: string; notes: string; showNotes: boolean; stockApplied: boolean }) {
  const [status, setStatus] = useState(p.status)
  const [agreed, setAgreed] = useState(p.agreed)
  const [notes, setNotes] = useState(p.notes)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()

  useEffect(() => {
    if (!p.seen) markOrderSeen(p.id)
  }, [p.id, p.seen])

  const save = (patch: Parameters<typeof updateOrder>[0]) =>
    start(async () => {
      const r = await updateOrder(patch)
      setMsg(r.ok ? { ok: true, text: r.message ?? 'Salvo' } : { ok: false, text: r.error })
    })

  return (
    <aside className="panel-box pad stack-lg order-side">
      <h2 className="t-h3">Status do pedido</h2>
      <div className="chips" role="radiogroup" aria-label="Status">
        {order.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={status === s}
            className={`chip st-chip st-${s}`}
            disabled={pending}
            onClick={() => {
              setStatus(s)
              save({ id: p.id, status: s })
            }}
          >
            {statusLabel[s]}
          </button>
        ))}
      </div>
      <p className="hint">
        {p.stockApplied || status === 'producao' || status === 'pronto' || status === 'entregue'
          ? 'O estoque já foi descontado. Cancelar devolve as peças ao estoque.'
          : 'Ao mudar para “Em produção”, o estoque das peças baixa sozinho.'}
      </p>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault()
          save({ id: p.id, agreed, ...(p.showNotes ? { notes } : {}) })
        }}
      >
        <label className="field">
          <span>Valor combinado (R$)</span>
          <input className="input" inputMode="decimal" value={agreed} onChange={(e) => setAgreed(e.target.value)} placeholder="Ex.: 150,00" />
        </label>
        {p.showNotes ? (
          <label className="field">
            <span>Anotações (só você vê)</span>
            <textarea className="textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
          </label>
        ) : null}
        <button className="btn" disabled={pending}>
          {pending ? 'Salvando…' : 'Salvar'}
        </button>
      </form>
      {msg ? (
        <p className={msg.ok ? 'ok-text' : 'error-text'} role="status">
          {msg.text}
        </p>
      ) : null}
    </aside>
  )
}
