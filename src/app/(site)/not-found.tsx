import Link from 'next/link'
import { BrandIcon } from '@/components/icons'

export default function NotFound() {
  return (
    <div className="wrap section-top stack center empty" style={{ minHeight: '50vh' }}>
      <BrandIcon name="bobina" size={140} />
      <h1 className="t-h1">Essa página se enrolou no filamento</h1>
      <p className="t-lg t-muted">Não achamos o que você procurou. Que tal voltar pro catálogo?</p>
      <Link href="/catalogo" className="btn btn-lg">
        Ver o catálogo
      </Link>
    </div>
  )
}
