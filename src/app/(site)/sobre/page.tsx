import type { Metadata } from 'next'
import { BrandIcon, Icon } from '@/components/icons'
import { Stars } from '@/components/site/bits'
import { getSettings, getTestimonials } from '@/lib/data'
import { waLink } from '@/lib/whatsapp'

export const metadata: Metadata = { title: 'Sobre a Cintia', description: 'Quem faz as peças da CB3D Impressão 3D, em Brasília.' }

export default async function SobrePage() {
  const [settings, testimonials] = await Promise.all([getSettings(), getTestimonials()])
  return (
    <div className="wrap section-top stack-4xl">
      <section className="about-hero">
        {/* Troque por uma foto real: coloque /public/cintia.jpg e use <Image> aqui */}
        <div className="about-photo sticker-lg" role="img" aria-label="Espaço para a foto da Cintia com a impressora">
          <BrandIcon name="impressora" size={180} />
        </div>
        <div className="stack-lg">
          <p className="t-script-lg" style={{ color: 'var(--text-accent)' }}>
            prazer, eu sou a
          </p>
          <h1 className="t-hero">Cintia Braziellas</h1>
          <p className="t-lg">
            Comecei imprimindo presentes pra família e virou paixão. Hoje cada peça da CB3D sai da minha impressora, camada por camada, com acabamento feito à mão aqui
            em casa, em Brasília.
          </p>
          <div className="nums">
            {[
              ['+300', 'peças entregues', 'var(--brand-amarelo)', false],
              ['5 ★', 'de avaliação', 'var(--brand-rosa)', false],
              ['100%', 'feito à mão', 'var(--brand-roxo)', true],
            ].map(([n, l, bg, dark]) => (
              <div key={String(l)} className="num reveal" style={{ background: String(bg), color: dark ? 'var(--text-on-dark)' : undefined }}>
                <strong className="t-h1">{n}</strong>
                <span>{l}</span>
              </div>
            ))}
          </div>
          <a className="btn btn-whats btn-lg" href={waLink(settings.whatsapp, 'Oi, Cintia! 💖 Vim pelo site.')} target="_blank" rel="noopener">
            <Icon name="whatsapp" /> Falar com a Cintia
          </a>
        </div>
      </section>

      <section className="stack-xl" aria-labelledby="t-trab">
        <h2 className="t-h1" id="t-trab">
          Como eu trabalho
        </h2>
        <div className="values">
          {(
            [
              ['coracao', 'Carinho em cada detalhe', 'Confiro e lixo cada peça antes de entregar.', 'var(--brand-rosa)'],
              ['bobina', 'Material de qualidade', 'PLA de origem vegetal, em cores vivas e acabamento fosco.', 'var(--brand-amarelo)'],
              ['cubo', 'Prazo de verdade', 'Te aviso o prazo real antes de começar. Sem surpresa.', 'var(--brand-azul)'],
            ] as const
          ).map(([ic, t, d, bg], k) => (
            <div key={t} className="box stack reveal" style={{ ['--i' as string]: k }}>
              <span className="value-icon" style={{ background: bg }}>
                <BrandIcon name={ic} size={52} />
              </span>
              <h3 className="t-h3">{t}</h3>
              <p className="t-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {testimonials.length ? (
        <section className="stack-xl" aria-labelledby="t-dep2">
          <div className="section-title">
            <span className="t-script">quem já pediu</span>
            <h2 className="t-h1" id="t-dep2">
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
    </div>
  )
}
