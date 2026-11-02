import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { BrandIcon, Icon } from '@/components/icons'
import { Breadcrumb } from '@/components/site/bits'
import { FilterSheet, SortSelect } from '@/components/site/FilterSheet'
import { ProductCard } from '@/components/site/ProductCard'
import { catalogColors, filterProducts, getCategories, getOccasions, getProducts, priceRanges, sortOptions, type CatalogFilters } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Catálogo',
  description: 'Presentes, decoração, brinquedos e chaveiros impressos em 3D. Filtre por categoria, ocasião, cor e preço.',
}

const PAGE = 12
const keys = ['cat', 'ocasiao', 'q', 'preco', 'cor', 'disp', 'ordem'] as const

export default async function Catalogo({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const f: CatalogFilters = {}
  for (const k of keys) {
    const v = sp[k]
    if (typeof v === 'string' && v) f[k] = v.slice(0, 60)
  }
  const page = Math.max(1, Number(sp.pagina) || 1)

  const [all, cats, occs] = await Promise.all([getProducts(), getCategories(), getOccasions()])
  const list = filterProducts(all, f, cats, occs)
  const shown = list.slice(0, page * PAGE)
  const colors = catalogColors(all)

  const href = (patch: Partial<CatalogFilters>) => {
    const p = new URLSearchParams()
    const merged = { ...f, ...patch }
    for (const k of keys) if (merged[k]) p.set(k, merged[k] as string)
    const s = p.toString()
    return `/catalogo${s ? `?${s}` : ''}`
  }
  const toggle = (k: keyof CatalogFilters, v: string) => href({ [k]: f[k] === v ? undefined : v })
  const activeTags = [
    f.q && { label: `“${f.q}”`, href: href({ q: undefined }) },
    f.cat && { label: cats.find((c) => c.slug === f.cat)?.name ?? f.cat, href: href({ cat: undefined }) },
    f.ocasiao && { label: occs.find((o) => o.slug === f.ocasiao)?.name ?? f.ocasiao, href: href({ ocasiao: undefined }) },
    f.preco && { label: priceRanges.find((r) => r.value === f.preco)?.label ?? f.preco, href: href({ preco: undefined }) },
    f.cor && { label: `Cor: ${f.cor}`, href: href({ cor: undefined }) },
    f.disp && { label: f.disp === 'pronta' ? 'Pronta entrega' : 'Sob encomenda', href: href({ disp: undefined }) },
  ].filter(Boolean) as { label: string; href: string }[]
  const title = f.cat ? (cats.find((c) => c.slug === f.cat)?.name ?? 'Catálogo') : f.ocasiao ? (occs.find((o) => o.slug === f.ocasiao)?.name ?? 'Catálogo') : 'Catálogo'

  return (
    <div className="wrap section-top stack-xl">
      <Breadcrumb items={[{ href: '/', label: 'Início' }, { label: 'Catálogo' }]} />
      <div className="head-row">
        <div className="row baseline wrap-row">
          <h1 className="t-hero">{title}</h1>
          <span className="t-lg t-muted">
            {list.length} {list.length === 1 ? 'peça' : 'peças'}
          </span>
        </div>
        <Suspense>
          <SortSelect value={f.ordem ?? 'populares'} options={sortOptions} />
        </Suspense>
      </div>

      <form action="/catalogo" className="catalog-search only-mobile" role="search">
        <Icon name="buscar" size={20} />
        <label htmlFor="busca-cat" className="sr-only">
          Buscar no catálogo
        </label>
        <input id="busca-cat" name="q" type="search" defaultValue={f.q} placeholder="Buscar: chaveiro, vaso, nome…" />
        {f.cat ? <input type="hidden" name="cat" value={f.cat} /> : null}
      </form>

      <div className="catalog">
        <Suspense>
          <FilterSheet active={activeTags.length} total={list.length}>
            <form action="/catalogo" className="catalog-search only-desktop" role="search">
              <Icon name="buscar" size={18} />
              <label htmlFor="busca-lat" className="sr-only">
                Buscar no catálogo
              </label>
              <input id="busca-lat" name="q" type="search" defaultValue={f.q} placeholder="Buscar no catálogo" />
            </form>
            <FilterGroup title="Categoria">
              {cats.map((c) => (
                <Link key={c.id} href={toggle('cat', c.slug)} className="chip" aria-current={f.cat === c.slug}>
                  <BrandIcon name={c.icon} size={24} /> {c.name}
                </Link>
              ))}
            </FilterGroup>
            <FilterGroup title="Ocasião">
              {occs.map((o) => (
                <Link key={o.id} href={toggle('ocasiao', o.slug)} className="chip" aria-current={f.ocasiao === o.slug}>
                  {o.name}
                </Link>
              ))}
            </FilterGroup>
            <FilterGroup title="Preço">
              {priceRanges.map((r) => (
                <Link key={r.value} href={toggle('preco', r.value)} className="chip" aria-current={f.preco === r.value}>
                  {r.label}
                </Link>
              ))}
            </FilterGroup>
            <FilterGroup title="Cor">
              <div className="swatches">
                {colors.map((c) => (
                  <Link key={c.name} href={toggle('cor', c.name)} className="swatch" aria-pressed={f.cor === c.name} aria-label={`Cor ${c.name}`} title={c.name}>
                    <span style={{ background: c.hex }} />
                  </Link>
                ))}
              </div>
            </FilterGroup>
            <FilterGroup title="Disponibilidade">
              <Link href={toggle('disp', 'pronta')} className="chip" aria-current={f.disp === 'pronta'}>
                Pronta entrega
              </Link>
              <Link href={toggle('disp', 'encomenda')} className="chip" aria-current={f.disp === 'encomenda'}>
                Sob encomenda
              </Link>
            </FilterGroup>
          </FilterSheet>
        </Suspense>

        <div className="results stack-xl">
          <div className="chips-scroll" aria-label="Categorias rápidas">
            <Link href={href({ cat: undefined })} className="chip" aria-current={!f.cat}>
              Tudo
            </Link>
            {cats.map((c) => (
              <Link key={c.id} href={href({ cat: c.slug })} className="chip" aria-current={f.cat === c.slug}>
                {c.name.split(' ')[0]}
              </Link>
            ))}
          </div>
          {activeTags.length ? (
            <div className="row wrap-row">
              {activeTags.map((t) => (
                <Link key={t.label} href={t.href} className="tag" aria-label={`Tirar filtro ${t.label}`}>
                  {t.label} <Icon name="fechar" size={14} />
                </Link>
              ))}
              <Link href="/catalogo" className="link t-sm">
                Limpar
              </Link>
            </div>
          ) : null}

          {shown.length ? (
            <div className="p-grid p-grid-3">
              {shown.map((p, k) => (
                <ProductCard key={p.id} product={p} category={cats.find((c) => c.id === p.category_id)} index={k} priority={k < 2} />
              ))}
            </div>
          ) : (
            <div className="empty box">
              <BrandIcon name="bobina" size={96} />
              <h2 className="t-h2">Nenhuma peça com esses filtros</h2>
              <p className="t-muted">Tira um filtro ou pede uma peça personalizada: a Cintia imprime do seu jeito.</p>
              <div className="row wrap-row">
                <Link href="/catalogo" className="btn btn-branco">
                  Limpar filtros
                </Link>
                <Link href="/personalizada" className="btn">
                  Peça personalizada
                </Link>
              </div>
            </div>
          )}

          {list.length > shown.length ? (
            <div className="stack center">
              <p className="t-sm t-muted">
                Mostrando {shown.length} de {list.length}
              </p>
              <Link href={`${href({})}${href({}).includes('?') ? '&' : '?'}pagina=${page + 1}`} className="btn btn-branco" scroll={false}>
                Carregar mais peças
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="fgroup">
      <legend className="t-h4">{title}</legend>
      <div className="chips">{children}</div>
    </fieldset>
  )
}
