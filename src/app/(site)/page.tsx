import Link from 'next/link'
import { BrandIcon, Icon } from '@/components/icons'
import { Filament, SectionTitle, StatusPill, Stars } from '@/components/site/bits'
import { HeroCarousel } from '@/components/site/HeroCarousel'
import { ProductCard } from '@/components/site/ProductCard'
import { getCategories, getOccasions, getProducts, getSettings, getSlides, getSpecialDates, getTestimonials } from '@/lib/data'
import { colorVar, dayMonth } from '@/lib/format'

export default async function Home() {
  const [settings, slides, categories, occasions, products, dates, testimonials] = await Promise.all([
    getSettings(),
    getSlides(),
    getCategories(),
    getOccasions(),
    getProducts(),
    getSpecialDates(),
    getTestimonials(),
  ])
  const top = [...products].sort((a, b) => b.popularity - a.popularity).slice(0, 4)
  const catCount = (id: string) => products.filter((p) => p.category_id === id).length
  const occasionHref = (name: string) => {
    const o = occasions.find((x) => x.name.toLowerCase() === name.toLowerCase())
    return o ? `/catalogo?ocasiao=${o.slug}` : '/catalogo'
  }

  return (
    <>
      <HeroCarousel slides={slides} status={<StatusPill settings={settings} />} />

      <section className="section wrap stack-xl" aria-labelledby="t-categorias">
        <div className="head-row">
          <div className="section-title">
            <span className="t-script">o que você procura?</span>
            <h2 className="t-h1" id="t-categorias">
              Categorias
            </h2>
          </div>
          <div className="occasions">
            <span className="t-bold">Por ocasião:</span>
            <div className="chips">
              {occasions.slice(0, 5).map((o) => (
                <Link key={o.id} href={`/catalogo?ocasiao=${o.slug}`} className="chip">
                  {o.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="cat-grid">
          {categories.map((c, k) => (
            <Link key={c.id} href={`/catalogo?cat=${c.slug}`} className="cat-card reveal" style={{ ['--i' as string]: k }}>
              <span className="cat-icon" style={{ background: colorVar(c.color) }}>
                <BrandIcon name={c.icon} size={64} />
              </span>
              <span className="t-h3">{c.name}</span>
              <span className="row between t-muted only-desktop-flex">
                {catCount(c.id)} {catCount(c.id) === 1 ? 'peça' : 'peças'} <Icon name="seta-dir" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section wrap stack-xl" aria-labelledby="t-top">
        <div className="head-row">
          <div className="section-title">
            <span className="t-script">feitos com carinho</span>
            <h2 className="t-h1" id="t-top">
              Mais pedidos
            </h2>
          </div>
          <Link href="/catalogo" className="btn btn-branco">
            Ver catálogo completo
          </Link>
        </div>
        <div className="p-grid p-grid-4">
          {top.map((p, k) => (
            <ProductCard key={p.id} product={p} category={categories.find((c) => c.id === p.category_id)} index={k} />
          ))}
        </div>
      </section>

      <div className="wrap">
        <Filament />
      </div>

      <section className="section band-soft" aria-label="Como pedir e próximas datas">
        <div className="wrap two-col">
          <div className="stack-xl">
            <SectionTitle kicker="simples assim" title="Como pedir" />
            <ol className="steps">
              {[
                ['Escolha as peças', 'Coloque na sua lista as cores e quantidades.', 'amarelo'],
                ['Mande pelo WhatsApp', 'A lista vai prontinha numa mensagem pra Cintia.', 'azul'],
                ['Pague e retire', 'Pix combinado na conversa e retirada em mãos.', 'rosa'],
              ].map(([t, d, c], k) => (
                <li key={t} className="step reveal" style={{ ['--i' as string]: k }}>
                  <span className="step-n" style={{ background: colorVar(c) }}>
                    {k + 1}
                  </span>
                  <span>
                    <strong className="t-h3">{t}</strong>
                    <span className="t-muted">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          {dates.length ? (
            <div className="stack-xl">
              <SectionTitle kicker="pra não perder o prazo" title="Próximas datas" />
              <ul className="dates">
                {dates.map((d, k) => (
                  <li key={d.id} className="reveal" style={{ ['--i' as string]: k }}>
                    <Link href={occasionHref(d.name)} className="date-row">
                      <span className="date-day t-h3">{dayMonth(d.day)}</span>
                      <span className="grow">
                        <strong className="t-h4">{d.name}</strong>
                        <span className="t-muted">Peça até {dayMonth(d.order_by)}</span>
                      </span>
                      <Icon name="seta-dir" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      {testimonials.length ? (
        <section className="section wrap stack-xl" aria-labelledby="t-dep">
          <div className="section-title">
            <span className="t-script">quem já pediu</span>
            <h2 className="t-h1" id="t-dep">
              O que dizem
            </h2>
          </div>
          <div className="quotes">
            {testimonials.map((t, k) => (
              <figure key={t.id} className={`quote reveal${k === 1 ? ' is-yellow' : ''}`} style={{ ['--i' as string]: k }}>
                <Stars n={t.stars} />
                <blockquote>“{t.quote}”</blockquote>
                <figcaption className="t-bold t-muted">
                  {t.author}
                  {t.place ? ` · ${t.place}` : ''}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section wrap" aria-labelledby="t-ideia">
        <div className="cta-box reveal">
          <BrandIcon name="impressora" size={140} className="cta-icon" />
          <div className="stack">
            <h2 className="t-h1" id="t-ideia">
              Tem uma ideia? A gente imprime.
            </h2>
            <p className="t-lg">Mande uma foto de referência, as cores e a data. A Cintia responde com o valor e o prazo.</p>
          </div>
          <Link href="/personalizada" className="btn btn-branco btn-lg">
            Pedir peça personalizada
          </Link>
        </div>
      </section>
    </>
  )
}
