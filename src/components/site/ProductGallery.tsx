'use client'
import Image from 'next/image'
import { useState } from 'react'
import { colorVar } from '@/lib/format'
import type { Product } from '@/lib/types'
import { BrandIcon, Icon } from '../icons'
import { ProductBadge } from './ProductCard'
import { FavButton } from './FavButton'

export function ProductGallery({ product }: { product: Product }) {
  const photos = product.media.filter((m) => m.kind === 'foto')
  const video = product.media.find((m) => m.kind === 'video')
  // sem foto: mostra a ilustração nas cores da peça
  type GSlide = { type: 'foto'; url: string; alt: string } | { type: 'cor'; hex: string; name: string }
  const slides: GSlide[] = photos.length
    ? photos.map((p) => ({ type: 'foto' as const, url: p.url, alt: p.alt || product.name }))
    : product.colors.slice(0, 3).map((c) => ({ type: 'cor' as const, hex: c.hex, name: c.name }))
  if (!slides.length) slides.push({ type: 'cor', hex: '', name: product.color })
  const [i, setI] = useState(0)
  const [copied, setCopied] = useState(false)
  const cur = slides[i]

  const share = async () => {
    const data = { title: product.name, text: `Olha essa peça da CB3D: ${product.name}`, url: window.location.href }
    try {
      if (navigator.share) await navigator.share(data)
      else {
        await navigator.clipboard.writeText(data.url)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      /* cancelado */
    }
  }

  return (
    <div className="gallery">
      <div className="g-main" style={{ background: cur.type === 'cor' ? cur.hex || colorVar(product.color) : 'var(--bg-soft)' }}>
        {cur.type === 'foto' ? (
          <Image src={cur.url} alt={cur.alt} fill priority sizes="(min-width: 960px) 560px, 100vw" style={{ objectFit: 'cover' }} />
        ) : (
          <BrandIcon name={product.icon} size={260} title={product.name} className="g-icon" />
        )}
        <span className="g-badge">
          <ProductBadge product={product} />
        </span>
        <span className="g-actions">
          <FavButton productId={product.id} name={product.name} />
          <button type="button" className="icon-btn" aria-label="Compartilhar peça" onClick={share}>
            <Icon name="compartilhar" />
          </button>
          {copied ? <span className="copied" role="status">Link copiado!</span> : null}
        </span>
      </div>
      {slides.length > 1 || video ? (
        <div className="g-thumbs" role="tablist" aria-label="Fotos da peça">
          {slides.map((s, k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={k === i}
              className="g-thumb"
              style={{ background: s.type === 'cor' ? s.hex || colorVar(product.color) : 'var(--bg-soft)' }}
              onClick={() => setI(k)}
              aria-label={s.type === 'cor' ? `Ver em ${s.name}` : `Foto ${k + 1}`}
            >
              {s.type === 'foto' ? <Image src={s.url} alt="" fill sizes="96px" style={{ objectFit: 'cover' }} /> : <BrandIcon name={product.icon} size={60} />}
            </button>
          ))}
          {video ? (
            <a href="#timelapse" className="g-thumb is-video" aria-label="Ver o time-lapse da impressão">
              <Icon name="video" size={36} />
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
