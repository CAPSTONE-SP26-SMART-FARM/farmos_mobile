import { apiClient } from './client'
import type { DoctorBroadcastsRes } from '@/types/broadcast'

export const broadcastApi = {
  listPending: () =>
    apiClient
      .get<{ data: DoctorBroadcastsRes }>('/doctor/me/broadcasts?status=PENDING')
      .then((r) => r.data.data.data),
}
