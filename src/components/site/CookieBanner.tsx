'use client'
import Link from 'next/link'
import Script from 'next/script'
import { useSyncExternalStore } from 'react'
import { BrandIcon } from '../icons'

const KEY = 'cb3d:cookies'
type Choice = 'todos' | 'necessarios' | null

function read(): Choice {
  try {
    const v = window.localStorage.getItem(KEY)
    return v === 'todos' || v === 'necessarios' ? v : null
  } catch {
    return null
  }
}
const subs = new Set<() => void>()
function write(v: Choice) {
  try {
    if (v) window.localStorage.setItem(KEY, v)
    else window.localStorage.removeItem(KEY)
  } catch {
    /* sem storage */
  }
  subs.forEach((f) => f())
}
function useChoice() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f)
      return () => subs.delete(f)
    },
    read,
    () => 'necessarios' as Choice, // no servidor não mostra o aviso
  )
}

/** Aviso de cookies + Google Analytics só depois do "Aceitar". */
export function CookieBanner({ gaId }: { gaId?: string }) {
  const choice = useChoice()
  // no servidor o valor é 'necessarios', então o aviso só aparece no navegador
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  return (
    <>
      {gaId && choice === 'todos' ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
          </Script>
        </>
      ) : null}
      {mounted && choice === null ? (
        <div className="cookie" role="dialog" aria-live="polite" aria-label="Aviso de cookies">
          <div className="row">
            <BrandIcon name="brilho" size={32} />
            <h2 className="t-h3">Cookies, rapidinho</h2>
          </div>
          <p>Usamos cookies pra entender quais peças vocês mais gostam (Google Analytics). Você escolhe se aceita.</p>
          <div className="row wrap-row">
            <button type="button" className="btn" onClick={() => write('todos')}>
              Aceitar
            </button>
            <button type="button" className="btn btn-branco" onClick={() => write('necessarios')}>
              Só os necessários
            </button>
          </div>
          <Link href="/privacidade" className="link t-sm">
            Ver política de privacidade
          </Link>
        </div>
      ) : null}
    </>
  )
}

export function CookieSettingsLink() {
  return (
    <button type="button" className="footer-linkbtn" onClick={() => write(null)}>
      Preferências de cookies
    </button>
  )
}
