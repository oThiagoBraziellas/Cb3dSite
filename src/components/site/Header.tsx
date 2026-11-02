'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { listCount, useStore } from '@/lib/store'
import { waLink } from '@/lib/whatsapp'
import type { Category } from '@/lib/types'
import { BrandIcon, Icon } from '../icons'
import { Logo } from './bits'

type Props = { categories: Category[]; whatsapp: string; instagram: string; tiktok: string; online: boolean }

export function Header({ categories, whatsapp, instagram, tiktok, online }: Props) {
  const store = useStore()
  const count = listCount(store)
  const pathname = usePathname()
  const router = useRouter()
  const [menu, setMenu] = useState(false)
  const [search, setSearch] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const [bump, setBump] = useState(0)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onAdd = () => setBump((b) => b + 1)
    window.addEventListener('cb3d:added', onAdd)
    return () => window.removeEventListener('cb3d:added', onAdd)
  }, [])

  // fecha menus ao navegar
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setMenu(false)
    setSearch(false)
    setCatOpen(false)
  }

  useEffect(() => {
    if (!menu) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    drawerRef.current?.querySelector<HTMLElement>('button, a')?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [menu])

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const q = new FormData(e.currentTarget).get('q')?.toString().trim()
    router.push(q ? `/catalogo?q=${encodeURIComponent(q)}` : '/catalogo')
  }

  const nav = [
    { href: '/personalizada', label: 'Peça personalizada' },
    { href: '/ajuda', label: 'Como pedir' },
    { href: '/sobre', label: 'Sobre a Cintia' },
  ]

  return (
    <header className="site-header">
      <div className="wrap header-in">
        <Link href="/" className="header-logo" aria-label="CB3D Impressão 3D, página inicial">
          <Logo size={56} priority />
        </Link>

        <nav className="header-nav" aria-label="Principal">
          <div className="nav-drop" onMouseLeave={() => setCatOpen(false)}>
            <button type="button" className="nav-item" aria-expanded={catOpen} onClick={() => setCatOpen((v) => !v)} onMouseEnter={() => setCatOpen(true)}>
              Catálogo <Icon name="chevron-baixo" size={20} />
            </button>
            <div className="drop" hidden={!catOpen}>
              <Link href="/catalogo" className="drop-item">
                <BrandIcon name="brilho" size={36} /> Ver tudo
              </Link>
              {categories.map((c) => (
                <Link key={c.id} href={`/catalogo?cat=${c.slug}`} className="drop-item">
                  <BrandIcon name={c.icon} size={36} /> {c.name}
                </Link>
              ))}
            </div>
          </div>
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="nav-item" aria-current={pathname === n.href ? 'page' : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <form role="search" className="header-search" onSubmit={onSearch}>
            <Icon name="buscar" size={20} />
            <label className="sr-only" htmlFor="busca-topo">
              Buscar peças
            </label>
            <input id="busca-topo" name="q" type="search" placeholder="Buscar peças" />
          </form>
          <button type="button" className="icon-btn only-mobile" aria-label="Buscar" aria-expanded={search} onClick={() => setSearch((v) => !v)}>
            <Icon name="buscar" />
          </button>
          <Link href="/favoritos" className="icon-btn only-desktop" aria-label="Meus favoritos">
            <Icon name="favorito" />
          </Link>
          <Link href="/lista" className="list-btn" aria-label={`Minha lista, ${count} ${count === 1 ? 'peça' : 'peças'}`}>
            <span className={bump ? 'bump' : ''} key={bump}>
              <Icon name="lista" size={22} />
            </span>
            <span className="only-desktop">Minha lista</span>
            {count > 0 ? <span className="list-count">{count}</span> : null}
          </Link>
          <button type="button" className="icon-btn only-mobile" aria-label="Abrir menu" aria-expanded={menu} onClick={() => setMenu(true)}>
            <Icon name="menu" />
          </button>
        </div>
      </div>

      {search ? (
        <form role="search" className="wrap mobile-search" onSubmit={onSearch}>
          <label className="sr-only" htmlFor="busca-mobile">
            Buscar peças
          </label>
          <input id="busca-mobile" name="q" type="search" className="input" placeholder="Buscar: chaveiro, vaso, nome…" autoFocus />
          <button className="btn btn-amarelo" type="submit">
            Buscar
          </button>
        </form>
      ) : null}

      <div className={`drawer-veil${menu ? ' is-open' : ''}`} onClick={() => setMenu(false)} aria-hidden />
      <div ref={drawerRef} className={`drawer${menu ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Menu" inert={!menu}>
        <div className="drawer-top">
          <Logo size={52} />
          <button type="button" className="icon-btn is-yellow" aria-label="Fechar menu" onClick={() => setMenu(false)}>
            <Icon name="fechar" />
          </button>
        </div>
        <nav className="drawer-nav" aria-label="Menu">
          <details open>
            <summary className="drawer-item">
              Catálogo <Icon name="chevron-baixo" size={24} />
            </summary>
            <div className="drawer-sub">
              {categories.map((c) => (
                <Link key={c.id} href={`/catalogo?cat=${c.slug}`}>
                  <BrandIcon name={c.icon} size={30} /> {c.name}
                </Link>
              ))}
              <Link href="/catalogo">
                <BrandIcon name="brilho" size={30} /> Ver tudo
              </Link>
            </div>
          </details>
          {[...nav, { href: '/favoritos', label: `Meus favoritos${store.favs.length ? ` (${store.favs.length})` : ''}` }].map((n) => (
            <Link key={n.href} href={n.href} className="drawer-item">
              {n.label} <Icon name="seta-dir" size={24} />
            </Link>
          ))}
        </nav>
        <div className="drawer-foot">
          <span className="status-pill" data-on={online}>
            <span className="dot" aria-hidden />
            {online ? 'Online agora' : 'Fora do horário'}
          </span>
          <a className="btn btn-whats btn-lg btn-block" href={waLink(whatsapp, 'Oi, Cintia! 💖 Vim pelo site.')} target="_blank" rel="noopener">
            <Icon name="whatsapp" /> Falar com a Cintia
          </a>
          <div className="row">
            {instagram ? (
              <a className="icon-btn" href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener" aria-label="Instagram">
                <Icon name="instagram" />
              </a>
            ) : null}
            {tiktok ? (
              <a className="icon-btn" href={`https://tiktok.com/@${tiktok}`} target="_blank" rel="noopener" aria-label="TikTok">
                <Icon name="tiktok" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
