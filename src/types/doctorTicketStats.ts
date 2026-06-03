import type {
  IncidentSeverity,
  TicketPriority,
  TicketStatus,
} from './incident'

// Khớp BE: 'today' | '7d' | '30d' | '90d' | 'all'. Khác với farmer ticket list (TicketDateRange).
export type StatsDateRange = 'today' | '7d' | '30d' | '90d' | 'all'

export type DoctorTicketStatsQuery = {
  dateRange?: StatsDateRange
  from?: string
  to?: string
  includeRecent?: number
  includeTrend?: boolean
}

export type DoctorTicketStatsTotals = {
  all: number
  /** open + assigned + in_progress */
  active: number
  /** resolved + closed + cancelled */
  ended: number
  /** resolved + closed (KHÔNG cancelled) */
  completed: number
  cancelled: number
}

export type DoctorTicketStatsRates = {
  completionRate: number
  cancellationRate: number
  /** ACCEPTED broadcasts / total broadcasts gửi tới doctor */
  acceptanceRate: number
}

export type DoctorTicketStatsBreakdown = {
  byStatus: Record<TicketStatus, number>
  bySeverity: Record<IncidentSeverity, number>
  byPriority: Record<TicketPriority, number>
}

export type DoctorTicketStatsPerformance = {
  avgResolutionSeconds: number | null
  medianResolutionSeconds: number | null
  p90ResolutionSeconds: number | null
  sampleSize: number
}

export type DoctorTicketStatsRevenue = {
  totalEarnings: number
  averagePerTicket: number
  ticketsWithEarnings: number
}

export type DoctorTicketStatsRecent = {
  id: string
  ticketNumber: string
  title: string
  status: TicketStatus
  severity: IncidentSeverity
  priority: TicketPriority
  createdAt: string
  resolvedAt: string | null
  farmName: string | null
  zoneName: string | null
}

export type DoctorTicketStatsTrendPoint = {
  date: string
  created: number
  resolved: number
  cancelled: number
}

export type DoctorTicketStatsRes = {
  range: { from: string | null; to: string; label: string }
  totals: DoctorTicketStatsTotals
  rates: DoctorTicketStatsRates
  breakdown: DoctorTicketStatsBreakdown
  performance: DoctorTicketStatsPerformance
  revenue: DoctorTicketStatsRevenue
  trend?: DoctorTicketStatsTrendPoint[]
  recent?: DoctorTicketStatsRecent[]
  meta: { generatedAt: string; cacheTtlSeconds: number }
}
