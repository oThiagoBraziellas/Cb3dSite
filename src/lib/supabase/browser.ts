'use client'
import { createBrowserClient } from '@supabase/ssr'
import { supabaseAnonKey, supabaseUrl } from './env'

export function browserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
