import type { Metadata } from 'next'
import { SettingsEditor } from '@/components/admin/Editors'
import { MobileTop } from '@/components/admin/Shell'
import { PageHead } from '@/components/admin/ui'
import { getSiteContent } from '@/lib/admin'

export const metadata: Metadata = { title: 'Configurações do site' }

export default async function ConfigPage() {
  const content = await getSiteContent()
  return (
    <>
      <MobileTop title="Ajustes do site" />
      <div className="p-body">
        <PageHead kicker="deixe o site com a sua cara" title="Configurações do site" />
        <SettingsEditor {...content} />
      </div>
    </>
  )
}
