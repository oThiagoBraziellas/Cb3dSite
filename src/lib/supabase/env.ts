export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/** Sem as variáveis do Supabase o site roda em modo demonstração (dados de exemplo). */
export const isDemo = !supabaseUrl || !supabaseAnonKey

export function publicMediaUrl(path: string) {
  if (/^(https?:|\/)/.test(path)) return path
  return `${supabaseUrl}/storage/v1/object/public/produtos/${path}`
}
