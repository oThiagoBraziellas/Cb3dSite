// Dados de exemplo usados quando o Supabase ainda não foi configurado.
// Espelham supabase/seed.sql.
import type { Category, Occasion, Order, Product, Settings, Slide, SpecialDate, StockAlert, Testimonial } from './types'

export const demoCategories: Category[] = [
  { id: 'c1', slug: 'presentes', name: 'Presentes personalizados', icon: 'presente', color: 'rosa', position: 1 },
  { id: 'c2', slug: 'decoracao', name: 'Decoração e organização', icon: 'cubo', color: 'azul', position: 2 },
  { id: 'c3', slug: 'brinquedos', name: 'Brinquedos e colecionáveis', icon: 'ursinho', color: 'amarelo', position: 3 },
  { id: 'c4', slug: 'chaveiros', name: 'Chaveiros', icon: 'chaveiro', color: 'roxo', position: 4 },
]

export const demoOccasions: Occasion[] = [
  { id: 'o1', slug: 'aniversario', name: 'Aniversário', position: 1 },
  { id: 'o2', slug: 'natal', name: 'Natal', position: 2 },
  { id: 'o3', slug: 'dia-das-maes', name: 'Dia das Mães', position: 3 },
  { id: 'o4', slug: 'casamento', name: 'Casamento', position: 4 },
  { id: 'o5', slug: 'lembrancinhas', name: 'Lembrancinhas', position: 5 },
  { id: 'o6', slug: 'volta-as-aulas', name: 'Volta às aulas', position: 6 },
]

const colors = [
  { id: 'k1', name: 'Rosa chiclete', hex: '#F9208D', position: 1 },
  { id: 'k2', name: 'Amarelo', hex: '#FCD715', position: 2 },
  { id: 'k3', name: 'Azul', hex: '#05BDFC', position: 3 },
  { id: 'k4', name: 'Roxo', hex: '#8C43F5', position: 4 },
  { id: 'k5', name: 'Branco', hex: '#FFFFFF', position: 5 },
]

type Seed = Pick<Product, 'slug' | 'name' | 'description' | 'price_cents' | 'production_time' | 'stock' | 'stock_policy' | 'measures' | 'highlight' | 'customizable' | 'icon' | 'color' | 'popularity'> & {
  cat: string
  occ: string[]
}

const seeds: Seed[] = [
  { slug: 'chaveiro-com-nome', name: 'Chaveiro com nome', description: 'Chaveiro com o nome que você quiser, em até duas cores. Ótimo pra lembrancinha.', price_cents: 1800, production_time: '3 dias úteis', stock: 24, stock_policy: 'encomenda', measures: '5 × 3 cm', highlight: 'novo', customizable: true, icon: 'chaveiro', color: 'azul', popularity: 40, cat: 'c4', occ: ['o1', 'o5'] },
  { slug: 'ursinho-articulado', name: 'Ursinho articulado', description: 'Braços e pernas que mexem de verdade, impresso numa peça só. Ótimo pra presentear e enfeitar a estante.', price_cents: 3500, production_time: '5 dias úteis', stock: 3, stock_policy: 'encomenda', measures: '8 × 6 × 5 cm', highlight: 'destaque', customizable: true, icon: 'ursinho', color: 'rosa', popularity: 35, cat: 'c3', occ: ['o1', 'o2'] },
  { slug: 'caixinha-presente', name: 'Caixinha presente', description: 'Caixinha com tampa pra guardar mimos e entregar presentes.', price_cents: 4200, production_time: '4 dias úteis', stock: 0, stock_policy: 'avisar', measures: '10 × 10 × 6 cm', highlight: 'nenhum', customizable: false, icon: 'presente', color: 'amarelo', popularity: 30, cat: 'c1', occ: ['o2', 'o3'] },
  { slug: 'organizador-de-mesa', name: 'Organizador de mesa', description: 'Organizador com divisórias pra canetas, clipes e post-its.', price_cents: 5500, production_time: '6 dias úteis', stock: 6, stock_policy: 'encomenda', measures: '18 × 10 × 9 cm', highlight: 'nenhum', customizable: false, icon: 'cubo', color: 'nevoa', popularity: 22, cat: 'c2', occ: ['o6'] },
  { slug: 'coracao-decorativo', name: 'Coração decorativo', description: 'Coração com textura de camadas, lindo pra Dia das Mães e casamentos.', price_cents: 2400, production_time: '3 dias úteis', stock: 12, stock_policy: 'esgotado', measures: '9 × 8 cm', highlight: 'nenhum', customizable: true, icon: 'coracao', color: 'amarelo', popularity: 18, cat: 'c2', occ: ['o3', 'o4'] },
  { slug: 'bobina-porta-trecos', name: 'Bobina porta-trecos', description: 'Porta-trecos em formato de bobina de filamento. Gira de verdade!', price_cents: 2990, production_time: '4 dias úteis', stock: 5, stock_policy: 'encomenda', measures: '9 cm de diâmetro', highlight: 'novo', customizable: false, icon: 'bobina', color: 'azul', popularity: 12, cat: 'c2', occ: [] },
  { slug: 'estrela-de-mesa', name: 'Estrela de mesa', description: 'Estrela pra enfeitar a mesa ou a árvore de Natal.', price_cents: 2200, production_time: '3 dias úteis', stock: 8, stock_policy: 'encomenda', measures: '10 × 10 cm', highlight: 'nenhum', customizable: false, icon: 'brilho', color: 'roxo', popularity: 10, cat: 'c2', occ: ['o2'] },
  { slug: 'mini-impressora', name: 'Mini impressora', description: 'Miniatura de impressora 3D pra quem ama o hobby. Colecionável.', price_cents: 4800, production_time: '7 dias úteis', stock: 2, stock_policy: 'encomenda', measures: '7 × 7 × 8 cm', highlight: 'nenhum', customizable: false, icon: 'impressora', color: 'amarelo', popularity: 8, cat: 'c3', occ: [] },
  { slug: 'cubo-quebra-cabeca', name: 'Cubo quebra-cabeça', description: 'Cubo de encaixe pra montar e desmontar. Desafio pra todas as idades.', price_cents: 2700, production_time: '4 dias úteis', stock: 10, stock_policy: 'encomenda', measures: '6 × 6 × 6 cm', highlight: 'nenhum', customizable: false, icon: 'cubo', color: 'rosa', popularity: 6, cat: 'c3', occ: [] },
]

export const demoProducts: Product[] = seeds.map((s, i) => ({
  id: `p${i + 1}`,
  slug: s.slug,
  name: s.name,
  description: s.description,
  price_cents: s.price_cents,
  production_time: s.production_time,
  pickup_time: '1 a 2 dias',
  stock: s.stock,
  stock_policy: s.stock_policy,
  measures: s.measures,
  material: 'PLA (plástico de origem vegetal)',
  weight: '',
  category_id: s.cat,
  highlight: s.highlight,
  status: s.stock === 0 && s.stock_policy === 'esgotado' ? 'esgotado' : 'publicado',
  customizable: s.customizable,
  gift_wrap: true,
  gift_wrap_cents: 500,
  icon: s.icon,
  color: s.color,
  position: i + 1,
  popularity: s.popularity,
  created_at: new Date(Date.UTC(2026, 9, 30 - i)).toISOString(),
  colors,
  media: [],
  occasion_ids: s.occ,
}))

export const demoSettings: Settings = {
  whatsapp: '5561900000000',
  instagram: 'cb3d.impressao3d',
  tiktok: 'cb3d.impressao3d',
  online_mode: 'auto',
  hours: { seg: ['09:00', '18:00'], ter: ['09:00', '18:00'], qua: ['09:00', '18:00'], qui: ['09:00', '18:00'], sex: ['09:00', '18:00'], sab: ['09:00', '13:00'], dom: null },
  offline_message: 'Respondo amanhã cedinho 💖',
  notice_on: true,
  notice_text: 'Encomendas de Natal até 10/12 🎄',
  notice_start: null,
  notice_end: '2026-12-10',
  deadlines_text: 'Produção de 3 a 7 dias úteis',
  pickup_text: 'Retirada em mãos, combinada pelo WhatsApp',
  notify_whatsapp: true,
  notify_email: true,
  notify_panel: true,
}

export const demoSlides: Slide[] = [
  { id: 's1', kicker: 'pra presentear quem você ama', title: 'Peças únicas, feitas camada por camada', subtitle: 'Presentes, decoração e brinquedos impressos em 3D pela Cintia, aqui em Brasília.', button_label: 'Ver o catálogo', button_href: '/catalogo', icon: 'ursinho', color: 'rosa', image_path: null, active: true, position: 1 },
  { id: 's2', kicker: 'natal chegando', title: 'Presentes de Natal até 10/12', subtitle: 'Escolha agora e retire a tempo da ceia.', button_label: 'Ver presentes', button_href: '/catalogo?ocasiao=natal', icon: 'presente', color: 'amarelo', image_path: null, active: true, position: 2 },
  { id: 's3', kicker: 'do seu jeitinho', title: 'Tem uma ideia? A gente imprime.', subtitle: 'Mande uma foto de referência, as cores e a data.', button_label: 'Peça personalizada', button_href: '/personalizada', icon: 'impressora', color: 'azul', image_path: null, active: true, position: 3 },
]

export const demoTestimonials: Testimonial[] = [
  { id: 't1', quote: 'Encomendei os chaveiros da festa da minha filha e ficaram lindos! A Cintia caprichou em cada detalhe.', author: 'Juliana', place: 'Águas Claras', stars: 5, active: true, position: 1 },
  { id: 't2', quote: 'Pedi um topo de bolo com o nome do meu filho e chegou antes do prazo. Super indico!', author: 'Marcos', place: 'Taguatinga', stars: 5, active: true, position: 2 },
  { id: 't3', quote: 'O organizador de mesa ficou perfeito na cor que eu escolhi. Já quero outro!', author: 'Renata', place: 'Asa Norte', stars: 5, active: true, position: 3 },
]

export const demoDates: SpecialDate[] = [
  { id: 'd1', name: 'Natal', day: '2026-12-25', order_by: '2026-12-10', active: true },
  { id: 'd2', name: 'Réveillon', day: '2026-12-31', order_by: '2026-12-15', active: true },
  { id: 'd3', name: 'Volta às aulas', day: '2027-02-14', order_by: '2027-01-31', active: true },
]

export const demoOrders: Order[] = [
  { id: 'r1', number: 128, source: 'personalizado', status: 'orcamento', customer_name: 'Juliana', customer_phone: '61912345678', needed_by: '2026-12-20', notes: '', total_cents: 0, agreed_cents: null, custom_type: 'Lembrancinha', custom_description: 'Chaveirinhos de unicórnio com o nome “Alice 5 anos” pra festa.', custom_colors: ['Rosa chiclete', 'Amarelo'], custom_size: 'Pequeno (até 5 cm)', custom_qty: 30, reference_path: null, stock_applied: false, seen_at: null, created_at: '2026-11-01T22:05:00Z', items: [] },
  { id: 'r2', number: 127, source: 'lista', status: 'producao', customer_name: 'Marcos', customer_phone: '61988887777', needed_by: '2026-12-12', notes: 'Nome: Theo', total_cents: 3000, agreed_cents: 3000, custom_type: null, custom_description: null, custom_colors: [], custom_size: null, custom_qty: null, reference_path: null, stock_applied: true, seen_at: '2026-10-30T10:00:00Z', created_at: '2026-10-30T09:40:00Z', items: [{ id: 'i1', product_id: 'p2', product_name: 'Topo de bolo com nome', color: 'Azul', personalization: 'Theo', gift: false, gift_message: '', qty: 1, unit_cents: 3000 }] },
  { id: 'r3', number: 126, source: 'lista', status: 'pronto', customer_name: 'Renata', customer_phone: '61977776666', needed_by: '2026-12-10', notes: '', total_cents: 5500, agreed_cents: 5500, custom_type: null, custom_description: null, custom_colors: [], custom_size: null, custom_qty: null, reference_path: null, stock_applied: true, seen_at: '2026-10-29T12:00:00Z', created_at: '2026-10-29T11:00:00Z', items: [{ id: 'i2', product_id: 'p4', product_name: 'Organizador de mesa', color: 'Roxo', personalization: '', gift: false, gift_message: '', qty: 1, unit_cents: 5500 }] },
  { id: 'r4', number: 125, source: 'lista', status: 'producao', customer_name: 'Paula', customer_phone: '61966665555', needed_by: '2026-12-14', notes: '', total_cents: 8000, agreed_cents: 8000, custom_type: null, custom_description: null, custom_colors: [], custom_size: null, custom_qty: null, reference_path: null, stock_applied: true, seen_at: '2026-10-28T12:00:00Z', created_at: '2026-10-28T10:00:00Z', items: [{ id: 'i3', product_id: 'p2', product_name: 'Ursinho articulado', color: 'Rosa chiclete', personalization: '', gift: true, gift_message: 'Feliz Natal!', qty: 2, unit_cents: 4000 }] },
  { id: 'r5', number: 124, source: 'lista', status: 'entregue', customer_name: 'Bruno', customer_phone: '61955554444', needed_by: null, notes: '', total_cents: 9000, agreed_cents: 9000, custom_type: null, custom_description: null, custom_colors: [], custom_size: null, custom_qty: null, reference_path: null, stock_applied: true, seen_at: '2026-10-20T12:00:00Z', created_at: '2026-10-20T10:00:00Z', items: [{ id: 'i4', product_id: 'p1', product_name: 'Chaveiro com nome', color: 'Azul', personalization: 'Bruno', gift: false, gift_message: '', qty: 5, unit_cents: 1800 }] },
]

export const demoAlerts: StockAlert[] = [
  { id: 'a1', product_id: 'p3', name: 'Ana', phone: '61999990000', notified: false, created_at: '2026-10-31T15:00:00Z' },
  { id: 'a2', product_id: 'p3', name: 'Carla', phone: '61988881111', notified: true, created_at: '2026-10-25T12:00:00Z' },
]
