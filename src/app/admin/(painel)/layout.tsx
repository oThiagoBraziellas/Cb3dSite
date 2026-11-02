import { BottomNav, Sidebar } from '@/components/admin/Shell'
import { getOrderCounts, requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin()
  const counts = await getOrderCounts()
  return (
    <div className="panel">
      {session.demo ? <div className="demo-banner panel-demo">Modo demonstração: nada é salvo. Configure o Supabase para usar o painel de verdade.</div> : null}
      <Sidebar newOrders={counts.novos} demo={session.demo} />
      <div className="panel-main">{children}</div>
      <BottomNav newOrders={counts.novos} />
    </div>
  )
}
