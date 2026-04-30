export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'
export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'cancelled'
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'

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
  createdBy: string
  assignedTo: string | null
  farmId: string | null
  zoneId: string | null
  creator: UserBrief
  assignee: UserBrief | null
  farm: FarmBrief | null
  zone: ZoneBrief | null
  attachments: { id: string; url: string; uploadedBy: string; createdAt: string }[]
}

export type CreateIncidentBody = {
  milestoneId: string
  title: string
  description: string
  severity: IncidentSeverity
  attachments?: { url: string }[]
}

export type ListIncidentTicketsRes = {
  data: IncidentTicket[]
  meta: { page: number; limit: number; totalItems: number; totalPages: number }
}
