import type { Metadata } from 'next'
import { getSettings } from '@/lib/data'
import { formatPhone } from '@/lib/format'

export const metadata: Metadata = { title: 'Política de privacidade' }

// Texto-base em linguagem simples (LGPD). Revise antes de publicar.
export default async function PrivacidadePage() {
  const s = await getSettings()
  return (
    <article className="wrap section-top legal">
      <h1 className="t-hero">Política de privacidade</h1>
      <p className="t-muted">Última atualização: novembro de 2026</p>

      <h2 className="t-h2">Quem cuida dos seus dados</h2>
      <p>CB3D Impressão 3D, de Cintia Braziellas, em Brasília (DF). Contato: WhatsApp {formatPhone(s.whatsapp)}.</p>

      <h2 className="t-h2">O que a gente coleta e por quê</h2>
      <ul>
        <li>
          <strong>Nome, WhatsApp, data e observações</strong> que você escreve na lista ou no formulário de peça personalizada: só pra responder e produzir o seu
          pedido.
        </li>
        <li>
          <strong>Foto de referência</strong> (se você enviar): só pra Cintia entender a peça. Fica num arquivo privado, que só ela acessa.
        </li>
        <li>
          <strong>Minha lista e favoritos</strong> ficam guardados só no seu navegador, não no nosso servidor.
        </li>
        <li>
          <strong>Estatísticas de visita</strong> (Google Analytics): só se você clicar em “Aceitar” no aviso de cookies. Servem pra saber quais peças são mais vistas.
        </li>
      </ul>

      <h2 className="t-h2">Com quem compartilhamos</h2>
      <p>
        Não vendemos nem passamos seus dados pra ninguém. Usamos serviços que guardam ou levam as informações: Supabase (banco de dados), WhatsApp (conversa) e,
        se você aceitar, Google Analytics.
      </p>

      <h2 className="t-h2">Por quanto tempo</h2>
      <p>Pelo tempo necessário pra concluir o pedido e cumprir obrigações legais. Fotos de referência são apagadas depois que o pedido termina.</p>

      <h2 className="t-h2">Seus direitos</h2>
      <p>
        Você pode pedir pra ver, corrigir ou apagar seus dados a qualquer momento, pelo WhatsApp. Também pode mudar a escolha de cookies no link “Preferências de
        cookies”, no rodapé.
      </p>
    </article>
  )
}
