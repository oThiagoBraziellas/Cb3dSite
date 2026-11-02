'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { waLink } from '@/lib/whatsapp'
import { Icon } from '../icons'

/** Liga as animações de "aparecer ao rolar" e do filamento em cada página. */
export function RevealObserver() {
  const pathname = usePathname()
  useEffect(() => {
    document.documentElement.classList.remove('no-js')
    const els = document.querySelectorAll<HTMLElement>('.reveal:not(.is-in), .filament:not(.is-in)')
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.05 },
    )
    els.forEach((el) => io.observe(el))
    // segurança: nada fica escondido se o observer falhar
    const t = window.setTimeout(() => els.forEach((el) => el.getBoundingClientRect().top < window.innerHeight && el.classList.add('is-in')), 1200)
    return () => {
      io.disconnect()
      window.clearTimeout(t)
    }
  }, [pathname])
  return null
}

/** Botão flutuante do WhatsApp: entra com quique depois de 2 s e mostra o balão uma vez. */
export function WhatsFloat({ phone, online, offlineMessage }: { phone: string; online: boolean; offlineMessage: string }) {
  const pathname = usePathname()
  const [show, setShow] = useState(false)
  const [balloon, setBalloon] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), 2000)
    let seen = false
    try {
      seen = window.sessionStorage.getItem('cb3d:balao') === '1'
    } catch {
      /* ok */
    }
    const b = seen
      ? 0
      : window.setTimeout(() => {
          setBalloon(true)
          try {
            window.sessionStorage.setItem('cb3d:balao', '1')
          } catch {
            /* ok */
          }
        }, 2600)
    const h = window.setTimeout(() => setBalloon(false), 9000)
    return () => {
      window.clearTimeout(t)
      window.clearTimeout(b)
      window.clearTimeout(h)
    }
  }, [])
  if (pathname === '/lista') return null
  return (
    <div className={`wa-float${show ? ' is-in' : ''}`}>
      {balloon ? (
        <span className="wa-balloon" role="status">
          {online ? 'Fala com a Cintia! 💬' : offlineMessage}
        </span>
      ) : null}
      <a href={waLink(phone, 'Oi, Cintia! 💖 Vim pelo site.')} target="_blank" rel="noopener" aria-label="Conversar no WhatsApp" className="wa-btn">
        <Icon name="whatsapp" size={34} />
      </a>
    </div>
  )
}
