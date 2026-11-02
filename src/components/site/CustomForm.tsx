'use client'
import { useActionState, useState } from 'react'
import { submitCustomRequest, type CustomState } from '@/app/(site)/actions'
import { customMessage, waLink } from '@/lib/whatsapp'
import { BrandIcon, Icon } from '../icons'

const TYPES = ['Presente', 'Decoração', 'Brinquedo', 'Chaveiro', 'Lembrancinha', 'Outra']
const SIZES = ['Pequeno (até 5 cm)', 'Médio (até 12 cm)', 'Grande (até 20 cm)', 'Não sei']
const COLORS = [
  { name: 'Rosa', hex: '#F9208D' },
  { name: 'Amarelo', hex: '#FCD715' },
  { name: 'Azul', hex: '#05BDFC' },
  { name: 'Roxo', hex: '#8C43F5' },
  { name: 'Branco', hex: '#FFFFFF' },
  { name: 'Preto', hex: '#0C042D' },
]

export function CustomForm({ whatsapp }: { whatsapp: string }) {
  const [state, action, pending] = useActionState<CustomState, FormData>(submitCustomRequest, null)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const today = new Date().toISOString().slice(0, 10)

  if (state?.ok) {
    const url = waLink(whatsapp, customMessage({ number: state.number, ...state.wa }))
    return (
      <div className="box stack center sent">
        <BrandIcon name="impressora" size={120} />
        <h2 className="t-h1">Ideia enviada{state.number ? ` (#${state.number})` : ''}! ✨</h2>
        <p className="t-lg">A Cintia já recebeu e vai responder com o valor e o prazo. Se quiser adiantar, chama ela no WhatsApp:</p>
        <a href={url} target="_blank" rel="noopener" className="btn btn-whats btn-lg">
          <Icon name="whatsapp" /> Falar com a Cintia agora
        </a>
      </div>
    )
  }

  return (
    <form action={action} className="custom-form stack-xl" encType="multipart/form-data">
      <div className="honeypot" aria-hidden>
        <label>
          Não preencha <input name="site" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset className="box stack-lg">
        <legend className="t-h2 legend-in">1 · Sua ideia</legend>
        <div className="fgroup">
          <span className="label">Que tipo de peça?</span>
          <div className="chips">
            {TYPES.map((t, i) => (
              <label key={t} className="chip chip-input">
                <input type="radio" name="type" value={t} defaultChecked={i === 0} />
                {t}
              </label>
            ))}
          </div>
        </div>
        <div className="two-fields">
          <label className="field">
            <span>Descreva a ideia (ou o texto que vai na peça)</span>
            <textarea className="textarea" name="description" required minLength={5} maxLength={2000} rows={5} placeholder="Ex.: 30 chaveirinhos de unicórnio com o nome “Alice 5 anos” pra festa…" />
          </label>
          <label className="field">
            <span>Foto de referência (opcional)</span>
            <span className={`upload${preview ? ' has-file' : ''}`}>
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Prévia da foto escolhida" />
              ) : (
                <>
                  <Icon name="upload" size={32} />
                  <strong>Toque pra enviar uma foto</strong>
                  <span className="hint">JPG, PNG ou WebP, até 10 MB</span>
                </>
              )}
              <input
                type="file"
                name="photo"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  setFileName(f?.name ?? '')
                  setPreview(f ? URL.createObjectURL(f) : null)
                }}
              />
            </span>
            {fileName ? <span className="hint">{fileName}</span> : null}
          </label>
        </div>
      </fieldset>

      <fieldset className="box stack-lg">
        <legend className="t-h2 legend-in">2 · Detalhes</legend>
        <div className="fgroup">
          <span className="label">Cores (pode escolher mais de uma)</span>
          <div className="swatches">
            {COLORS.map((c) => (
              <label key={c.name} className="swatch" title={c.name}>
                <input type="checkbox" name="colors" value={c.name} aria-label={c.name} />
                <span style={{ background: c.hex }} />
              </label>
            ))}
          </div>
        </div>
        <div className="fgroup">
          <span className="label">Tamanho aproximado</span>
          <div className="chips">
            {SIZES.map((s, i) => (
              <label key={s} className="chip chip-input">
                <input type="radio" name="size" value={s} defaultChecked={i === 3} />
                {s}
              </label>
            ))}
          </div>
        </div>
        <label className="field narrow">
          <span>Quantidade</span>
          <input className="input" name="qty" type="number" min={1} max={10000} defaultValue={1} inputMode="numeric" />
        </label>
      </fieldset>

      <fieldset className="box stack-lg">
        <legend className="t-h2 legend-in">3 · Contato e data</legend>
        <div className="three-fields">
          <label className="field">
            <span>Seu nome</span>
            <input className="input" name="name" required maxLength={80} autoComplete="given-name" placeholder="Como posso te chamar?" />
          </label>
          <label className="field">
            <span>Seu WhatsApp</span>
            <input className="input" name="phone" required inputMode="tel" autoComplete="tel" placeholder="(61) 9 0000-0000" />
          </label>
          <label className="field">
            <span>Pra quando você precisa?</span>
            <input className="input" name="needed_by" type="date" min={today} />
          </label>
        </div>
        <label className="check">
          <input type="checkbox" name="consent" required />
          <span>
            Concordo que a Cintia use esses dados só pra responder meu pedido (
            <a href="/privacidade" className="link" target="_blank">
              Política de privacidade
            </a>
            ).
          </span>
        </label>
      </fieldset>

      {state && !state.ok ? (
        <p className="error-text" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="row wrap-row">
        <button className="btn btn-lg" disabled={pending}>
          {pending ? 'Enviando…' : 'Enviar ideia'}
        </button>
        <span className="hint">Depois você pode conversar com a Cintia no WhatsApp.</span>
      </div>
      <div className="note">
        <BrandIcon name="brilho" size={24} />
        <span>Peças personalizadas são feitas só pra você. Por isso, a troca vale apenas se a peça chegar com defeito.</span>
      </div>
    </form>
  )
}
