'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { colorVar } from '@/lib/format'
import type { Slide } from '@/lib/types'
import { BrandIcon, Icon } from '../icons'

function lines(title: string) {
  const words = title.split(' ')
  const out: string[] = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > 14 && cur) {
      out.push(cur)
      cur = w
    } else cur = (cur + ' ' + w).trim()
  }
  if (cur) out.push(cur)
  return out
}

export function HeroCarousel({ slides, status }: { slides: Slide[]; status: React.ReactNode }) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const n = slides.length
  const go = useCallback((d: number) => setI((v) => (v + d + n) % n), [n])
  const touch = useRef<number | null>(null)

  useEffect(() => {
    if (n < 2 || paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setInterval(() => go(1), 5000)
    return () => window.clearInterval(t)
  }, [n, paused, go])

  if (!n) return null
  const s = slides[i]
  const onDark = s.color === 'rosa' || s.color === 'roxo'

  return (
    <section
      className="hero wrap"
      aria-roledescription="carrossel"
      aria-label="Destaques"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return
        const dx = e.changedTouches[0].clientX - touch.current
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
        touch.current = null
      }}
    >
      <div className="hero-slide" style={{ background: colorVar(s.color) }} key={s.id} aria-roledescription="slide" aria-label={`${i + 1} de ${n}`}>
        <div className="hero-text">
          {status}
          {s.kicker ? <p className={`t-script-lg hero-kicker${onDark ? ' on-dark' : ''}`}>{s.kicker}</p> : null}
          {i === 0 ? (
            <h1 className="t-hero layers">
              {lines(s.title).map((l, k) => (
                <span key={k}>
                  <span style={{ ['--l' as string]: k }}>{l}</span>
                </span>
              ))}
            </h1>
          ) : (
            <h2 className="t-hero layers">
              {lines(s.title).map((l, k) => (
                <span key={k}>
                  <span style={{ ['--l' as string]: k }}>{l}</span>
                </span>
              ))}
            </h2>
          )}
          {s.subtitle ? <p className="t-lg hero-sub">{s.subtitle}</p> : null}
          <div className="hero-ctas">
            <Link href={s.button_href} className="btn btn-amarelo btn-lg">
              {s.button_label}
            </Link>
            {s.button_href.startsWith('/personalizada') ? null : (
              <Link href="/personalizada" className="btn btn-branco btn-lg">
                Quero uma peça personalizada
              </Link>
            )}
          </div>
        </div>
        <div className="hero-art">
          {s.image_path ? (
            <Image src={s.image_path} alt="" fill sizes="(min-width: 960px) 460px, 90vw" style={{ objectFit: 'cover' }} priority={i === 0} />
          ) : (
            <>
              <BrandIcon name={s.icon} size={220} className="hero-icon" />
              <BrandIcon name="brilho" size={72} className="hero-spark" />
            </>
          )}
        </div>
      </div>
      {n > 1 ? (
        <div className="hero-controls">
          <div className="dots" role="tablist" aria-label="Escolher destaque">
            {slides.map((sl, k) => (
              <button key={sl.id} type="button" role="tab" aria-selected={k === i} aria-label={`Destaque ${k + 1}`} className="dot-btn" onClick={() => setI(k)} />
            ))}
          </div>
          <div className="row">
            <button type="button" className="icon-btn" aria-label="Destaque anterior" onClick={() => go(-1)}>
              <Icon name="seta-esq" />
            </button>
            <button type="button" className="icon-btn is-yellow" aria-label="Próximo destaque" onClick={() => go(1)}>
              <Icon name="seta-dir" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
