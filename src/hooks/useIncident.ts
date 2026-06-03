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
    refetchInterval: (query) =>
      query.state.data?.status === 'open' ? 5000 : false,
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
