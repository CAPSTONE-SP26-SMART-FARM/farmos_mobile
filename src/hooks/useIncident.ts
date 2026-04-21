import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { incidentApi } from '@/services/api/incident'
import type { CreateIncidentBody } from '@/types/incident'
import type { FarmerMyMilestone, FarmerAssignment } from '@/types/production'

export function useIncidentList(page = 1) {
  return useQuery({
    queryKey: queryKeys.incident.list(page),
    queryFn: () => incidentApi.list(page),
  })
}

export function useIncidentDetail(ticketId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.incident.detail(ticketId),
    queryFn: () => incidentApi.detail(ticketId),
    enabled: !!ticketId,
  })

  // Poll mỗi 5s khi chờ bác sĩ tiếp nhận để tự update real-time
  const isWaiting = query.data?.status === 'open'

  useQuery({
    queryKey: [...queryKeys.incident.detail(ticketId), 'poll'],
    queryFn: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.incident.detail(ticketId) })
      return null
    },
    enabled: !!ticketId && isWaiting,
    refetchInterval: 5000,
  })

  return query
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
