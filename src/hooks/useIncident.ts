import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { incidentApi } from '@/services/api/incident'
import type { CreateIncidentBody } from '@/types/incident'

export function useIncidentList(page = 1) {
  return useQuery({
    queryKey: queryKeys.incident.list(page),
    queryFn: () => incidentApi.list(page),
  })
}

export function useIncidentDetail(ticketId: string) {
  return useQuery({
    queryKey: queryKeys.incident.detail(ticketId),
    queryFn: () => incidentApi.detail(ticketId),
    enabled: !!ticketId,
  })
}

export function useCreateIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateIncidentBody) => incidentApi.create(body),
    onSuccess: () => {
      // Invalidate toàn bộ incident list (dùng prefix ['incident', 'list'])
      qc.invalidateQueries({ queryKey: ['incident', 'list'] })
    },
  })
}
