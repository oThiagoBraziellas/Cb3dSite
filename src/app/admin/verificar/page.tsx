import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { MfaForm } from '@/components/admin/AuthForms'
import { Icon } from '@/components/icons'
import { Logo } from '@/components/site/bits'
import { isDemo } from '@/lib/supabase/env'

export const metadata: Metadata = { title: 'Verificação em 2 etapas' }

export default function VerificarPage() {
  if (isDemo) redirect('/admin')
  return (
    <div className="auth">
      <div className="auth-brand only-desktop-flex">
        <Logo size={150} />
        <h1 className="t-hero">Painel da Cintia</h1>
      </div>
      <div className="auth-side">
        <div className="auth-card">
          <span className="lock" aria-hidden>
            <Icon name="cadeado" size={40} />
          </span>
          <h2 className="t-h1">Confirme que é você</h2>
          <MfaForm />
        </div>
      </div>
    </div>
  )
}
