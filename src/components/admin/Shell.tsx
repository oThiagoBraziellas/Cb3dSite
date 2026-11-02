'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/admin/actions'
import { Logo } from '../site/bits'
import { Icon, type UiIconName } from '../icons'

const items: { href: string; label: string; short: string; icon: UiIconName }[] = [
  { href: '/admin', label: 'Início', short: 'Início', icon: 'casa' },
  { href: '/admin/pedidos', label: 'Pedidos', short: 'Pedidos', icon: 'pedidos' },
  { href: '/admin/produtos', label: 'Produtos', short: 'Produtos', icon: 'caixa' },
  { href: '/admin/categorias', label: 'Categorias e ocasiões', short: 'Categorias', icon: 'lista' },
  { href: '/admin/config', label: 'Configurações do site', short: 'Ajustes', icon: 'config' },
]

const isActive = (path: string, href: string) => (href === '/admin' ? path === '/admin' : path.startsWith(href))

export function Sidebar({ newOrders, demo }: { newOrders: number; demo: boolean }) {
  const path = usePathname()
  return (
    <aside className="sidebar" aria-label="Menu do painel">
      <div className="side-brand">
        <Logo size={48} />
        <div>
          <strong className="t-h4">Painel CB3D</strong>
          <span className="t-sm">Olá, Cintia 💖</span>
        </div>
      </div>
      <nav className="side-nav">
        {items.map((it) => (
          <Link key={it.href} href={it.href} className="side-item" aria-current={isActive(path, it.href) ? 'page' : undefined}>
            <Icon name={it.icon} size={22} />
            {it.label}
            {it.href === '/admin/pedidos' && newOrders > 0 ? <span className="side-count">{newOrders}</span> : null}
          </Link>
        ))}
      </nav>
      <div className="side-foot">
        <Link href="/" className="side-item" target="_blank">
          <Icon name="olho" size={22} /> Ver o site
        </Link>
        {!demo ? (
          <form action={signOut}>
            <button className="side-item">
              <Icon name="sair" size={22} /> Sair
            </button>
          </form>
        ) : null}
      </div>
    </aside>
  )
}

export function BottomNav({ newOrders }: { newOrders: number }) {
  const path = usePathname()
  const mobile = items.filter((i) => i.href !== '/admin/categorias')
  return (
    <nav className="bottom-nav" aria-label="Menu do painel">
      {mobile.map((it) => (
        <Link key={it.href} href={it.href} className="bottom-item" aria-current={isActive(path, it.href) ? 'page' : undefined}>
          <span className="bottom-icon">
            <Icon name={it.icon} size={24} />
            {it.href === '/admin/pedidos' && newOrders > 0 ? <span className="side-count">{newOrders}</span> : null}
          </span>
          {it.short}
        </Link>
      ))}
    </nav>
  )
}

export function MobileTop({ title, back, right }: { title: string; back?: string; right?: React.ReactNode }) {
  return (
    <div className="m-top">
      <div className="row">
        {back ? (
          <Link href={back} className="icon-btn" aria-label="Voltar">
            <Icon name="seta-esq" />
          </Link>
        ) : (
          <Logo size={40} />
        )}
        <span className="t-h3">{title}</span>
      </div>
      {right}
    </div>
  )
}
