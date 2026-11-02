'use client'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { submitOrder } from '@/app/(site)/actions'
import { colorVar, money } from '@/lib/format'
import { actions, listTotal, useStore } from '@/lib/store'
import type { BrandColor } from '@/lib/types'
import { listMessage, waLink } from '@/lib/whatsapp'
import { BrandIcon, Icon, type BrandIconName } from '../icons'
import { Stepper } from './ProductBuy'

type Live = Record<string, { price_cents: number; available: boolean; icon: BrandIconName; color: BrandColor }>

export function ListView({ whatsapp, live, pickupText }: { whatsapp: string; live: Live; pickupText: string }) {
  const store = useStore()
  // preço sempre o atual do catálogo
  const items = store.list.map((i) => (live[i.product_id] ? { ...i, price_cents: live[i.product_id].price_cents } : i))
  const unavailable = items.filter((i) => !live[i.product_id]?.available)
  const total = listTotal({ list: items, favs: [] })
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [neededBy, setNeededBy] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState<{ number: number | null; url: string } | null>(null)
  const [pending, start] = useTransition()
  const today = new Date().toISOString().slice(0, 10)

  const preview = listMessage({ items, name: name || '…', neededBy, notes })

  const send = () => {
    setError('')
    if (!name.trim()) {
      setError('Coloca seu nome pra Cintia saber quem é 🙂')
      document.getElementById('lista-nome')?.focus()
      return
    }
    // abre a aba já no clique (o navegador bloqueia pop-up depois de esperar)
    const tab = window.open('about:blank', '_blank')
    start(async () => {
      const res = await submitOrder({
        name,
        phone,
        neededBy: neededBy || undefined,
        notes,
        items: items.map((i) => ({ product_id: i.product_id, qty: i.qty, color: i.colorName, personalization: i.personalization, gift: i.gift, gift_message: i.gift_message })),
      })
      if (!res.ok) {
        tab?.close()
        setError(res.error)
        return
      }
      const url = waLink(whatsapp, listMessage({ items, name, neededBy, notes, orderNumber: res.number }))
      if (tab) tab.location.href = url
      else window.location.href = url
      setSent({ number: res.number, url })
      actions.clear()
    })
  }

  if (sent)
    return (
      <div className="box stack center sent">
        <BrandIcon name="presente" size={120} />
        <h2 className="t-h1">Lista enviada{sent.number ? ` (#${sent.number})` : ''}! 💖</h2>
        <p className="t-lg">Agora é só mandar a mensagem no WhatsApp. A Cintia confirma valor, prazo e retirada com você.</p>
        <a href={sent.url} className="btn btn-whats btn-lg" target="_blank" rel="noopener">
          <Icon name="whatsapp" /> Abrir o WhatsApp de novo
        </a>
        <Link href="/catalogo" className="link">
          Voltar pro catálogo
        </Link>
      </div>
    )

  if (!items.length)
    return (
      <div className="box stack center empty">
        <BrandIcon name="bobina" size={110} />
        <h2 className="t-h2">Sua lista está vazia</h2>
        <p className="t-muted">Escolha as peças no catálogo e elas aparecem aqui.</p>
        <Link href="/catalogo" className="btn btn-lg">
          Ver o catálogo
        </Link>
      </div>
    )

  return (
    <div className="list-cols">
      <div className="stack-lg">
        <ul className="list-items">
          {items.map((i) => {
            const info = live[i.product_id]
            return (
              <li key={i.key} className="list-item">
                <Link href={`/catalogo/${i.slug}`} className="list-thumb" style={{ background: colorVar(info?.color ?? i.color) }} aria-label={i.name}>
                  <BrandIcon name={info?.icon ?? i.icon} size={72} />
                </Link>
                <div className="list-info">
                  <Link href={`/catalogo/${i.slug}`} className="t-h3 plain">
                    {i.name}
                  </Link>
                  <span className="t-sm t-muted">
                    {[i.colorName && `Cor: ${i.colorName}`, i.personalization && `Nome: ${i.personalization}`, i.gift && 'É pra presente 🎁'].filter(Boolean).join(' · ')}
                  </span>
                  {i.gift ? (
                    <label className="field">
                      <span className="t-sm">Mensagem do cartão</span>
                      <input className="input" maxLength={200} value={i.gift_message} onChange={(e) => actions.update(i.key, { gift_message: e.target.value })} placeholder="Recadinho curto" />
                    </label>
                  ) : null}
                  {!info?.available ? <span className="error-text">Essa peça não está disponível agora.</span> : null}
                  <button type="button" className="plain-btn t-sm t-muted" onClick={() => actions.remove(i.key)}>
                    <Icon name="lixeira" size={16} /> Remover
                  </button>
                </div>
                <div className="list-side">
                  <Stepper value={i.qty} onChange={(n) => actions.setQty(i.key, n)} label={i.name} />
                  <span className="t-price">{money((i.price_cents + (i.gift ? i.gift_wrap_cents : 0)) * i.qty)}</span>
                </div>
              </li>
            )
          })}
        </ul>
        <Link href="/catalogo" className="row link">
          <Icon name="seta-esq" size={20} /> Continuar escolhendo peças
        </Link>
      </div>

      <aside className="summary box stack-lg" aria-label="Resumo do pedido">
        <h2 className="t-h2">Resumo do pedido</h2>
        <dl className="sum-lines">
          <div>
            <dt>Subtotal ({items.reduce((n, i) => n + i.qty, 0)} peças)</dt>
            <dd>{money(total)}</dd>
          </div>
          <div>
            <dt>Pagamento</dt>
            <dd>Pix, combinado no WhatsApp</dd>
          </div>
          <div>
            <dt>Entrega</dt>
            <dd>{pickupText}</dd>
          </div>
          <div className="sum-total">
            <dt className="t-h3">Total estimado</dt>
            <dd className="t-price">{money(total)}</dd>
          </div>
        </dl>
        <label className="field">
          <span>Seu nome</span>
          <input id="lista-nome" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="given-name" placeholder="Como posso te chamar?" required />
        </label>
        <label className="field">
          <span>Seu WhatsApp (opcional)</span>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="(61) 9 0000-0000" />
        </label>
        <label className="field">
          <span>Pra quando você precisa?</span>
          <input className="input" type="date" min={today} value={neededBy} onChange={(e) => setNeededBy(e.target.value)} />
        </label>
        <label className="field">
          <span>Observações</span>
          <textarea className="textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} placeholder="Algum detalhe a mais?" />
        </label>
        {error ? (
          <p className="error-text" role="alert">
            {error}
          </p>
        ) : null}
        <button type="button" className="btn btn-whats btn-lg btn-block" onClick={send} disabled={pending || unavailable.length > 0}>
          <Icon name="whatsapp" /> {pending ? 'Preparando…' : 'Enviar lista pelo WhatsApp'}
        </button>
        {unavailable.length ? <p className="error-text">Tira da lista as peças indisponíveis pra continuar.</p> : null}
        <div className="stack-sm">
          <strong>Prévia da mensagem</strong>
          <pre className="bubble">{preview}</pre>
          <p className="hint">Dá pra editar a mensagem no WhatsApp antes de enviar.</p>
        </div>
      </aside>
    </div>
  )
}
