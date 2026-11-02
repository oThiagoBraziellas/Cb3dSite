import type { Metadata } from 'next'
import { ProductForm } from '@/components/admin/ProductForm'
import { MobileTop } from '@/components/admin/Shell'
import { PageHead } from '@/components/admin/ui'
import { getTaxonomy } from '@/lib/admin'

export const metadata: Metadata = { title: 'Nova peça' }

export default async function NovaPeca() {
  const { categories, occasions } = await getTaxonomy()
  return (
    <>
      <MobileTop title="Nova peça" back="/admin/produtos" />
      <div className="p-body">
        <PageHead kicker="Produtos / nova" title="Nova peça" />
        <ProductForm product={null} categories={categories} occasions={occasions} />
      </div>
    </>
  )
}
