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
    // Poll mỗi 5s khi chờ bác sĩ tiếp nhận để auto update trạng thái
    refetchInterval: (query) =>
      query.state.data?.status === 'open' ? 5000 : false,
  })
}

export function useCreateIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateIncidentBody) => incidentApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incident', 'list'] }),
  })
}

export function useEndIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ticketId: string) => incidentApi.endIncident(ticketId),
    onSuccess: (_data, ticketId) => {
      qc.invalidateQueries({ queryKey: ['incident', 'list'] })
      qc.invalidateQueries({ queryKey: ['incident', 'doctor-list'] })
      qc.invalidateQueries({ queryKey: queryKeys.incident.detail(ticketId) })
      qc.invalidateQueries({ queryKey: queryKeys.incident.doctorDetail(ticketId) })
    },
  })
}

export function useMyMilestones() {
  return useQuery({
    queryKey: queryKeys.productionMilestone.myMilestones,
    queryFn: () => incidentApi.myMilestones(),
  })
}

export function useMyAssignments() {
  return useQuery({
    queryKey: queryKeys.sensorReading.myAssignments,
    queryFn: () => incidentApi.myAssignments(),
  })
}
