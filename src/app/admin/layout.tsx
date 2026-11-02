import type { Metadata } from 'next'
import './admin.css'

export const metadata: Metadata = {
  title: { default: 'Painel', template: '%s · Painel CB3D' },
  robots: { index: false, follow: false },
}

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="admin-root">{children}</div>
}
