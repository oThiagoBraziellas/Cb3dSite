'use client'
import { useState, useTransition } from 'react'
import { saveList, savePrivateSettings, saveSettings, saveTaxonomy, type ActionResult } from '@/app/admin/actions'
import { colorVar } from '@/lib/format'
import type { Category, Hours, Occasion, Settings, Slide, SpecialDate, Testimonial } from '@/lib/types'
import { BrandIcon, brandIconNames, Icon } from '../icons'

function useSave() {
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const run = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      const r = await fn()
      setMsg(r.ok ? { ok: true, text: r.message ?? 'Salvo' } : { ok: false, text: r.error })
    })
  const Msg = () => (msg ? <span className={msg.ok ? 'ok-text' : 'error-text'} role="status">{msg.text}</span> : null)
  return { pending, run, Msg }
}

function Card({ title, hint, right, children }: { title: string; hint?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="panel-box pad stack-lg">
      <div className="row between wrap-row">
        <div>
          <h2 className="t-h3">{title}</h2>
          {hint ? <p className="t-sm t-muted">{hint}</p> : null}
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="switch" onClick={() => onChange(!checked)}>
      <span className="sr-only">{label}</span>
    </button>
  )
}

const moveIn = <T,>(arr: T[], i: number, d: number) => {
  const n = [...arr]
  const j = i + d
  if (j < 0 || j >= n.length) return arr
  ;[n[i], n[j]] = [n[j], n[i]]
  return n
}

/* ------------------------- categorias e ocasiões ------------------------- */
export function TaxonomyEditor({ categories, occasions }: { categories: Category[]; occasions: Occasion[] }) {
  const [cats, setCats] = useState(categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, icon: c.icon as string, color: c.color as string })))
  const [occs, setOccs] = useState(occasions.map((o) => ({ id: o.id, name: o.name, slug: o.slug })))
  const a = useSave()
  const b = useSave()
  return (
    <div className="cols-2">
      <Card title="Categorias" hint="Aparecem no menu, na página inicial e nos filtros." right={<button type="button" className="btn btn-branco" onClick={() => setCats((x) => [...x, { id: '', name: '', slug: '', icon: 'cubo', color: 'rosa' }])}>+ Categoria</button>}>
        {cats.map((c, i) => (
          <div key={i} className="edit-row">
            <span className="thumb" style={{ background: colorVar(c.color) }}>
              <BrandIcon name={c.icon as (typeof brandIconNames)[number]} size={40} />
            </span>
            <div className="grow stack-sm">
              <input className="input" value={c.name} placeholder="Nome" onChange={(e) => setCats((x) => x.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)))} />
              <div className="row wrap-row">
                <select className="select small-select" value={c.icon} onChange={(e) => setCats((x) => x.map((y, j) => (j === i ? { ...y, icon: e.target.value } : y)))} aria-label="Ícone">
                  {brandIconNames.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
                <select className="select small-select" value={c.color} onChange={(e) => setCats((x) => x.map((y, j) => (j === i ? { ...y, color: e.target.value } : y)))} aria-label="Cor">
                  {['rosa', 'amarelo', 'azul', 'roxo', 'nevoa'].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>
            <RowTools onUp={() => setCats((x) => moveIn(x, i, -1))} onDown={() => setCats((x) => moveIn(x, i, 1))} onDel={() => setCats((x) => x.filter((_, j) => j !== i))} />
          </div>
        ))}
        <div className="row">
          <button type="button" className="btn" disabled={a.pending} onClick={() => a.run(() => saveTaxonomy('categories', cats.map((c) => ({ ...c, id: c.id || undefined }))))}>
            Salvar categorias
          </button>
          <a.Msg />
        </div>
      </Card>
      <Card title="Ocasiões" hint="Viram filtros e atalhos na página inicial." right={<button type="button" className="btn btn-branco" onClick={() => setOccs((x) => [...x, { id: '', name: '', slug: '' }])}>+ Ocasião</button>}>
        {occs.map((o, i) => (
          <div key={i} className="edit-row">
            <input className="input grow" value={o.name} placeholder="Nome" onChange={(e) => setOccs((x) => x.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)))} />
            <RowTools onUp={() => setOccs((x) => moveIn(x, i, -1))} onDown={() => setOccs((x) => moveIn(x, i, 1))} onDel={() => setOccs((x) => x.filter((_, j) => j !== i))} />
          </div>
        ))}
        <div className="row">
          <button type="button" className="btn" disabled={b.pending} onClick={() => b.run(() => saveTaxonomy('occasions', occs.map((o) => ({ ...o, id: o.id || undefined }))))}>
            Salvar ocasiões
          </button>
          <b.Msg />
        </div>
      </Card>
    </div>
  )
}

function RowTools({ onUp, onDown, onDel }: { onUp: () => void; onDown: () => void; onDel: () => void }) {
  return (
    <span className="row tools">
      <button type="button" className="icon-btn small" aria-label="Subir" onClick={onUp}>
        <Icon name="seta-esq" size={16} style={{ transform: 'rotate(90deg)' }} />
      </button>
      <button type="button" className="icon-btn small" aria-label="Descer" onClick={onDown}>
        <Icon name="seta-dir" size={16} style={{ transform: 'rotate(90deg)' }} />
      </button>
      <button type="button" className="icon-btn small" aria-label="Apagar" onClick={onDel}>
        <Icon name="lixeira" size={16} />
      </button>
    </span>
  )
}

/* ------------------------------ configurações ------------------------------ */
const DAYS: [keyof Hours, string][] = [
  ['seg', 'Segunda'],
  ['ter', 'Terça'],
  ['qua', 'Quarta'],
  ['qui', 'Quinta'],
  ['sex', 'Sexta'],
  ['sab', 'Sábado'],
  ['dom', 'Domingo'],
]

export function SettingsEditor(props: {
  settings: Settings
  privateSettings: { notify_email_to: string; notify_phone: string; callmebot_apikey: string }
  slides: Slide[]
  testimonials: Testimonial[]
  dates: SpecialDate[]
}) {
  const [s, setS] = useState(props.settings)
  const [priv, setPriv] = useState(props.privateSettings)
  const [slides, setSlides] = useState(props.slides)
  const [tests, setTests] = useState(props.testimonials)
  const [dates, setDates] = useState(props.dates)
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((x) => ({ ...x, [k]: v }))
  const sv1 = useSave()
  const sv2 = useSave()
  const sv3 = useSave()
  const sv4 = useSave()
  const sv5 = useSave()
  const sv6 = useSave()
  const sv7 = useSave()
  const phone = s.whatsapp.replace(/^55/, '')

  return (
    <div className="cols-2 settings">
      <div className="stack-lg">
        <Card title="Carrossel da página inicial" hint="Use as setas pra mudar a ordem. Até 5 slides." right={slides.length < 5 ? <button type="button" className="btn btn-branco" onClick={() => setSlides((x) => [...x, { id: '', kicker: '', title: 'Novo destaque', subtitle: '', button_label: 'Ver o catálogo', button_href: '/catalogo', icon: 'brilho', color: 'amarelo', image_path: null, active: true, position: x.length + 1 }])}>+ Slide</button> : null}>
          {slides.map((sl, i) => (
            <details key={i} className="slide-edit">
              <summary>
                <span className="thumb wide" style={{ background: colorVar(sl.color) }}>
                  <BrandIcon name={sl.icon} size={40} />
                </span>
                <span className="grow">
                  <strong>{sl.title || 'Sem título'}</strong>
                  <span className="t-sm t-muted">Botão: {sl.button_label}</span>
                </span>
                <Switch checked={sl.active} label="Slide ativo" onChange={(v) => setSlides((x) => x.map((y, j) => (j === i ? { ...y, active: v } : y)))} />
              </summary>
              <div className="stack">
                {(
                  [
                    ['kicker', 'Frase de cima (letra cursiva)'],
                    ['title', 'Título'],
                    ['subtitle', 'Texto'],
                    ['button_label', 'Texto do botão'],
                    ['button_href', 'Link do botão (ex.: /catalogo?ocasiao=natal)'],
                  ] as const
                ).map(([k, l]) => (
                  <label key={k} className="field">
                    <span>{l}</span>
                    <input className="input" value={sl[k]} onChange={(e) => setSlides((x) => x.map((y, j) => (j === i ? { ...y, [k]: e.target.value } : y)))} />
                  </label>
                ))}
                <div className="row wrap-row">
                  <select className="select small-select" aria-label="Ilustração" value={sl.icon} onChange={(e) => setSlides((x) => x.map((y, j) => (j === i ? { ...y, icon: e.target.value as Slide['icon'] } : y)))}>
                    {brandIconNames.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                  <select className="select small-select" aria-label="Cor" value={sl.color} onChange={(e) => setSlides((x) => x.map((y, j) => (j === i ? { ...y, color: e.target.value as Slide['color'] } : y)))}>
                    {['rosa', 'amarelo', 'azul', 'roxo'].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                  <RowTools onUp={() => setSlides((x) => moveIn(x, i, -1))} onDown={() => setSlides((x) => moveIn(x, i, 1))} onDel={() => setSlides((x) => x.filter((_, j) => j !== i))} />
                </div>
              </div>
            </details>
          ))}
          <SaveRow sv={sv1} onSave={() => saveList('slides', slides.map((x) => ({ ...x, id: x.id || undefined })))} />
        </Card>

        <Card title="Aviso no topo do site" hint="A faixa amarela acima do carrossel." right={<Switch checked={s.notice_on} label="Mostrar aviso" onChange={(v) => set('notice_on', v)} />}>
          <label className="field">
            <span>Texto do aviso</span>
            <input className="input" value={s.notice_text} maxLength={120} onChange={(e) => set('notice_text', e.target.value)} />
          </label>
          <div className="grid-2">
            <label className="field">
              <span>Mostrar a partir de</span>
              <input className="input" type="date" value={s.notice_start ?? ''} onChange={(e) => set('notice_start', e.target.value || null)} />
            </label>
            <label className="field">
              <span>Esconder depois de</span>
              <input className="input" type="date" value={s.notice_end ?? ''} onChange={(e) => set('notice_end', e.target.value || null)} />
            </label>
          </div>
          <SaveRow sv={sv2} onSave={() => saveSettings({ notice_on: s.notice_on, notice_text: s.notice_text, notice_start: s.notice_start ?? '', notice_end: s.notice_end ?? '' })} />
        </Card>

        <Card title="Depoimentos" hint="Você digita o que as clientes falaram." right={<button type="button" className="btn btn-branco" onClick={() => setTests((x) => [...x, { id: '', quote: '', author: '', place: '', stars: 5, active: true, position: x.length + 1 }])}>+ Depoimento</button>}>
          {tests.map((t, i) => (
            <div key={i} className="edit-block stack-sm">
              <textarea className="textarea" rows={2} value={t.quote} placeholder="O que ela disse" onChange={(e) => setTests((x) => x.map((y, j) => (j === i ? { ...y, quote: e.target.value } : y)))} />
              <div className="row wrap-row">
                <input className="input grow-input" value={t.author} placeholder="Nome" onChange={(e) => setTests((x) => x.map((y, j) => (j === i ? { ...y, author: e.target.value } : y)))} />
                <input className="input grow-input" value={t.place} placeholder="Bairro/cidade" onChange={(e) => setTests((x) => x.map((y, j) => (j === i ? { ...y, place: e.target.value } : y)))} />
                <select className="select small-select" value={t.stars} aria-label="Estrelas" onChange={(e) => setTests((x) => x.map((y, j) => (j === i ? { ...y, stars: Number(e.target.value) } : y)))}>
                  {[5, 4, 3].map((n) => (
                    <option key={n} value={n}>
                      {'★'.repeat(n)}
                    </option>
                  ))}
                </select>
                <Switch checked={t.active} label="Mostrar no site" onChange={(v) => setTests((x) => x.map((y, j) => (j === i ? { ...y, active: v } : y)))} />
                <RowTools onUp={() => setTests((x) => moveIn(x, i, -1))} onDown={() => setTests((x) => moveIn(x, i, 1))} onDel={() => setTests((x) => x.filter((_, j) => j !== i))} />
              </div>
            </div>
          ))}
          <SaveRow sv={sv3} onSave={() => saveList('testimonials', tests.map((x) => ({ ...x, id: x.id || undefined })))} />
        </Card>

        <Card title="Calendário de datas" hint="Aparece em “Próximas datas” na página inicial." right={<button type="button" className="btn btn-branco" onClick={() => setDates((x) => [...x, { id: '', name: '', day: '', order_by: '', active: true }])}>+ Data</button>}>
          {dates.map((d, i) => (
            <div key={i} className="edit-row wrap-row">
              <input className="input grow-input" value={d.name} placeholder="Ex.: Dia das Mães" onChange={(e) => setDates((x) => x.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)))} />
              <label className="field">
                <span className="t-sm">Data</span>
                <input className="input" type="date" value={d.day} onChange={(e) => setDates((x) => x.map((y, j) => (j === i ? { ...y, day: e.target.value } : y)))} />
              </label>
              <label className="field">
                <span className="t-sm">Pedir até</span>
                <input className="input" type="date" value={d.order_by} onChange={(e) => setDates((x) => x.map((y, j) => (j === i ? { ...y, order_by: e.target.value } : y)))} />
              </label>
              <button type="button" className="icon-btn small" aria-label="Apagar data" onClick={() => setDates((x) => x.filter((_, j) => j !== i))}>
                <Icon name="lixeira" size={16} />
              </button>
            </div>
          ))}
          <SaveRow sv={sv4} onSave={() => saveList('special_dates', dates.map((x) => ({ ...x, id: x.id || undefined })))} />
        </Card>
      </div>

      <div className="stack-lg">
        <Card title="Horário e status">
          <label className="field">
            <span>“Online agora”</span>
            <select className="select" value={s.online_mode} onChange={(e) => set('online_mode', e.target.value as Settings['online_mode'])}>
              <option value="auto">Automático pelo horário abaixo</option>
              <option value="ligado">Sempre online</option>
              <option value="desligado">Sempre fora do horário</option>
            </select>
          </label>
          {DAYS.map(([k, l]) => {
            const span = s.hours[k]
            return (
              <div key={k} className="hour-row">
                <span className="t-bold">{l}</span>
                <Switch checked={!!span} label={`Aberto ${l}`} onChange={(v) => set('hours', { ...s.hours, [k]: v ? ['09:00', '18:00'] : null })} />
                {span ? (
                  <span className="row">
                    <input className="input time" type="time" value={span[0]} aria-label={`${l} abre`} onChange={(e) => set('hours', { ...s.hours, [k]: [e.target.value, span[1]] })} />
                    às
                    <input className="input time" type="time" value={span[1]} aria-label={`${l} fecha`} onChange={(e) => set('hours', { ...s.hours, [k]: [span[0], e.target.value] })} />
                  </span>
                ) : (
                  <span className="t-muted">fechado</span>
                )}
              </div>
            )
          })}
          <label className="field">
            <span>Mensagem fora do horário</span>
            <input className="input" value={s.offline_message} onChange={(e) => set('offline_message', e.target.value)} />
          </label>
          <SaveRow sv={sv5} onSave={() => saveSettings({ online_mode: s.online_mode, hours: s.hours, offline_message: s.offline_message })} />
        </Card>

        <Card title="Contato e textos">
          <label className="field">
            <span>WhatsApp da loja (com DDD)</span>
            <input className="input" inputMode="tel" value={phone} onChange={(e) => set('whatsapp', e.target.value)} />
          </label>
          <div className="grid-2">
            <label className="field">
              <span>Instagram (sem @)</span>
              <input className="input" value={s.instagram} onChange={(e) => set('instagram', e.target.value.replace('@', ''))} />
            </label>
            <label className="field">
              <span>TikTok (sem @)</span>
              <input className="input" value={s.tiktok} onChange={(e) => set('tiktok', e.target.value.replace('@', ''))} />
            </label>
          </div>
          <label className="field">
            <span>Texto de prazos</span>
            <input className="input" value={s.deadlines_text} onChange={(e) => set('deadlines_text', e.target.value)} />
          </label>
          <label className="field">
            <span>Texto de retirada</span>
            <input className="input" value={s.pickup_text} onChange={(e) => set('pickup_text', e.target.value)} />
          </label>
          <SaveRow sv={sv6} onSave={() => saveSettings({ whatsapp: s.whatsapp, instagram: s.instagram, tiktok: s.tiktok, deadlines_text: s.deadlines_text, pickup_text: s.pickup_text })} />
        </Card>

        <Card title="Avisos de novo pedido" hint="Quando chegar pedido pelo site.">
          <div className="toggle-row">
            <span className="grow">
              <strong>Aqui no painel</strong>
              <span className="t-sm t-muted">selo “novo” e contador no menu</span>
            </span>
            <Switch checked={s.notify_panel} label="Aviso no painel" onChange={(v) => set('notify_panel', v)} />
          </div>
          <div className="toggle-row">
            <span className="grow">
              <strong>E-mail</strong>
            </span>
            <Switch checked={s.notify_email} label="Aviso por e-mail" onChange={(v) => set('notify_email', v)} />
          </div>
          {s.notify_email ? (
            <label className="field">
              <span>Mandar para</span>
              <input className="input" type="email" value={priv.notify_email_to} onChange={(e) => setPriv((x) => ({ ...x, notify_email_to: e.target.value }))} placeholder="cintia@email.com" />
            </label>
          ) : null}
          <div className="toggle-row">
            <span className="grow">
              <strong>WhatsApp</strong>
              <span className="t-sm t-muted">pelo CallMeBot (grátis): mande “I allow callmebot to send me messages” pro +34 644 66 32 62 e cole a chave que ele responder</span>
            </span>
            <Switch checked={s.notify_whatsapp} label="Aviso por WhatsApp" onChange={(v) => set('notify_whatsapp', v)} />
          </div>
          {s.notify_whatsapp ? (
            <div className="grid-2">
              <label className="field">
                <span>Seu número (+55…)</span>
                <input className="input" value={priv.notify_phone} onChange={(e) => setPriv((x) => ({ ...x, notify_phone: e.target.value }))} placeholder="+5561900000000" />
              </label>
              <label className="field">
                <span>Chave do CallMeBot</span>
                <input className="input" value={priv.callmebot_apikey} onChange={(e) => setPriv((x) => ({ ...x, callmebot_apikey: e.target.value }))} />
              </label>
            </div>
          ) : null}
          <SaveRow
            sv={sv7}
            onSave={async () => {
              const r = await saveSettings({ notify_panel: s.notify_panel, notify_email: s.notify_email, notify_whatsapp: s.notify_whatsapp })
              return r.ok ? savePrivateSettings(priv) : r
            }}
          />
        </Card>

        <Card title="Segurança">
          <p className="t-sm">
            A verificação em 2 etapas está sempre ligada: sem o código do celular ninguém entra no painel. Pra trocar de celular, peça pro Thiago remover o fator no
            Supabase (Authentication → Users) e entre de novo pra cadastrar.
          </p>
        </Card>
      </div>
    </div>
  )
}

function SaveRow({ sv, onSave }: { sv: ReturnType<typeof useSave>; onSave: () => Promise<ActionResult> }) {
  return (
    <div className="row">
      <button type="button" className="btn" disabled={sv.pending} onClick={() => sv.run(onSave)}>
        {sv.pending ? 'Salvando…' : 'Salvar'}
      </button>
      <sv.Msg />
    </div>
  )
}
