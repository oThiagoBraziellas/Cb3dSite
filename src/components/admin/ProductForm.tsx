'use client'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { deleteProduct, saveProduct, type ProductPayload } from '@/app/admin/actions'
import { colorVar, slugify } from '@/lib/format'
import { compressImage, compressVideo, videoDuration } from '@/lib/media'
import { browserClient } from '@/lib/supabase/browser'
import { isDemo, publicMediaUrl } from '@/lib/supabase/env'
import type { Category, Occasion, Product } from '@/lib/types'
import { BrandIcon, brandIconNames, Icon } from '../icons'

type MediaItem = { path: string; kind: 'foto' | 'video'; alt: string; url: string }
const money = (c: number) => (c / 100).toFixed(2).replace('.', ',')
const BRAND_COLORS = ['rosa', 'amarelo', 'azul', 'roxo', 'nevoa'] as const
const PRESET_COLORS = [
  { name: 'Rosa chiclete', hex: '#F9208D' },
  { name: 'Amarelo', hex: '#FCD715' },
  { name: 'Azul', hex: '#05BDFC' },
  { name: 'Roxo', hex: '#8C43F5' },
  { name: 'Branco', hex: '#FFFFFF' },
  { name: 'Preto', hex: '#111111' },
]

export function ProductForm({ product, categories, occasions }: { product: Product | null; categories: Category[]; occasions: Occasion[] }) {
  const router = useRouter()
  const p = product
  const [f, setF] = useState({
    name: p?.name ?? '',
    slug: p?.slug ?? '',
    description: p?.description ?? '',
    price: p ? money(p.price_cents) : '',
    production_time: p?.production_time ?? '3 a 7 dias úteis',
    pickup_time: p?.pickup_time ?? '1 a 2 dias',
    stock: p?.stock ?? 0,
    stock_policy: p?.stock_policy ?? 'encomenda',
    measures: p?.measures ?? '',
    material: p?.material ?? 'PLA',
    weight: p?.weight ?? '',
    category_id: (p?.category_id ?? categories[0]?.id ?? '') as string,
    highlight: p?.highlight ?? 'nenhum',
    status: p?.status ?? 'rascunho',
    customizable: p?.customizable ?? false,
    gift_wrap: p?.gift_wrap ?? true,
    gift_wrap_price: p ? money(p.gift_wrap_cents) : '5,00',
    icon: p?.icon ?? 'cubo',
    color: p?.color ?? 'rosa',
  })
  const [occ, setOcc] = useState<string[]>(p?.occasion_ids ?? [])
  const [colors, setColors] = useState(p?.colors.map((c) => ({ name: c.name, hex: c.hex })) ?? PRESET_COLORS.slice(0, 3))
  const [media, setMedia] = useState<MediaItem[]>(p?.media.map((m) => ({ path: m.path, kind: m.kind, alt: m.alt, url: m.url })) ?? [])
  const [removed, setRemoved] = useState<string[]>([])
  const [upload, setUpload] = useState<{ label: string; progress: number } | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [confirmDel, setConfirmDel] = useState(false)
  const [pending, start] = useTransition()
  const folder = useRef<string>(p?.id ?? '')
  const folderName = () => (folder.current ||= `novo-${crypto.randomUUID().slice(0, 8)}`)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }))

  const send = async (files: FileList | null) => {
    if (!files?.length) return
    setMsg(null)
    const sb = browserClient()
    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith('video/')
      if (!isVideo && !file.type.startsWith('image/')) continue
      if (isVideo && media.some((m) => m.kind === 'video')) {
        setMsg({ ok: false, text: 'Só 1 vídeo por peça. Apague o atual pra trocar.' })
        continue
      }
      if (!isVideo && media.filter((m) => m.kind === 'foto').length >= 8) {
        setMsg({ ok: false, text: 'Até 8 fotos por peça.' })
        break
      }
      let blob: Blob = file
      if (isVideo) {
        const dur = await videoDuration(file)
        if (dur > 60) {
          setMsg({ ok: false, text: 'O vídeo tem mais de 1 minuto. Corte um trechinho (até 15–30 s fica ótimo).' })
          continue
        }
        setUpload({ label: `Comprimindo ${file.name}…`, progress: 0 })
        blob = await compressVideo(file, (pr) => setUpload({ label: `Comprimindo ${file.name}…`, progress: pr }))
        if (blob.size > 25 * 1024 * 1024) {
          setUpload(null)
          setMsg({ ok: false, text: 'Mesmo comprimido o vídeo passou de 25 MB. Tenta um trecho menor.' })
          continue
        }
      } else {
        setUpload({ label: `Preparando ${file.name}…`, progress: 0.3 })
        blob = await compressImage(file)
      }
      const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'video/webm' ? 'webm' : (file.name.split('.').pop() ?? 'bin').toLowerCase()
      const path = `${folderName()}/${crypto.randomUUID()}.${ext}`
      setUpload({ label: `Enviando ${file.name}…`, progress: 0.8 })
      if (isDemo) {
        setMedia((m) => [...m, { path, kind: isVideo ? 'video' : 'foto', alt: '', url: URL.createObjectURL(blob) }])
      } else {
        const { error } = await sb.storage.from('produtos').upload(path, blob, { contentType: blob.type || file.type, cacheControl: '31536000' })
        if (error) {
          setMsg({ ok: false, text: `Não deu pra enviar ${file.name}.` })
          continue
        }
        setMedia((m) => [...m, { path, kind: isVideo ? 'video' : 'foto', alt: '', url: publicMediaUrl(path) }])
      }
    }
    setUpload(null)
  }

  const move = (i: number, d: number) =>
    setMedia((m) => {
      const n = [...m]
      const j = i + d
      if (j < 0 || j >= n.length) return m
      ;[n[i], n[j]] = [n[j], n[i]]
      return n
    })

  const submit = (statusOverride?: Product['status']) => {
    setMsg(null)
    const payload: ProductPayload = {
      id: p?.id,
      ...f,
      status: statusOverride ?? f.status,
      stock: Number(f.stock),
      occasion_ids: occ,
      colors,
      media: media.map(({ path, kind, alt }) => ({ path, kind, alt })),
      removed_paths: removed,
    }
    start(async () => {
      const r = await saveProduct(payload)
      if (!r.ok) return setMsg({ ok: false, text: r.error })
      setMsg({ ok: true, text: r.message ?? 'Salvo' })
      if (statusOverride) set('status', statusOverride)
      setRemoved([])
      if (!p && r.id) router.replace(`/admin/produtos/${r.id}`)
      else router.refresh()
    })
  }

  return (
    <form
      className="pform"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <div className="pform-main stack-lg">
        <section className="panel-box pad stack-lg">
          <h2 className="t-h3">Informações</h2>
          <label className="field">
            <span>Nome da peça</span>
            <input
              className="input"
              required
              maxLength={80}
              value={f.name}
              onChange={(e) => {
                set('name', e.target.value)
                if (!p) set('slug', slugify(e.target.value))
              }}
            />
          </label>
          <label className="field">
            <span>Endereço no site</span>
            <span className="slug-input">
              <span className="t-muted">/catalogo/</span>
              <input value={f.slug} onChange={(e) => set('slug', slugify(e.target.value))} aria-label="Endereço no site" />
            </span>
          </label>
          <label className="field">
            <span>Descrição</span>
            <textarea className="textarea" rows={4} maxLength={2000} value={f.description} onChange={(e) => set('description', e.target.value)} />
          </label>
          <div className="grid-3">
            <label className="field">
              <span>Preço (R$)</span>
              <input className="input" required inputMode="decimal" value={f.price} onChange={(e) => set('price', e.target.value)} placeholder="35,00" />
            </label>
            <label className="field">
              <span>Prazo de produção</span>
              <input className="input" value={f.production_time} onChange={(e) => set('production_time', e.target.value)} />
            </label>
            <label className="field">
              <span>Prazo de retirada</span>
              <input className="input" value={f.pickup_time} onChange={(e) => set('pickup_time', e.target.value)} />
            </label>
            <label className="field">
              <span>Medidas</span>
              <input className="input" value={f.measures} onChange={(e) => set('measures', e.target.value)} placeholder="8 × 6 × 5 cm" />
            </label>
            <label className="field">
              <span>Material</span>
              <input className="input" value={f.material} onChange={(e) => set('material', e.target.value)} />
            </label>
            <label className="field">
              <span>Peso</span>
              <input className="input" value={f.weight} onChange={(e) => set('weight', e.target.value)} placeholder="40 g" />
            </label>
          </div>
        </section>

        <section className="panel-box pad stack-lg">
          <h2 className="t-h3">Fotos e vídeo</h2>
          <div className="media-grid">
            {media.map((m, i) => (
              <figure key={m.path} className="media-item">
                {m.kind === 'foto' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.alt || 'Foto da peça'} />
                ) : (
                  <video src={m.url} muted playsInline preload="metadata" />
                )}
                {i === 0 && m.kind === 'foto' ? <span className="cover-tag">CAPA</span> : null}
                {m.kind === 'video' ? <span className="cover-tag">VÍDEO</span> : null}
                <span className="media-tools">
                  <button type="button" className="icon-btn small" aria-label="Mover pra trás" onClick={() => move(i, -1)} disabled={i === 0}>
                    <Icon name="seta-esq" size={16} />
                  </button>
                  <button type="button" className="icon-btn small" aria-label="Mover pra frente" onClick={() => move(i, 1)} disabled={i === media.length - 1}>
                    <Icon name="seta-dir" size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn small"
                    aria-label="Apagar"
                    onClick={() => {
                      setMedia((x) => x.filter((y) => y.path !== m.path))
                      if (!m.url.startsWith('blob:')) setRemoved((r) => [...r, m.path])
                    }}
                  >
                    <Icon name="lixeira" size={16} />
                  </button>
                </span>
                {m.kind === 'foto' ? (
                  <input
                    className="alt-input"
                    placeholder="Descrição (acessibilidade)"
                    value={m.alt}
                    maxLength={120}
                    onChange={(e) => setMedia((x) => x.map((y) => (y.path === m.path ? { ...y, alt: e.target.value } : y)))}
                  />
                ) : null}
              </figure>
            ))}
            <label className="media-add">
              <Icon name="upload" size={28} />
              <span>Adicionar foto ou vídeo</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" multiple onChange={(e) => send(e.target.files)} disabled={!!upload} />
            </label>
          </div>
          {upload ? (
            <div className="progress" role="status">
              <span>{upload.label}</span>
              <span className="bar">
                <span style={{ width: `${Math.round(upload.progress * 100)}%` }} />
              </span>
            </div>
          ) : null}
          <p className="hint">Use as setas pra mudar a ordem: a primeira foto é a capa. Até 8 fotos. O time-lapse é comprimido aqui mesmo pra ficar leve (até 1 min).</p>
          {!media.some((m) => m.kind === 'foto') ? (
            <div className="fallback-art">
              <span className="t-bold">Sem foto ainda? O site mostra esta ilustração:</span>
              <div className="row wrap-row">
                <span className="thumb big" style={{ background: colorVar(f.color) }}>
                  <BrandIcon name={f.icon as (typeof brandIconNames)[number]} size={64} />
                </span>
                <div className="stack-sm">
                  <div className="chips">
                    {brandIconNames.map((n) => (
                      <button key={n} type="button" className="chip icon-chip" aria-pressed={f.icon === n} onClick={() => set('icon', n)} aria-label={n}>
                        <BrandIcon name={n} size={28} />
                      </button>
                    ))}
                  </div>
                  <div className="row">
                    {BRAND_COLORS.map((c) => (
                      <button key={c} type="button" className="swatch" aria-pressed={f.color === c} aria-label={`Fundo ${c}`} onClick={() => set('color', c)}>
                        <span style={{ background: colorVar(c) }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="panel-box pad stack-lg">
          <h2 className="t-h3">Cores e personalização</h2>
          <div className="color-list">
            {colors.map((c, i) => (
              <span key={i} className="color-pill">
                <input type="color" value={c.hex} onChange={(e) => setColors((x) => x.map((y, j) => (j === i ? { ...y, hex: e.target.value.toUpperCase() } : y)))} aria-label={`Cor de ${c.name}`} />
                <input value={c.name} onChange={(e) => setColors((x) => x.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)))} aria-label="Nome da cor" maxLength={40} />
                <button type="button" className="plain-btn" aria-label={`Tirar ${c.name}`} onClick={() => setColors((x) => x.filter((_, j) => j !== i))}>
                  <Icon name="fechar" size={14} />
                </button>
              </span>
            ))}
          </div>
          <div className="row wrap-row">
            <span className="t-sm t-muted">Adicionar:</span>
            {PRESET_COLORS.filter((pc) => !colors.some((c) => c.name === pc.name)).map((pc) => (
              <button key={pc.name} type="button" className="chip small-chip" onClick={() => setColors((x) => [...x, pc])}>
                <span className="dot-color" style={{ background: pc.hex }} /> {pc.name}
              </button>
            ))}
            <button type="button" className="chip small-chip" onClick={() => setColors((x) => [...x, { name: 'Nova cor', hex: '#8C43F5' }])}>
              + outra
            </button>
          </div>
          <Toggle label="Aceita personalização (nome/texto)" hint="Mostra o campo “Nome para gravar” na página da peça" checked={f.customizable} onChange={(v) => set('customizable', v)} />
          <Toggle label="Oferecer embalagem de presente" checked={f.gift_wrap} onChange={(v) => set('gift_wrap', v)}>
            {f.gift_wrap ? (
              <label className="field inline-field">
                <span className="t-sm">+ R$</span>
                <input className="input" inputMode="decimal" value={f.gift_wrap_price} onChange={(e) => set('gift_wrap_price', e.target.value)} />
              </label>
            ) : null}
          </Toggle>
        </section>
      </div>

      <div className="pform-side stack-lg">
        <section className="panel-box pad stack">
          <h2 className="t-h3">Status</h2>
          {(
            [
              ['publicado', 'Publicada', 'aparece no site'],
              ['rascunho', 'Rascunho', 'só você vê'],
              ['oculto', 'Oculta', 'tirada do site'],
              ['esgotado', 'Esgotada', 'aparece sem botão de pedir'],
            ] as const
          ).map(([v, l, d]) => (
            <label key={v} className="check">
              <input type="radio" name="status" checked={f.status === v} onChange={() => set('status', v)} />
              <span>
                <strong>{l}</strong> <span className="t-sm t-muted">· {d}</span>
              </span>
            </label>
          ))}
        </section>

        <section className="panel-box pad stack">
          <h2 className="t-h3">Estoque</h2>
          <label className="field">
            <span>Peças prontas</span>
            <input className="input" type="number" min={0} value={f.stock} onChange={(e) => set('stock', Number(e.target.value))} />
          </label>
          <span className="t-bold">Quando o estoque zerar:</span>
          {(
            [
              ['esgotado', 'Mostrar “esgotado”', 'some o botão de pedir'],
              ['encomenda', 'Vender sob encomenda', 'usa o prazo de produção'],
              ['avisar', '“Avisar quando voltar”', 'a cliente deixa o WhatsApp'],
            ] as const
          ).map(([v, l, d]) => (
            <label key={v} className="check">
              <input type="radio" name="stock_policy" checked={f.stock_policy === v} onChange={() => set('stock_policy', v)} />
              <span>
                <strong>{l}</strong>
                <span className="t-sm t-muted block">{d}</span>
              </span>
            </label>
          ))}
        </section>

        <section className="panel-box pad stack">
          <h2 className="t-h3">Organização</h2>
          <label className="field">
            <span>Categoria</span>
            <select className="select" value={f.category_id} onChange={(e) => set('category_id', e.target.value)}>
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <span className="t-bold">Ocasiões</span>
          <div className="chips">
            {occasions.map((o) => (
              <button key={o.id} type="button" className="chip" aria-pressed={occ.includes(o.id)} onClick={() => setOcc((x) => (x.includes(o.id) ? x.filter((y) => y !== o.id) : [...x, o.id]))}>
                {o.name}
              </button>
            ))}
          </div>
          <span className="t-bold">Selo</span>
          <div className="chips">
            {(
              [
                ['nenhum', 'Nenhum'],
                ['novo', 'Novo'],
                ['destaque', 'Destaque'],
              ] as const
            ).map(([v, l]) => (
              <button key={v} type="button" className="chip" aria-pressed={f.highlight === v} onClick={() => set('highlight', v)}>
                {l}
              </button>
            ))}
          </div>
        </section>

        {msg ? (
          <p className={msg.ok ? 'ok-text' : 'error-text'} role="status">
            {msg.text}
          </p>
        ) : null}
        <div className="pform-actions">
          <button type="button" className="btn btn-branco" disabled={pending || !!upload} onClick={() => submit('rascunho')}>
            Salvar rascunho
          </button>
          <button type="button" className="btn" disabled={pending || !!upload} onClick={() => submit('publicado')}>
            {pending ? 'Salvando…' : 'Publicar'}
          </button>
        </div>
        {p ? (
          confirmDel ? (
            <div className="box stack danger-box">
              <strong>Apagar “{p.name}” de vez?</strong>
              <span className="t-sm">As fotos também somem. Pedidos antigos continuam com o nome da peça.</span>
              <div className="row">
                <button type="button" className="btn btn-branco" onClick={() => setConfirmDel(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn danger" onClick={() => start(async () => void (await deleteProduct(p.id)))}>
                  Apagar
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="plain-btn t-sm danger-link" onClick={() => setConfirmDel(true)}>
              <Icon name="lixeira" size={16} /> Apagar peça
            </button>
          )
        ) : null}
      </div>
    </form>
  )
}

function Toggle({ label, hint, checked, onChange, children }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; children?: React.ReactNode }) {
  return (
    <div className="toggle-row">
      <span className="grow">
        <strong>{label}</strong>
        {hint ? <span className="t-sm t-muted">{hint}</span> : null}
      </span>
      {children}
      <button type="button" role="switch" aria-checked={checked} className="switch" onClick={() => onChange(!checked)}>
        <span className="sr-only">{label}</span>
      </button>
    </div>
  )
}
