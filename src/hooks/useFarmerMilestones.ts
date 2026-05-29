import { useMemo } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { farmerMilestoneApi } from '@/services/api/farmerMilestone'
import type { FarmerMilestoneAssignmentsQuery } from '@/types/farmerIot'

export function useFarmerCurrentUpcomingMilestones() {
  return useQuery({
    queryKey: queryKeys.farmerMilestone.currentUpcoming,
    queryFn: farmerMilestoneApi.currentUpcoming,
  })
}

export function useFarmerMilestoneAssignments(
  milestoneId: string,
  query: FarmerMilestoneAssignmentsQuery = {},
) {
  return useQuery({
    queryKey: queryKeys.farmerMilestone.assignments(milestoneId, query),
    queryFn: () => farmerMilestoneApi.assignments(milestoneId, query),
    enabled: !!milestoneId,
  })
}

/**
 * Load assignments for ALL current+upcoming milestones, then expose a lookup
 * Map<deviceId, { assignmentId, milestoneId }> for navigating from an alert
 * (which only carries deviceId) into the assignment detail screen.
 */
export function useDeviceAssignmentMap() {
  const { data: milestones } = useFarmerCurrentUpcomingMilestones()

  const queries = useQueries({
    queries: (milestones ?? []).map((m) => ({
      queryKey: queryKeys.farmerMilestone.assignments(m.id, { page: 1, limit: 50 }),
      queryFn: () => farmerMilestoneApi.assignments(m.id, { page: 1, limit: 50 }),
      enabled: !!m.id,
    })),
  })

  return useMemo(() => {
    const map = new Map<string, { assignmentId: string; milestoneId: string }>()
    queries.forEach((q, idx) => {
      const milestoneId = milestones?.[idx]?.id
      if (!milestoneId || !q.data) return
      for (const a of q.data.data) {
        if (a.device.iotDeviceId) {
          map.set(a.device.iotDeviceId, { assignmentId: a.assignmentId, milestoneId })
        }
      }
    })
    return map
  }, [queries, milestones])
}
