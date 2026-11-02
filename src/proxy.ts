import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Renova a sessão do Supabase nas rotas do painel (cookies).
// A checagem de verdade (admin + 2 etapas) acontece no servidor e no banco (RLS).
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.next()

  let response = NextResponse.next({ request })
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAuthPage = path.startsWith('/admin/login') || path.startsWith('/admin/verificar') || path.startsWith('/auth/')
  if (!user && !isAuthPage) {
    const to = request.nextUrl.clone()
    to.pathname = '/admin/login'
    to.search = ''
    return NextResponse.redirect(to)
  }
  return response
}

export const config = {
  matcher: ['/admin/:path*', '/auth/:path*'],
}
