import { NextResponse, type NextRequest } from 'next/server'
import { serverClient } from '@/lib/supabase/server'

// Volta do login com Google: troca o código pela sessão e segue pra verificação em 2 etapas.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  if (code) {
    const supabase = await serverClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}/admin/verificar`)
  }
  return NextResponse.redirect(`${origin}/admin/login?erro=google`)
}
