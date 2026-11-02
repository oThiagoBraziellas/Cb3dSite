import type { OrderStatus } from './types'

export const statusLabel: Record<OrderStatus, string> = {
  orcamento: 'Orçamento',
  producao: 'Em produção',
  pronto: 'Pronto',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}
