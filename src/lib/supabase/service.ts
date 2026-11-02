import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { supabaseUrl } from './env'

/** Chave secreta: só no servidor, só para ler dados privados de aviso. Nunca envie ao navegador. */
export function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
  if (!supabaseUrl || !key) return null
  return createClient(supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
