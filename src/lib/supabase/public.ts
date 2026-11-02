import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { supabaseAnonKey, supabaseUrl } from './env'

/** Cliente sem sessão para ler a vitrine (respeita o RLS como visitante). */
export function publicClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
