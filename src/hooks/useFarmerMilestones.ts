import { useQuery } from '@tanstack/react-query'
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
