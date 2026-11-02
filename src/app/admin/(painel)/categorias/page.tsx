import type { Metadata } from 'next'
import { TaxonomyEditor } from '@/components/admin/Editors'
import { MobileTop } from '@/components/admin/Shell'
import { PageHead } from '@/components/admin/ui'
import { getTaxonomy } from '@/lib/admin'

export const metadata: Metadata = { title: 'Categorias e ocasiões' }

export default async function CategoriasPage() {
  const { categories, occasions } = await getTaxonomy()
  return (
    <>
      <MobileTop title="Categorias" />
      <div className="p-body">
        <PageHead kicker="organize o catálogo" title="Categorias e ocasiões" />
        <TaxonomyEditor categories={categories} occasions={occasions} />
      </div>
    </>
  )
}
