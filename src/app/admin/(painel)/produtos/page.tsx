import type { Metadata } from 'next'
import Link from 'next/link'
import { MobileTop } from '@/components/admin/Shell'
import { PageHead } from '@/components/admin/ui'
import { BrandIcon, Icon } from '@/components/icons'
import { getAdminProducts, getTaxonomy } from '@/lib/admin'
import { colorVar, money } from '@/lib/format'
import type { Product } from '@/lib/types'

export const metadata: Metadata = { title: 'Produtos' }

const tabs = [
  { v: '', l: 'Todas' },
  { v: 'publicado', l: 'Publicadas' },
  { v: 'rascunho', l: 'Rascunhos' },
  { v: 'oculto', l: 'Ocultas' },
  { v: 'esgotado', l: 'Esgotadas' },
  { v: 'sem-estoque', l: 'Sem estoque' },
]
const policyLabel = { esgotado: 'Mostra “esgotado”', encomenda: 'Sob encomenda', avisar: 'Avisar quando voltar' }
const statusBg: Record<Product['status'], string> = { publicado: 'var(--feedback-verde)', esgotado: 'var(--feedback-vermelho)', rascunho: 'var(--bg-soft)', oculto: 'var(--bg-surface)' }
const statusName: Record<Product['status'], string> = { publicado: 'Publicada', esgotado: 'Esgotada', rascunho: 'Rascunho', oculto: 'Oculta' }

export default async function ProdutosPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = '', q = '' } = await searchParams
  const [all, { categories }] = await Promise.all([getAdminProducts(), getTaxonomy()])
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const list = all
    .filter((p) => (status === 'sem-estoque' ? p.stock === 0 : status ? p.status === status : true))
    .filter((p) => (q ? norm(p.name).includes(norm(q)) : true))
  const count = (v: string) => (v === 'sem-estoque' ? all.filter((p) => p.stock === 0).length : v ? all.filter((p) => p.status === v).length : all.length)

  return (
    <>
      <MobileTop
        title={`Produtos (${all.length})`}
        right={
          <Link href="/admin/produtos/nova" className="icon-btn add-btn" aria-label="Nova peça">
            <Icon name="mais" />
          </Link>
        }
      />
      <div className="p-body">
        <PageHead kicker="suas peças" title={`Produtos (${all.length})`}>
          <form className="search-pill" action="/admin/produtos">
            <Icon name="buscar" size={20} />
            <label className="sr-only" htmlFor="q">
              Buscar peça
            </label>
            <input id="q" name="q" defaultValue={q} placeholder="Buscar peça" />
            {status ? <input type="hidden" name="status" value={status} /> : null}
          </form>
          <Link href="/admin/produtos/nova" className="btn only-desktop">
            <Icon name="mais" size={18} /> Nova peça
          </Link>
        </PageHead>
        <form className="search-pill only-mobile-flex" action="/admin/produtos">
          <Icon name="buscar" size={20} />
          <input name="q" defaultValue={q} placeholder="Buscar peça" aria-label="Buscar peça" />
        </form>
        <div className="chips-scroll">
          {tabs.map((t) => (
            <Link key={t.v} href={t.v ? `/admin/produtos?status=${t.v}` : '/admin/produtos'} className="chip" aria-current={status === t.v}>
              {t.l} ({count(t.v)})
            </Link>
          ))}
        </div>

        {list.length ? (
          <section className="panel-box">
            <div className="table-wrap only-desktop-block">
              <table className="table">
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Peça</th>
                    <th>Preço</th>
                    <th>Estoque</th>
                    <th>Status</th>
                    <th>Quando zerar</th>
                    <th>
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Thumb p={p} />
                      </td>
                      <td>
                        <Link href={`/admin/produtos/${p.id}`} className="t-bold row-link">
                          {p.name}
                        </Link>
                        <span className="t-sm t-muted block">{categories.find((c) => c.id === p.category_id)?.name ?? 'Sem categoria'}</span>
                      </td>
                      <td>{money(p.price_cents)}</td>
                      <td>
                        <span className="row">
                          <strong>{p.stock} un.</strong>
                          {p.stock === 0 ? <span className="mini-tag pink">zerado</span> : p.stock <= 3 ? <span className="mini-tag pink">baixo</span> : null}
                        </span>
                      </td>
                      <td>
                        <span className="mini-tag" style={{ background: statusBg[p.status] }}>
                          {statusName[p.status]}
                        </span>
                      </td>
                      <td>{policyLabel[p.stock_policy]}</td>
                      <td>
                        <span className="row">
                          <Link href={`/admin/produtos/${p.id}`} className="icon-btn small" aria-label={`Editar ${p.name}`}>
                            <Icon name="editar" size={18} />
                          </Link>
                          <Link href={`/catalogo/${p.slug}`} target="_blank" className="icon-btn small" aria-label={`Ver ${p.name} no site`}>
                            <Icon name="olho" size={18} />
                          </Link>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="order-cards only-mobile-block">
              {list.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/produtos/${p.id}`} className="prod-row">
                    <Thumb p={p} />
                    <span className="grow">
                      <strong>{p.name}</strong>
                      <span className="t-sm t-muted">
                        {money(p.price_cents)} · estoque {p.stock} un.
                      </span>
                      <span className="mini-tag" style={{ background: statusBg[p.status] }}>
                        {statusName[p.status]}
                      </span>
                    </span>
                    <Icon name="seta-dir" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <div className="panel-box pad stack center">
            <BrandIcon name="cubo" size={88} />
            <p>Nenhuma peça aqui.</p>
            <Link href="/admin/produtos/nova" className="btn">
              Cadastrar peça
            </Link>
          </div>
        )}
      </div>
    </>
  )
}

function Thumb({ p }: { p: Product }) {
  const photo = p.media.find((m) => m.kind === 'foto')
  return (
    <span className="thumb" style={{ background: colorVar(p.color) }}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo.url} alt="" />
      ) : (
        <BrandIcon name={p.icon} size={42} />
      )}
    </span>
  )
}
