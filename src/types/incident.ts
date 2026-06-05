// Severity của support_ticket được tách khỏi enum severity của Alert (low|medium|high|critical).
// Support_ticket chỉ cần 2 mức: bình thường vs khẩn cấp.
export type IncidentSeverity = 'normal' | 'urgent'
export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'cancelled'
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'
export type TicketSource = 'SUBSCRIPTION_GRANT' | 'PURCHASED' | 'ADMIN_GIFT'
export type TicketDateRange = 'today' | '3d' | '1w' | '1m' | 'all'

export type ListTicketsFilter = {
  status?: TicketStatus
  dateRange?: TicketDateRange
  search?: string
}

export type ListDoctorTicketsFilter = ListTicketsFilter & {
  ended?: boolean
}

export type UserBrief = {
  id: string
  fullName: string
  email: string
  phone: string | null
  avatarUrl: string | null
  role: string
}

export type ZoneBrief = {
  id: string
  name: string
  farmId: string
}

export type FarmBrief = {
  id: string
  name: string
  ownerId: string
}

export type IncidentTicket = {
  id: string
  ticketNumber: string
  ticketType: string
  status: TicketStatus
  priority: TicketPriority
  severity: IncidentSeverity
  title: string
  description: string
  createdAt: string
  updatedAt: string
  assignedAt: string | null
  createdBy: string
  assignedTo: string | null
  farmId: string | null
  zoneId: string | null
  creator: UserBrief
  assignee: UserBrief | null
  farm: FarmBrief | null
  zone: ZoneBrief | null
  attachments: { id: string; url: string; uploadedBy: string; createdAt: string }[]
  // v2 fields
  categoryConfigId: string | null
  unitPriceSnapshot: number | null
  commissionPercentSnapshot: number | null
  source: TicketSource | null
  sourceLedgerId: string | null
  // AI fallback fields — true khi AI fallback resolve ticket (owner chọn FALLBACK_AI).
  isAiResolved: boolean
  aiResolvedAt: string | null
}

export type CreateIncidentBody = {
  milestoneId: string
  categoryConfigId: string
  title: string
  description: string
  severity: IncidentSeverity
  attachments?: { url: string }[]
}

export type ListIncidentTicketsRes = {
  data: IncidentTicket[]
  meta: { page: number; limit: number; totalItems: number; totalPages: number }
}

export type TicketBalanceItem = {
  categoryConfigId: string
  categoryCode: string
  categoryName: string
  featureCode: string
  creditType: string
  unitPrice: number
  fromSubscription: number
  fromPurchased: number
  total: number
}
