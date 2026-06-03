import { incidentApi } from '@/services/api/incident'
import { queryKeys } from '@/constants/queryKeys'
import type {
  DoctorTicketStatsQuery,
  DoctorTicketStatsRes,
  StatsDateRange,
} from '@/types/doctorTicketStats'
import { useQuery } from '@tanstack/react-query'

export type { DoctorTicketStatsRes, StatsDateRange } from '@/types/doctorTicketStats'

export type UseDoctorTicketStatsOptions = {
  /** Phạm vi thời gian. Default 'all'. */
  dateRange?: StatsDateRange
  /** Lấy thêm trend theo ngày + top recent tickets. Default false (chỉ dùng cho analytics screen). */
  full?: boolean
  enabled?: boolean
}

/**
 * Tổng hợp Thống kê sự cố cho doctor.
 *
 * Source: `GET /ticket/incident/doctor/stats` (server-side aggregate).
 * Server đã trả `Cache-Control: private, max-age=30` — RQ giữ thêm staleTime 60s
 * để khớp meta.cacheTtlSeconds gợi ý.
 */
export function useDoctorTicketStats(opts: UseDoctorTicketStatsOptions = {}) {
  const { dateRange = 'all', full = false, enabled = true } = opts

  const query: DoctorTicketStatsQuery = {
    dateRange,
    includeRecent: full ? 5 : 0,
    includeTrend: full,
  }

  const q = useQuery<DoctorTicketStatsRes>({
    queryKey: queryKeys.incident.doctorStats(query),
    queryFn: () => incidentApi.doctorTicketStats(query),
    staleTime: 60_000,
    enabled,
  })

  return {
    stats: q.data,
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: q.refetch,
  }
}
