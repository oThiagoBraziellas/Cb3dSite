import type { Metadata } from 'next'
import { FavoritesView } from '@/components/site/FavoritesView'
import { ProductCard } from '@/components/site/ProductCard'
import { getCategories, getProducts } from '@/lib/data'

export const metadata: Metadata = { title: 'Meus favoritos', robots: { index: false } }

export default async function FavoritosPage() {
  const [products, cats] = await Promise.all([getProducts(), getCategories()])
  return (
    <div className="wrap section-top stack-xl">
      <div className="section-title">
        <span className="t-script">pra não esquecer</span>
        <h1 className="t-hero">Meus favoritos</h1>
      </div>
      <FavoritesView
        cards={Object.fromEntries(products.map((p, k) => [p.id, <ProductCard key={p.id} product={p} category={cats.find((c) => c.id === p.category_id)} index={k} />]))}
      />
    </div>
  )
}
