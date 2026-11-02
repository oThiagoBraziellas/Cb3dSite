import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BrandIcon, Icon } from '@/components/icons'
import { Breadcrumb } from '@/components/site/bits'
import { ProductBuy } from '@/components/site/ProductBuy'
import { ProductCard } from '@/components/site/ProductCard'
import { ProductGallery } from '@/components/site/ProductGallery'
import { getCategories, getOccasions, getProduct, getProducts, getSettings, isAvailable } from '@/lib/data'
import { money } from '@/lib/format'

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const p = await getProduct(slug)
  if (!p) return { title: 'Peça não encontrada' }
  const img = p.media.find((m) => m.kind === 'foto')?.url
  return {
    title: p.name,
    description: `${p.description.slice(0, 140)} · ${money(p.price_cents)}`,
    openGraph: { title: p.name, description: p.description.slice(0, 160), images: img ? [img] : ['/logo-cb3d.png'] },
  }
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params
  const [p, all, cats, occs, settings] = await Promise.all([getProduct(slug), getProducts(), getCategories(), getOccasions(), getSettings()])
  if (!p) notFound()
  const cat = cats.find((c) => c.id === p.category_id)
  const available = isAvailable(p)
  const related = all
    .filter((x) => x.id !== p.id && (x.category_id === p.category_id || x.occasion_ids.some((o) => p.occasion_ids.includes(o))))
    .concat(all.filter((x) => x.id !== p.id))
    .filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i)
    .slice(0, 4)
  const video = p.media.find((m) => m.kind === 'video')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    image: p.media.filter((m) => m.kind === 'foto').map((m) => m.url),
    brand: { '@type': 'Brand', name: 'CB3D Impressão 3D' },
    category: cat?.name,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: (p.price_cents / 100).toFixed(2),
      availability: available ? (p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder') : 'https://schema.org/OutOfStock',
      url: `${siteUrl}/catalogo/${p.slug}`,
    },
  }

  return (
    <div className="wrap section-top stack-2xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Breadcrumb items={[{ href: '/catalogo', label: 'Catálogo' }, ...(cat ? [{ href: `/catalogo?cat=${cat.slug}`, label: cat.name }] : []), { label: p.name }]} />
      <div className="product">
        <ProductGallery product={p} />
        <div className="product-info stack-lg">
          {cat ? <span className="t-caps" style={{ color: 'var(--text-accent)' }}>{cat.name}</span> : null}
          <h1 className="t-h1">{p.name}</h1>
          <p className="t-hero product-price">{money(p.price_cents)}</p>
          <div className="row wrap-row">
            <span className="tag">
              <Icon name="relogio" size={18} /> Produção: {p.production_time}
            </span>
            {p.stock > 0 ? (
              <span className="tag">
                <Icon name="caixa" size={18} /> {p.stock} {p.stock === 1 ? 'pronta' : 'prontas'} pra retirar
              </span>
            ) : available ? (
              <span className="tag">
                <Icon name="caixa" size={18} /> Sob encomenda
              </span>
            ) : null}
            <span className="tag">
              <Icon name="pin" size={18} /> Retirada em mãos
            </span>
          </div>
          <p className="t-lg">{p.description}</p>
          {p.occasion_ids.length ? (
            <p className="t-sm t-muted">Combina com: {occs.filter((o) => p.occasion_ids.includes(o.id)).map((o) => o.name).join(', ')}</p>
          ) : null}
          <ProductBuy product={p} whatsapp={settings.whatsapp} available={available} />
        </div>
      </div>

      <div className="product-more">
        <div className="accordion">
          <details open>
            <summary className="t-h4">
              Medidas e material <Icon name="mais" size={20} />
            </summary>
            <p className="t-muted">{[p.measures, p.material, p.weight].filter(Boolean).join(' · ')}</p>
          </details>
          <details>
            <summary className="t-h4">
              Prazo e retirada <Icon name="mais" size={20} />
            </summary>
            <p className="t-muted">
              Produção em {p.production_time}. {settings.pickup_text}. O prazo começa a contar depois que a Cintia confirma o pedido com você.
            </p>
          </details>
          <details>
            <summary className="t-h4">
              Cuidados com a peça <Icon name="mais" size={20} />
            </summary>
            <p className="t-muted">Evite sol forte e calor (carro fechado, por exemplo). Limpe com pano seco ou levemente úmido.</p>
          </details>
          <details>
            <summary className="t-h4">
              Trocas e devoluções <Icon name="mais" size={20} />
            </summary>
            <p className="t-muted">
              Você pode desistir em até 7 dias depois de receber. Peças personalizadas só têm troca se vierem com defeito.{' '}
              <a className="link" href="/trocas">
                Ver política completa
              </a>
            </p>
          </details>
        </div>
        {video ? (
          <div className="stack" id="timelapse">
            <div className="section-title">
              <span className="t-script">veja ganhando forma</span>
              <h2 className="t-h2">Time-lapse da impressão</h2>
            </div>
            <video className="timelapse" src={video.url} controls playsInline preload="metadata" muted loop aria-label={`Time-lapse da impressão: ${p.name}`} />
          </div>
        ) : (
          <div className="box box-soft stack center made-by">
            <BrandIcon name="impressora" size={96} />
            <p className="t-h4">Impresso camada por camada pela Cintia, aqui em Brasília.</p>
          </div>
        )}
      </div>

      {related.length ? (
        <section className="stack-xl" aria-labelledby="t-rel">
          <h2 className="t-h1" id="t-rel">
            Combina com
          </h2>
          <div className="p-grid p-grid-4">
            {related.map((r, k) => (
              <ProductCard key={r.id} product={r} category={cats.find((c) => c.id === r.category_id)} index={k} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
