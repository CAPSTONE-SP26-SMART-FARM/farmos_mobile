import type { FarmerAssignment } from './production'

// ── Milestone hiện tại + sắp tới của farmer ──────────────────────────────
export type FarmerMilestoneStatus = 'in_progress' | 'pending'

export type FarmerCurrentUpcomingMilestone = {
  id: string
  stageName: string
  milestoneOrder: number
  status: FarmerMilestoneStatus
  cropSeasonId: string
  zoneId: string
  zoneName: string
  farmId: string
  farmName: string
}

// ── Paging ───────────────────────────────────────────────────────────────
export type PagingMeta = {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// ── Assignment theo milestone (paginated) ────────────────────────────────
/** Khớp 1-1 với Prisma enum DeviceStatus của farm_os_be. */
export type DeviceStatus =
  | 'available'
  | 'purchase'
  | 'install'
  | 'inactive'
  | 'active'
  | 'error'
  | 'revoked'

export type FarmerMilestoneAssignmentsQuery = {
  page?: number
  limit?: number
  q?: string
  status?: DeviceStatus
}

export type FarmerMilestoneAssignmentsRes = {
  data: FarmerAssignment[]
  meta: PagingMeta
}

// ── Sensor series (biểu đồ) — interval-bucketed ──────────────────────────
export type SensorSeriesInterval = '10s' | '1m' | '1h' | '1D' | '1W' | '1M'

export type SensorSeriesPoint = { timestamp: string; value: number }

export type SensorSeriesRes = {
  assignmentId: string
  sensorId: string
  sensorType: string
  interval: SensorSeriesInterval
  startedAt: string | null
  data: SensorSeriesPoint[]
}

export type SensorSeriesQuery = { interval?: SensorSeriesInterval }

// ── Sensor stats (4 badge) ───────────────────────────────────────────────
export type SensorStatsPeriod = 'today' | '7d' | '10d'

export type SensorStatsRes = {
  assignmentId: string
  sensorId: string
  period: SensorStatsPeriod
  currentValue: number
  minValue: number
  maxValue: number
  alertCount: number
}

export type SensorStatsQuery = { period?: SensorStatsPeriod }
