import type { Metadata } from 'next'
import { getSettings } from '@/lib/data'
import { formatPhone } from '@/lib/format'

export const metadata: Metadata = { title: 'Trocas e devoluções' }

// Texto-base. Revise com um contador/advogado ou com o Procon-DF antes de publicar.
export default async function TrocasPage() {
  const s = await getSettings()
  return (
    <article className="wrap section-top legal">
      <h1 className="t-hero">Trocas e devoluções</h1>
      <p className="t-muted">Última atualização: novembro de 2026</p>

      <h2 className="t-h2">Direito de desistir (7 dias)</h2>
      <p>
        Como o pedido começa pela internet, você pode desistir da compra de peças do catálogo em até <strong>7 dias</strong> depois de receber, sem precisar explicar
        o motivo (Código de Defesa do Consumidor, art. 49). A gente devolve todo o valor pago, pelo mesmo Pix.
      </p>

      <h2 className="t-h2">Peças personalizadas</h2>
      <p>
        Peças com nome, cor ou formato feitos só pra você são combinadas detalhe por detalhe antes de começar, e você aprova a ideia antes da impressão. Se a peça
        chegar diferente do combinado ou com defeito, a Cintia refaz ou devolve o valor.
      </p>

      <h2 className="t-h2">Defeito</h2>
      <p>Se alguma peça vier com defeito, mande uma foto no WhatsApp em até 7 dias depois de receber. Você escolhe: peça nova ou valor de volta.</p>

      <h2 className="t-h2">Como pedir a troca ou devolução</h2>
      <ol>
        <li>Chame a Cintia no WhatsApp {formatPhone(s.whatsapp)} com o número do pedido.</li>
        <li>Combine a devolução da peça, na mesma forma da retirada.</li>
        <li>Recebida a peça, o reembolso sai em até 7 dias pelo Pix.</li>
      </ol>
    </article>
  )
}
