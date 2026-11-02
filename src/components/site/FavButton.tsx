'use client'
import { useState } from 'react'
import { actions, useStore } from '@/lib/store'
import { BrandIcon, Icon } from '../icons'

export function FavButton({ productId, name, className = '' }: { productId: string; name: string; className?: string }) {
  const { favs } = useStore()
  const on = favs.includes(productId)
  const [burst, setBurst] = useState(0)
  return (
    <button
      type="button"
      className={`icon-btn fav-btn ${className}`}
      aria-pressed={on}
      aria-label={on ? `Tirar ${name} dos favoritos` : `Favoritar ${name}`}
      onClick={() => {
        const now = actions.toggleFav(productId)
        if (now) setBurst((b) => b + 1)
      }}
    >
      <span className="fav-heart" key={`h${burst}`}>
        <Icon name="favorito" size={22} />
      </span>
      {burst > 0 && on ? (
        <span className="fav-burst" key={burst} aria-hidden>
          <BrandIcon name="brilho" size={18} style={{ ['--dx' as string]: '-20px', ['--dy' as string]: '-18px' }} />
          <BrandIcon name="brilho" size={14} style={{ ['--dx' as string]: '20px', ['--dy' as string]: '-16px' }} />
          <BrandIcon name="brilho" size={12} style={{ ['--dx' as string]: '18px', ['--dy' as string]: '18px' }} />
        </span>
      ) : null}
    </button>
  )
}
