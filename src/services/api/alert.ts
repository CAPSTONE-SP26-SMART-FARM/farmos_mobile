import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'
import type { ListAlertsRes } from '@/types/alert'

export const alertApi = {
  list: (page = 1, limit = 20) =>
    apiClient
      .get<ApiResponse<ListAlertsRes>>('/alerts', { params: { page, limit } })
      .then((r) => r.data.data),
}
