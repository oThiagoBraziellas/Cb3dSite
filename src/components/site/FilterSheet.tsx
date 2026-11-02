'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Icon } from '../icons'

/** No celular, os filtros abrem num painel que sobe de baixo. No computador ficam na lateral. */
export function FilterSheet({ active, total, children }: { active: number; total: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const params = useSearchParams()
  const [lastParams, setLastParams] = useState(params.toString())
  if (lastParams !== params.toString()) {
    setLastParams(params.toString())
    setOpen(false)
  }
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])
  return (
    <>
      <button type="button" className="btn btn-amarelo only-mobile filter-open" onClick={() => setOpen(true)} aria-expanded={open}>
        Filtros{active ? ` (${active})` : ''}
      </button>
      <div className={`sheet-veil${open ? ' is-open' : ''}`} onClick={() => setOpen(false)} aria-hidden />
      <aside className={`filters${open ? ' is-open' : ''}`} aria-label="Filtros">
        <div className="row between filters-top">
          <h2 className="t-h2">Filtrar peças</h2>
          <button type="button" className="icon-btn only-mobile" aria-label="Fechar filtros" onClick={() => setOpen(false)}>
            <Icon name="fechar" />
          </button>
        </div>
        {children}
        <button type="button" className="btn btn-lg btn-block only-mobile" onClick={() => setOpen(false)}>
          Ver {total} {total === 1 ? 'peça' : 'peças'}
        </button>
      </aside>
    </>
  )
}

export function SortSelect({ value, options }: { value: string; options: { value: string; label: string }[] }) {
  const router = useRouter()
  const params = useSearchParams()
  return (
    <label className="sort">
      <span className="sr-only">Ordenar</span>
      <select
        className="select"
        value={value}
        onChange={(e) => {
          const p = new URLSearchParams(params.toString())
          if (e.target.value === 'populares') p.delete('ordem')
          else p.set('ordem', e.target.value)
          router.push(`/catalogo${p.size ? `?${p}` : ''}`, { scroll: false })
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            Ordenar: {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
