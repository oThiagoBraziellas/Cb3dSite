import Image from 'next/image'
import Link from 'next/link'
import { colorVar, isOnline } from '@/lib/format'
import type { BrandColor, Product, Settings } from '@/lib/types'
import { BrandIcon, type BrandIconName } from '../icons'

export function Logo({ size = 52, priority }: { size?: number; priority?: boolean }) {
  return (
    <Image src="/logo-cb3d.png" alt="CB3D Impressão 3D" width={size} height={size} priority={priority} style={{ width: size, height: size }} />
  )
}

export function StatusPill({ settings, small }: { settings: Settings; small?: boolean }) {
  const on = isOnline(settings)
  return (
    <span className={`status-pill${small ? ' is-small' : ''}`} data-on={on}>
      <span className="dot" aria-hidden />
      {on ? 'Online agora' : 'Fora do horário'}
    </span>
  )
}

export function SectionTitle({ kicker, title, as: Tag = 'h2', big }: { kicker?: string; title: string; as?: 'h1' | 'h2'; big?: boolean }) {
  return (
    <div className="section-title">
      {kicker ? <span className="t-script">{kicker}</span> : null}
      <Tag className={big ? 't-hero' : 't-h1'}>{title}</Tag>
    </div>
  )
}

/** Foto da peça, ou a ilustração da marca enquanto não houver foto */
export function ProductArt({
  product,
  size = 'card',
  priority,
}: {
  product: Pick<Product, 'name' | 'icon' | 'color' | 'media'>
  size?: 'card' | 'big' | 'thumb'
  priority?: boolean
}) {
  const photo = product.media.find((m) => m.kind === 'foto')
  if (photo) {
    return (
      <Image
        src={photo.url}
        alt={photo.alt || product.name}
        fill
        priority={priority}
        sizes={size === 'big' ? '(min-width: 960px) 560px, 100vw' : size === 'thumb' ? '96px' : '(min-width: 960px) 300px, 50vw'}
        style={{ objectFit: 'cover' }}
      />
    )
  }
  return <IconArt icon={product.icon} color={product.color} label={product.name} size={size} />
}

export function IconArt({ icon, color, label, size = 'card' }: { icon: BrandIconName; color: BrandColor; label?: string; size?: 'card' | 'big' | 'thumb' }) {
  const px = size === 'big' ? 240 : size === 'thumb' ? 56 : 130
  return (
    <span className="art" style={{ background: colorVar(color) }}>
      <BrandIcon name={icon} size={px} title={label} className="art-icon" />
    </span>
  )
}

export function Filament({ className = '' }: { className?: string }) {
  return (
    <svg className={`filament ${className}`} viewBox="0 0 640 40" preserveAspectRatio="none" aria-hidden width="100%" height="40">
      <path pathLength={1} d="M4 20 C 44 2, 84 38, 124 20 S 204 2, 244 20 S 324 38, 364 20 S 444 2, 484 20 S 564 38, 636 20" fill="none" stroke="var(--brand-marinho)" strokeWidth="9" strokeLinecap="round" />
      <path pathLength={1} d="M4 20 C 44 2, 84 38, 124 20 S 204 2, 244 20 S 324 38, 364 20 S 444 2, 484 20 S 564 38, 636 20" fill="none" stroke="var(--brand-amarelo)" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

export function Breadcrumb({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Você está em" className="crumbs t-sm t-muted">
      {items.map((it, i) => (
        <span key={i}>
          {i > 0 ? <span aria-hidden> / </span> : null}
          {it.href ? <Link href={it.href}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
        </span>
      ))}
    </nav>
  )
}

export function Stars({ n }: { n: number }) {
  return (
    <span className="stars" aria-label={`${n} de 5 estrelas`}>
      {'★'.repeat(n)}
    </span>
  )
}
