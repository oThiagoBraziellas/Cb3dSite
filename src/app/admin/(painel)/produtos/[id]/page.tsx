import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProductForm } from '@/components/admin/ProductForm'
import { MobileTop } from '@/components/admin/Shell'
import { PageHead } from '@/components/admin/ui'
import { Icon } from '@/components/icons'
import { getAdminProduct, getTaxonomy } from '@/lib/admin'

export const metadata: Metadata = { title: 'Editar peça' }

export default async function EditarPeca({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [product, { categories, occasions }] = await Promise.all([getAdminProduct(id), getTaxonomy()])
  if (!product) notFound()
  return (
    <>
      <MobileTop title="Editar peça" back="/admin/produtos" />
      <div className="p-body">
        <PageHead kicker="Produtos / editar" title={product.name}>
          <Link href={`/catalogo/${product.slug}`} target="_blank" className="btn btn-branco">
            <Icon name="olho" size={18} /> Ver no site
          </Link>
        </PageHead>
        <ProductForm key={product.id} product={product} categories={categories} occasions={occasions} />
      </div>
    </>
  )
}
