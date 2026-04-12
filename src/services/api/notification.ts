import { apiClient } from './client'
import type { ListNotificationsRes, MarkNotificationReadBody, Notification } from '@/types/notification'

export const notificationApi = {
  list: (page = 1, limit = 30) =>
    apiClient
      .get<{ data: ListNotificationsRes }>(`/notifications?page=${page}&limit=${limit}`)
      .then((r) => r.data.data),

  markRead: (id: string, body: MarkNotificationReadBody) =>
    apiClient
      .patch<{ data: Notification }, MarkNotificationReadBody>(`/notifications/${id}/read`, body)
      .then((r) => r.data.data),
}
