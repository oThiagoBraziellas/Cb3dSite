import Link from 'next/link'
import { money } from '@/lib/format'
import type { Category, Product } from '@/lib/types'
import { ProductArt } from './bits'
import { FavButton } from './FavButton'

export function ProductBadge({ product }: { product: Product }) {
  if (product.status === 'esgotado' || (product.stock === 0 && product.stock_policy !== 'encomenda'))
    return <span className="badge">Esgotado</span>
  if (product.stock === 0 && product.stock_policy === 'encomenda') return <span className="badge badge-encomenda">Sob encomenda</span>
  if (product.highlight === 'novo') return <span className="badge badge-novo">Novo</span>
  if (product.highlight === 'destaque') return <span className="badge badge-destaque">Destaque</span>
  return null
}

export function ProductCard({ product, category, index = 0, priority }: { product: Product; category?: Category; index?: number; priority?: boolean }) {
  return (
    <article className="pcard reveal" style={{ ['--i' as string]: index % 6 }}>
      <Link href={`/catalogo/${product.slug}`} className="pcard-link">
        <span className="pcard-photo">
          <ProductArt product={product} priority={priority} />
          <span className="pcard-badge">
            <ProductBadge product={product} />
          </span>
        </span>
        <span className="pcard-info">
          {category ? <span className="t-caps pcard-cat">{category.name.split(' ')[0]}</span> : null}
          <span className="t-h4 pcard-name">{product.name}</span>
          <span className="t-price">{money(product.price_cents)}</span>
        </span>
      </Link>
      <FavButton productId={product.id} name={product.name} className="pcard-fav" />
    </article>
  )
}
