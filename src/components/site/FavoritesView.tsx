'use client'
import Link from 'next/link'
import { useEffect } from 'react'
import { useStore } from '@/lib/store'
import { BrandIcon } from '../icons'

export function FavoritesView({ cards }: { cards: Record<string, React.ReactNode> }) {
  const { favs } = useStore()
  const ids = favs.filter((id) => cards[id])
  useEffect(() => {
    document.querySelectorAll('.fav-grid .reveal').forEach((el) => el.classList.add('is-in'))
  }, [ids.length])
  if (!ids.length)
    return (
      <div className="box stack center empty">
        <BrandIcon name="coracao" size={110} />
        <h2 className="t-h2">Nenhum favorito ainda</h2>
        <p className="t-muted">Toque no coração das peças que você gostar pra guardar aqui.</p>
        <Link href="/catalogo" className="btn btn-lg">
          Ver o catálogo
        </Link>
      </div>
    )
  return <div className="p-grid p-grid-4 fav-grid">{ids.map((id) => cards[id])}</div>
}
