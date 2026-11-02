import type { BrandColor, Hours, Settings } from './types'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const money = (cents: number) => brl.format(cents / 100)

export function parseMoney(value: string) {
  const clean = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  const n = Math.round(Number(clean) * 100)
  return Number.isFinite(n) ? n : NaN
}

export const dateBR = (iso: string | null | undefined) => {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}${y && Number(y) !== new Date().getFullYear() ? '/' + y : ''}`
}
export const dayMonth = (iso: string) => {
  const [, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}`
}

export function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export const onlyDigits = (s: string) => s.replace(/\D/g, '')

export function formatPhone(digits: string) {
  const d = onlyDigits(digits).replace(/^55(?=\d{10,11}$)/, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return digits
}

/** Cor da marca → variável CSS */
export const colorVar = (c: BrandColor | string) =>
  ({
    rosa: 'var(--brand-rosa)',
    amarelo: 'var(--brand-amarelo)',
    azul: 'var(--brand-azul)',
    roxo: 'var(--brand-roxo)',
    nevoa: 'var(--bg-soft)',
  })[c as BrandColor] ?? 'var(--bg-soft)'

const dayKeys: (keyof Hours)[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']

/** Hora atual em Brasília (America/Sao_Paulo) */
function nowInBrasilia(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
  return { day: dayKeys[wd], minutes: Number(get('hour')) * 60 + Number(get('minute')) }
}

export function isOnline(settings: Pick<Settings, 'online_mode' | 'hours'>, now = new Date()) {
  if (settings.online_mode === 'ligado') return true
  if (settings.online_mode === 'desligado') return false
  const { day, minutes } = nowInBrasilia(now)
  const span = settings.hours?.[day]
  if (!span) return false
  const toMin = (h: string) => {
    const [hh, mm] = h.split(':').map(Number)
    return hh * 60 + (mm || 0)
  }
  return minutes >= toMin(span[0]) && minutes < toMin(span[1])
}

export function hoursSummary(hours: Hours) {
  const fmt = (s: [string, string] | null) => (s ? `${s[0].replace(':00', 'h')} às ${s[1].replace(':00', 'h')}` : 'fechado')
  const week = ['seg', 'ter', 'qua', 'qui', 'sex'] as const
  const same = week.every((d) => JSON.stringify(hours[d]) === JSON.stringify(hours.seg))
  const lines: string[] = []
  if (same) lines.push(`Seg a sex, ${fmt(hours.seg)}`)
  else week.forEach((d) => lines.push(`${d[0].toUpperCase() + d.slice(1)}: ${fmt(hours[d])}`))
  lines.push(`Sáb, ${fmt(hours.sab)}`)
  if (hours.dom) lines.push(`Dom, ${fmt(hours.dom)}`)
  return lines.join(' · ')
}

export function noticeActive(s: Pick<Settings, 'notice_on' | 'notice_text' | 'notice_start' | 'notice_end'>, today = new Date()) {
  if (!s.notice_on || !s.notice_text) return false
  const iso = today.toISOString().slice(0, 10)
  if (s.notice_start && iso < s.notice_start) return false
  if (s.notice_end && iso > s.notice_end) return false
  return true
}
