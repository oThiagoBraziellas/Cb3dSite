'use client'
import { useActionState, useState } from 'react'
import { subscribeStockAlert } from '@/app/(site)/actions'
import { money } from '@/lib/format'
import { actions } from '@/lib/store'
import type { Product } from '@/lib/types'
import { waLink } from '@/lib/whatsapp'
import { Icon } from '../icons'

export function ProductBuy({ product, whatsapp, available }: { product: Product; whatsapp: string; available: boolean }) {
  const [color, setColor] = useState(product.colors[0]?.name ?? '')
  const [name, setName] = useState('')
  const [gift, setGift] = useState(false)
  const [giftMsg, setGiftMsg] = useState('')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(0)
  const unit = product.price_cents + (gift ? product.gift_wrap_cents : 0)

  const add = () => {
    actions.add({
      product_id: product.id,
      slug: product.slug,
      name: product.name,
      icon: product.icon,
      color: product.color,
      price_cents: product.price_cents,
      gift_wrap_cents: product.gift_wrap_cents,
      colorName: color,
      personalization: name.trim(),
      gift,
      gift_message: gift ? giftMsg.trim() : '',
      qty,
    })
    setAdded((a) => a + 1)
    window.setTimeout(() => setAdded(0), 1400)
  }

  const onlyThis = [
    `Oi, Cintia! 💖 Vim pelo site e quero:`,
    `• ${qty}x ${product.name}${color ? ` (${color})` : ''}${name ? ` · nome: ${name}` : ''}${gift ? ' · presente 🎁' : ''}`,
    `Valor: ${money(unit * qty)}`,
  ].join('\n')

  if (!available && product.stock_policy === 'avisar') return <StockAlert product={product} />
  if (!available)
    return (
      <div className="note">
        <Icon name="relogio" />
        <span>Essa peça esgotou. Que tal ver outras parecidas ou pedir uma personalizada?</span>
      </div>
    )

  return (
    <div className="buy stack-lg">
      {product.colors.length ? (
        <fieldset className="fgroup">
          <legend>
            <span className="t-bold">Cor:</span> {color}
          </legend>
          <div className="swatches" role="radiogroup" aria-label="Cor">
            {product.colors.map((c) => (
              <label key={c.id} className="swatch" title={c.name}>
                <input type="radio" name="cor" value={c.name} checked={color === c.name} onChange={() => setColor(c.name)} aria-label={c.name} />
                <span style={{ background: c.hex }} />
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="buy-row">
        {product.customizable ? (
          <label className="field grow">
            <span>Nome para gravar (opcional)</span>
            <input className="input" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Helena" />
          </label>
        ) : null}
        <div className="field">
          <span>Quantidade</span>
          <Stepper value={qty} onChange={setQty} label={product.name} />
        </div>
      </div>

      {product.gift_wrap ? (
        <div className="gift box box-soft">
          <label className="check">
            <input type="checkbox" checked={gift} onChange={(e) => setGift(e.target.checked)} />
            <span>
              <strong>É pra presente 🎁</strong>
              <span className="hint" style={{ display: 'block' }}>
                Embalagem com laço e cartãozinho (+ {money(product.gift_wrap_cents)})
              </span>
            </span>
          </label>
          {gift ? (
            <label className="field">
              <span>Mensagem do cartão</span>
              <input className="input" maxLength={200} value={giftMsg} onChange={(e) => setGiftMsg(e.target.value)} placeholder="Escreva um recadinho curto" />
            </label>
          ) : null}
        </div>
      ) : null}

      <div className="buy-ctas">
        <button type="button" className={`btn btn-lg btn-block${added ? ' btn-ok' : ''}`} onClick={add} aria-live="polite">
          {added ? (
            <>
              <Icon name="check" /> Na sua lista!
            </>
          ) : (
            <>Adicionar à minha lista · {money(unit * qty)}</>
          )}
        </button>
        <a className="btn btn-whats btn-lg btn-block" href={waLink(whatsapp, onlyThis)} target="_blank" rel="noopener">
          <Icon name="whatsapp" /> Pedir só esta
        </a>
      </div>
    </div>
  )
}

export function Stepper({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="stepper" role="group" aria-label={`Quantidade de ${label}`}>
      <button type="button" className="icon-btn" aria-label="Diminuir" onClick={() => onChange(Math.max(1, value - 1))} disabled={value <= 1}>
        <Icon name="menos" size={18} />
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" className="icon-btn is-yellow" aria-label="Aumentar" onClick={() => onChange(Math.min(99, value + 1))}>
        <Icon name="mais" size={18} />
      </button>
    </div>
  )
}

function StockAlert({ product }: { product: Product }) {
  const [state, action, pending] = useActionState(subscribeStockAlert, null)
  if (state?.ok)
    return (
      <div className="note">
        <Icon name="check" />
        <span>Combinado! A Cintia te chama no WhatsApp quando essa peça voltar.</span>
      </div>
    )
  return (
    <form action={action} className="box box-soft stack">
      <strong className="t-h4">Esgotou por enquanto 😢</strong>
      <p className="t-sm">Deixa seu WhatsApp que a Cintia te avisa quando voltar.</p>
      <input type="hidden" name="product_id" value={product.id} />
      <div className="honeypot" aria-hidden>
        <label>
          Não preencha <input name="site" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="field">
        <span>Seu nome</span>
        <input className="input" name="name" required maxLength={80} autoComplete="given-name" />
      </label>
      <label className="field">
        <span>Seu WhatsApp</span>
        <input className="input" name="phone" required inputMode="tel" autoComplete="tel" placeholder="(61) 9 0000-0000" />
      </label>
      {state?.error ? <p className="error-text">{state.error}</p> : null}
      <button className="btn btn-lg" disabled={pending}>
        {pending ? 'Enviando…' : 'Avisar quando voltar'}
      </button>
    </form>
  )
}
