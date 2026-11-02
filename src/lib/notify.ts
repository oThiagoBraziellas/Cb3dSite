import 'server-only'
import { serviceClient } from './supabase/service'

/**
 * Avisa a Cintia de um pedido novo.
 * - E-mail: via Resend (RESEND_API_KEY, plano grátis), para o e-mail salvo no painel.
 * - WhatsApp: via CallMeBot (grátis; a Cintia ativa uma vez e cola a chave no painel).
 * - Painel: o pedido aparece com o selo "novo" e o contador do sininho.
 * Falhas aqui nunca impedem o pedido de ser salvo.
 */
export async function notifyNewOrder(o: { number: number; kind: 'lista' | 'personalizado'; name: string; summary: string }) {
  const svc = serviceClient()
  if (!svc) return
  const [{ data: pub }, { data: priv }] = await Promise.all([
    svc.from('settings').select('notify_email, notify_whatsapp').eq('id', 1).maybeSingle(),
    svc.from('settings_private').select('notify_email_to, notify_phone, callmebot_apikey').eq('id', 1).maybeSingle(),
  ])
  if (!pub || !priv) return
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const title = o.kind === 'personalizado' ? `Nova peça personalizada #${o.number}` : `Novo pedido pela lista #${o.number}`
  const text = `${title} de ${o.name}\n${o.summary}\n${siteUrl ? `${siteUrl}/admin/pedidos/${o.number}` : ''}`.trim()
  const jobs: Promise<unknown>[] = []

  if (pub.notify_email && priv.notify_email_to && process.env.RESEND_API_KEY) {
    jobs.push(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? 'CB3D <onboarding@resend.dev>',
          to: [priv.notify_email_to],
          subject: `💖 ${title}`,
          text,
        }),
        signal: AbortSignal.timeout(6000),
      }),
    )
  }
  if (pub.notify_whatsapp && priv.notify_phone && priv.callmebot_apikey) {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(priv.notify_phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(priv.callmebot_apikey)}`
    jobs.push(fetch(url, { signal: AbortSignal.timeout(6000) }))
  }
  await Promise.allSettled(jobs)
}
