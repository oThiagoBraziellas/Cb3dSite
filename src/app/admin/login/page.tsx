import type { Metadata } from 'next'
import { BrandIcon } from '@/components/icons'
import { LoginForm } from '@/components/admin/AuthForms'
import { Logo } from '@/components/site/bits'
import { isDemo } from '@/lib/supabase/env'

export const metadata: Metadata = { title: 'Entrar' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams
  return (
    <div className="auth">
      <div className="auth-brand">
        <Logo size={150} priority />
        <h1 className="t-hero">Painel da Cintia</h1>
        <p className="t-script-lg on-dark">aqui você cuida das peças, dos pedidos e do site</p>
        <div className="row auth-icons" aria-hidden>
          <BrandIcon name="impressora" size={64} />
          <BrandIcon name="bobina" size={64} />
          <BrandIcon name="presente" size={64} />
          <BrandIcon name="ursinho" size={64} />
        </div>
      </div>
      <div className="auth-side">
        <div className="auth-card">
          <h2 className="t-h1">Entrar</h2>
          <p className="t-muted">Só a Cintia tem acesso a este painel.</p>
          <LoginForm demo={isDemo} error={erro} />
        </div>
      </div>
    </div>
  )
}
