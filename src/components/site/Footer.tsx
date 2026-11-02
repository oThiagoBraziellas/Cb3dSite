import Link from 'next/link'
import { formatPhone, hoursSummary } from '@/lib/format'
import type { Category, Settings } from '@/lib/types'
import { waLink } from '@/lib/whatsapp'
import { Icon } from '../icons'
import { Logo, StatusPill } from './bits'
import { CookieSettingsLink } from './CookieBanner'

export function Footer({ settings, categories }: { settings: Settings; categories: Category[] }) {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="wrap footer-in">
        <div className="footer-brand">
          <Logo size={88} />
          <p className="t-script-lg footer-tag">Sua ideia, camada por camada.</p>
          <StatusPill settings={settings} />
          <div className="row">
            {settings.instagram ? (
              <a className="icon-btn" href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noopener" aria-label="Instagram da CB3D">
                <Icon name="instagram" />
              </a>
            ) : null}
            {settings.tiktok ? (
              <a className="icon-btn" href={`https://tiktok.com/@${settings.tiktok}`} target="_blank" rel="noopener" aria-label="TikTok da CB3D">
                <Icon name="tiktok" />
              </a>
            ) : null}
            <a className="icon-btn" href={waLink(settings.whatsapp)} target="_blank" rel="noopener" aria-label="WhatsApp da CB3D">
              <Icon name="whatsapp" />
            </a>
          </div>
        </div>
        <nav className="footer-col" aria-label="Catálogo">
          <h2 className="t-h4">Catálogo</h2>
          {categories.map((c) => (
            <Link key={c.id} href={`/catalogo?cat=${c.slug}`}>
              {c.name}
            </Link>
          ))}
          <Link href="/personalizada">Peça personalizada</Link>
        </nav>
        <nav className="footer-col" aria-label="Ajuda">
          <h2 className="t-h4">Ajuda</h2>
          <Link href="/ajuda">Como pedir</Link>
          <Link href="/ajuda#prazos">Prazos e retirada</Link>
          <Link href="/trocas">Trocas e devoluções</Link>
          <Link href="/privacidade">Política de privacidade</Link>
          <CookieSettingsLink />
        </nav>
        <div className="footer-col">
          <h2 className="t-h4">Fale com a gente</h2>
          <span>WhatsApp: {formatPhone(settings.whatsapp)}</span>
          {settings.instagram ? <span>Instagram: @{settings.instagram}</span> : null}
          <span>{hoursSummary(settings.hours)}</span>
          <span>{settings.pickup_text}</span>
          <span>Pagamento por Pix</span>
        </div>
      </div>
      <div className="wrap footer-legal t-sm">
        © {year} CB3D Impressão 3D · Cintia Braziellas · Pedidos feitos pelo WhatsApp
      </div>
    </footer>
  )
}
