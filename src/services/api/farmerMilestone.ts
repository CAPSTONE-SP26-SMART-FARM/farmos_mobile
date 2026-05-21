import { apiClient } from './client'
import type {
  FarmerCurrentUpcomingMilestone,
  FarmerMilestoneAssignmentsQuery,
  FarmerMilestoneAssignmentsRes,
} from '@/types/farmerIot'

export const farmerMilestoneApi = {
  currentUpcoming: () =>
    apiClient
      .get<{ data: { data: FarmerCurrentUpcomingMilestone[] } }>(
        '/production-milestone/farmer/current-upcoming-milestones',
      )
      .then((r) => r.data.data.data),

  assignments: (milestoneId: string, query: FarmerMilestoneAssignmentsQuery = {}) =>
    apiClient
      .get<{ data: FarmerMilestoneAssignmentsRes }>(
        `/production-milestone/farmer/milestones/${milestoneId}/assignments`,
        { params: query },
      )
      .then((r) => r.data.data),
}
