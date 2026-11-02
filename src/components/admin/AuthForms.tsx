'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { browserClient } from '@/lib/supabase/browser'
import { BrandIcon, Icon } from '../icons'

const msg = (e: unknown) => {
  const m = e instanceof Error ? e.message : String(e)
  if (/invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.'
  if (/invalid totp|invalid code|expired/i.test(m)) return 'Código errado ou vencido. Confere no app e tenta de novo.'
  if (/rate limit|too many/i.test(m)) return 'Muitas tentativas. Espera um minutinho.'
  return 'Algo deu errado. Tenta de novo.'
}

export function LoginForm({ demo, error }: { demo: boolean; error?: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [err, setErr] = useState(
    error === 'sem-acesso' ? 'Essa conta não tem acesso ao painel.' : error === 'google' ? 'O login com Google não terminou. Tenta de novo.' : '',
  )

  if (demo)
    return (
      <div className="stack-lg">
        <p className="note">Modo demonstração: o login de verdade liga quando o Supabase for configurado.</p>
        <Link href="/admin" className="btn btn-lg btn-block">
          Entrar na demonstração
        </Link>
      </div>
    )

  const google = async () => {
    setPending(true)
    const { error } = await browserClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setErr(msg(error))
      setPending(false)
    }
  }

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErr('')
    setPending(true)
    const fd = new FormData(e.currentTarget)
    const { error } = await browserClient().auth.signInWithPassword({ email: String(fd.get('email')), password: String(fd.get('password')) })
    if (error) {
      setErr(msg(error))
      setPending(false)
      return
    }
    router.replace('/admin/verificar')
  }

  return (
    <div className="stack-lg">
      <button type="button" className="btn btn-branco btn-lg btn-block" onClick={google} disabled={pending}>
        <Icon name="google" /> Entrar com Google
      </button>
      <div className="or">
        <span>ou com e-mail</span>
      </div>
      <form onSubmit={submit} className="stack-lg">
        <label className="field">
          <span>E-mail</span>
          <input className="input" name="email" type="email" required autoComplete="email" />
        </label>
        <label className="field">
          <span>Senha</span>
          <input className="input" name="password" type="password" required autoComplete="current-password" minLength={8} />
        </label>
        {err ? (
          <p className="error-text" role="alert">
            {err}
          </p>
        ) : null}
        <button className="btn btn-lg btn-block" disabled={pending}>
          {pending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <p className="row t-sm t-muted">
        <Icon name="cadeado" size={18} /> Protegido com verificação em 2 etapas.
      </p>
    </div>
  )
}

/** Cadastra o app autenticador (1ª vez) ou pede o código de 6 números. */
export function MfaForm() {
  const router = useRouter()
  const [stage, setStage] = useState<'loading' | 'enroll' | 'verify'>('loading')
  const [factorId, setFactorId] = useState('')
  const [qr, setQr] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const sb = browserClient()
    ;(async () => {
      const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aal?.currentLevel === 'aal2') return router.replace('/admin')
      const { data: user } = await sb.auth.getUser()
      if (!user.user) return router.replace('/admin/login')
      const { data } = await sb.auth.mfa.listFactors()
      const verified = data?.totp?.[0]
      if (verified) {
        setFactorId(verified.id)
        setStage('verify')
        return
      }
      // limpa tentativas antigas não confirmadas e cadastra de novo
      for (const f of data?.all ?? []) if (f.status === 'unverified') await sb.auth.mfa.unenroll({ factorId: f.id })
      const { data: enrolled, error } = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Celular ${new Date().toISOString().slice(0, 10)}` })
      if (error || !enrolled) {
        setErr(msg(error))
        return
      }
      setFactorId(enrolled.id)
      setQr(enrolled.totp.qr_code)
      setSecret(enrolled.totp.secret)
      setStage('enroll')
    })()
  }, [router])

  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setPending(true)
    const { error } = await browserClient().auth.mfa.challengeAndVerify({ factorId, code })
    if (error) {
      setErr(msg(error))
      setPending(false)
      return
    }
    router.replace('/admin')
    router.refresh()
  }

  if (stage === 'loading')
    return (
      <div className="stack center">
        <BrandIcon name="bobina" size={72} className="spin" />
        <p>Carregando…</p>
        {err ? <p className="error-text">{err}</p> : null}
      </div>
    )

  return (
    <form onSubmit={verify} className="stack-lg">
      {stage === 'enroll' ? (
        <div className="stack">
          <p>
            <strong>Primeira vez?</strong> Abra o Google Authenticator (ou outro app de códigos) no seu celular, toque em “+” e escaneie:
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR code para o app autenticador" width={200} height={200} className="qr" />
          <p className="t-sm t-muted">
            Não dá pra escanear? Digite a chave: <code className="secret">{secret}</code>
          </p>
        </div>
      ) : (
        <p className="t-muted center">Digite o código de 6 números do seu app autenticador.</p>
      )}
      <label className="field">
        <span className="sr-only">Código de 6 números</span>
        <input
          className="input code-input"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          autoFocus
        />
      </label>
      {err ? (
        <p className="error-text" role="alert">
          {err}
        </p>
      ) : null}
      <button className="btn btn-lg btn-block" disabled={pending || code.length !== 6}>
        {pending ? 'Conferindo…' : 'Confirmar'}
      </button>
      <p className="t-sm t-muted center">Perdeu o celular? Peça pro Thiago remover a verificação no painel do Supabase e cadastre de novo.</p>
    </form>
  )
}
