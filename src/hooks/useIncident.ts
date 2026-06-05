import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { incidentApi } from '@/services/api/incident'
import type { CreateIncidentBody, ListTicketsFilter } from '@/types/incident'

export function useIncidentList(page = 1, filter: ListTicketsFilter = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.incident.list(page, filter),
    queryFn: () => incidentApi.list(page, 20, filter),
    enabled,
    placeholderData: keepPreviousData,
  })
}

export function useIncidentDetail(ticketId: string) {
  return useQuery({
    queryKey: queryKeys.incident.detail(ticketId),
    queryFn: () => incidentApi.detail(ticketId),
    enabled: !!ticketId,
    // Polling khi status còn "active":
    //   - 'open': 5s (chờ doctor accept — UX feel live).
    //   - 'resolved': 30s defense-in-depth. BE round 4 đã emit
    //     `ticket.closed`/`ticket.rated` realtime → primary sync; polling chỉ
    //     làm safety net khi socket disconnected / event miss.
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'open') return 5000
      if (status === 'resolved') return 30000
      return false
    },
  })
}

export function useCreateIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateIncidentBody) => incidentApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incident', 'list'] })
      // BE trừ quota khi create — refresh card "Quota sự cố" ở Home ngay.
      qc.invalidateQueries({ queryKey: queryKeys.ticketBalance })
    },
  })
}

export function useCancelIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ticketId, reason }: { ticketId: string; reason?: string }) =>
      incidentApi.cancel(ticketId, reason),
    onSuccess: (_data, { ticketId }) => {
      qc.invalidateQueries({ queryKey: ['incident', 'list'] })
      qc.invalidateQueries({ queryKey: queryKeys.incident.detail(ticketId) })
      qc.invalidateQueries({ queryKey: queryKeys.ticketFull(ticketId) })
      // BE refund quota khi cancel ticket chưa assigned.
      qc.invalidateQueries({ queryKey: queryKeys.ticketBalance })
      // Cancel ảnh hưởng tới breakdown.byStatus của doctor (nếu đã accept).
      qc.invalidateQueries({ queryKey: ['incident', 'doctor-stats'] })
    },
  })
}

/**
 * Xoá sự cố đã huỷ khỏi danh sách của farmer. Optimistic: remove khỏi list
 * cache ngay để UX feel snappy. Rollback nếu BE reject (vd ticket không
 * `cancelled` hoặc race condition).
 */
export function useDeleteIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ticketId: string) => incidentApi.remove(ticketId),
    onSuccess: (_data, ticketId) => {
      qc.invalidateQueries({ queryKey: ['incident', 'list'] })
      qc.invalidateQueries({ queryKey: queryKeys.incident.detail(ticketId) })
      qc.invalidateQueries({ queryKey: queryKeys.ticketFull(ticketId) })
    },
  })
}

export function useMyMilestones() {
  return useQuery({
    queryKey: queryKeys.productionMilestone.myMilestones,
    queryFn: () => incidentApi.myMilestones(),
  })
}


export function useTicketBalance() {
  return useQuery({
    queryKey: queryKeys.ticketBalance,
    queryFn: () => incidentApi.getTicketBalance(),
    staleTime: 60_000,
  })
}
