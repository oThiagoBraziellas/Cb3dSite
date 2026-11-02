'use client'
// "Minha lista" e favoritos ficam só no navegador da cliente.
import { useSyncExternalStore } from 'react'
import type { ListItem } from './types'

type State = { list: ListItem[]; favs: string[] }
const KEY = 'cb3d:v1'
const empty: State = { list: [], favs: [] }
let state: State = empty
let loaded = false
const subs = new Set<() => void>()

function load() {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      state = { list: Array.isArray(parsed.list) ? parsed.list : [], favs: Array.isArray(parsed.favs) ? parsed.favs : [] }
    }
  } catch {
    state = empty
  }
}
function save(next: State) {
  state = next
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* navegador sem storage: segue só na memória */
  }
  subs.forEach((f) => f())
}
function subscribe(f: () => void) {
  load()
  subs.add(f)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false
      load()
      subs.forEach((s) => s())
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    subs.delete(f)
    window.removeEventListener('storage', onStorage)
  }
}

export function useStore() {
  return useSyncExternalStore(
    subscribe,
    () => {
      load()
      return state
    },
    () => empty,
  )
}

export const listKey = (i: Pick<ListItem, 'product_id' | 'colorName' | 'personalization' | 'gift'>) =>
  [i.product_id, i.colorName, i.personalization.trim().toLowerCase(), i.gift ? 'g' : ''].join('|')

export const actions = {
  add(item: Omit<ListItem, 'key'>) {
    const key = listKey(item)
    const existing = state.list.find((i) => i.key === key)
    const list = existing
      ? state.list.map((i) => (i.key === key ? { ...i, qty: Math.min(99, i.qty + item.qty), gift_message: item.gift_message || i.gift_message } : i))
      : [...state.list, { ...item, key }]
    save({ ...state, list })
    window.dispatchEvent(new CustomEvent('cb3d:added'))
  },
  setQty(key: string, qty: number) {
    save({ ...state, list: state.list.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(99, qty)) } : i)) })
  },
  update(key: string, patch: Partial<ListItem>) {
    save({ ...state, list: state.list.map((i) => (i.key === key ? { ...i, ...patch } : i)) })
  },
  remove(key: string) {
    save({ ...state, list: state.list.filter((i) => i.key !== key) })
  },
  clear() {
    save({ ...state, list: [] })
  },
  toggleFav(id: string) {
    const favs = state.favs.includes(id) ? state.favs.filter((f) => f !== id) : [...state.favs, id]
    save({ ...state, favs })
    return favs.includes(id)
  },
}

export const listCount = (s: State) => s.list.reduce((n, i) => n + i.qty, 0)
export const listTotal = (s: State) => s.list.reduce((n, i) => n + (i.price_cents + (i.gift ? i.gift_wrap_cents : 0)) * i.qty, 0)
