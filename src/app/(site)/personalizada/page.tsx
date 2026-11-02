import type { Metadata } from 'next'
import { BrandIcon } from '@/components/icons'
import { CustomForm } from '@/components/site/CustomForm'
import { getSettings } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Peça personalizada',
  description: 'Conte sua ideia, mande uma foto de referência e a Cintia responde no WhatsApp com valor e prazo.',
}

export default async function PersonalizadaPage() {
  const settings = await getSettings()
  return (
    <div className="wrap section-top stack-xl">
      <div className="section-title">
        <span className="t-script">do jeitinho que você imaginou</span>
        <h1 className="t-hero">Peça personalizada</h1>
        <p className="t-lg t-muted">Conte sua ideia e a Cintia responde no WhatsApp com valor e prazo. Sem compromisso.</p>
      </div>
      <div className="custom-cols">
        <CustomForm whatsapp={settings.whatsapp} />
        <aside className="stack-xl custom-side">
          <div className="box how sticker">
            <BrandIcon name="impressora" size={72} />
            <h2 className="t-h2">Como funciona</h2>
            <ol className="how-steps">
              <li>Você manda a ideia por aqui</li>
              <li>A Cintia responde com valor e prazo</li>
              <li>Aprovou? Paga o sinal no Pix e ela começa</li>
            </ol>
          </div>
          <div className="box stack">
            <h2 className="t-h3">Ideias que já viraram peça</h2>
            <div className="row">
              {(['coracao', 'chaveiro', 'brilho'] as const).map((i, k) => (
                <span key={i} className="idea" style={{ background: ['var(--brand-amarelo)', 'var(--brand-rosa)', 'var(--brand-roxo)'][k] }}>
                  <BrandIcon name={i} size={60} />
                </span>
              ))}
            </div>
            <p className="t-muted t-sm">Topos de bolo, lembrancinhas com nome, chaveiros de time, peças de reposição…</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
