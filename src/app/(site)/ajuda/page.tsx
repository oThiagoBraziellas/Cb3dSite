import type { Metadata } from 'next'
import Link from 'next/link'
import { BrandIcon, Icon, type UiIconName } from '@/components/icons'
import { getSettings } from '@/lib/data'
import { hoursSummary } from '@/lib/format'

export const metadata: Metadata = { title: 'Como pedir', description: 'Como fazer seu pedido na CB3D, prazos, retirada, pagamento e trocas.' }

export default async function AjudaPage() {
  const s = await getSettings()
  const steps: [UiIconName | 'cubo', string, string, string][] = [
    ['cubo', 'var(--brand-amarelo)', 'Monte sua lista', 'Escolha peças, cores e quantidades no site.'],
    ['whatsapp', 'var(--feedback-verde)', 'Envie pelo WhatsApp', 'A lista vai pronta numa mensagem. Você pode editar antes.'],
    ['relogio', 'var(--brand-azul)', 'Confirme valor e prazo', 'A Cintia confirma tudo e você paga por Pix.'],
    ['pin', 'var(--brand-rosa)', 'Retire sua peça', 'Retirada em mãos, combinada na conversa.'],
  ]
  const faq: [string, React.ReactNode][] = [
    [
      'Posso desistir da compra?',
      <>
        Sim. Peças do catálogo podem ser devolvidas em até 7 dias depois de você receber, como prevê o Código de Defesa do Consumidor (art. 49).{' '}
        <Link href="/trocas" className="link">
          Ver como funciona
        </Link>
        .
      </>,
    ],
    ['E peça personalizada?', 'Como ela é feita só pra você, a gente combina cada detalhe antes de começar. Se chegar com defeito, a Cintia refaz ou devolve o valor.'],
    ['A peça veio com defeito, e agora?', 'Manda uma foto no WhatsApp em até 7 dias. A Cintia refaz a peça ou devolve o valor, o que você preferir.'],
    ['Vocês entregam?', `Por enquanto não. ${s.pickup_text}.`],
    ['Quais formas de pagamento?', 'Pix. O valor e o momento do pagamento são combinados no WhatsApp antes de começar a produção.'],
    ['Qual o horário de atendimento?', hoursSummary(s.hours) + '.'],
  ]
  return (
    <div className="wrap section-top stack-4xl">
      <section className="stack-xl">
        <div className="section-title">
          <span className="t-script-lg" style={{ color: 'var(--text-accent)' }}>
            sem mistério
          </span>
          <h1 className="t-hero">Como pedir</h1>
          <p className="t-lg t-muted">Do catálogo até a retirada, em 4 passos.</p>
        </div>
        <ol className="help-steps">
          {steps.map(([ic, bg, t, d], k) => (
            <li key={t} className="box stack reveal" style={{ ['--i' as string]: k }}>
              <div className="row between">
                <span className="value-icon" style={{ background: bg }}>
                  {ic === 'cubo' ? <BrandIcon name="cubo" size={40} /> : <Icon name={ic} size={34} />}
                </span>
                <span className="t-hero" style={{ color: 'var(--text-accent)' }} aria-hidden>
                  {k + 1}
                </span>
              </div>
              <h2 className="t-h3">{t}</h2>
              <p className="t-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="help-cols">
        <div className="box box-soft stack-lg" id="prazos">
          <h2 className="t-h1">Prazos</h2>
          <dl className="deadlines">
            <dt>Pronta entrega</dt>
            <dd>retirada em 1 a 2 dias</dd>
            <dt>Peças do catálogo</dt>
            <dd>{s.deadlines_text} (aparece em cada peça)</dd>
            <dt>Personalizadas</dt>
            <dd>combinado no WhatsApp</dd>
            <dt>Datas especiais</dt>
            <dd>
              veja o calendário na{' '}
              <Link href="/" className="link">
                página inicial
              </Link>
            </dd>
          </dl>
        </div>
        <div className="stack-lg">
          <h2 className="t-h1">Trocas e dúvidas</h2>
          <div className="faq">
            {faq.map(([q, a], k) => (
              <details key={q} open={k === 0}>
                <summary className="t-h4">
                  {q} <Icon name="mais" size={20} />
                </summary>
                <p className="t-muted">{a}</p>
              </details>
            ))}
          </div>
          <div className="row wrap-row">
            <Link href="/trocas" className="link">
              Política de trocas completa
            </Link>
            <Link href="/privacidade" className="link">
              Política de privacidade
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
