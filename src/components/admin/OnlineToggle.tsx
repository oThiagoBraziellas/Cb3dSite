'use client'
import { useState, useTransition } from 'react'
import { saveSettings } from '@/app/admin/actions'

const label = { auto: 'Automático pelo horário', ligado: 'Sempre “online agora”', desligado: 'Mostrar “fora do horário”' } as const

export function OnlineToggle({ mode }: { mode: 'auto' | 'ligado' | 'desligado' }) {
  const [value, setValue] = useState(mode)
  const [pending, start] = useTransition()
  const [err, setErr] = useState('')
  return (
    <label className="online-toggle">
      <span className="dot" data-on={value !== 'desligado'} aria-hidden />
      <span className="sr-only">Status “online agora”</span>
      <select
        className="select"
        value={value}
        disabled={pending}
        onChange={(e) => {
          const v = e.target.value as typeof mode
          setValue(v)
          start(async () => {
            const r = await saveSettings({ online_mode: v })
            setErr(r.ok ? '' : r.error)
          })
        }}
      >
        {Object.entries(label).map(([k, l]) => (
          <option key={k} value={k}>
            {l}
          </option>
        ))}
      </select>
      {err ? <span className="error-text t-sm">{err}</span> : null}
    </label>
  )
}
