export type TicketCategory = {
  id: string
  code: string
  name: string
  description: string | null
  unitPrice: number
  currency: string
  isActive: boolean
}

export type ActiveTicketCategoriesRes = {
  data: TicketCategory[]
}
