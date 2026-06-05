import { apiClient } from './client'
import type { ListNotificationsRes, MarkNotificationReadBody, Notification } from '@/types/notification'

/** BE shape (round 5 confirmed): field tên `unreadCount`, KHÔNG phải `count`. */
export type UnreadCountRes = { unreadCount: number }

export const notificationApi = {
  list: (page = 1, limit = 30) =>
    apiClient
      .get<{ data: ListNotificationsRes }>(`/notifications?page=${page}&limit=${limit}`)
      .then((r) => r.data.data),

  /**
   * Đếm chính xác notification chưa đọc của user hiện tại (global, không phụ
   * thuộc pagination). BE response: `data.unreadCount: number`.
   */
  unreadCount: () =>
    apiClient
      .get<{ data: UnreadCountRes }>('/notifications/unread-count')
      .then((r) => r.data.data),

  markRead: (id: string, body: MarkNotificationReadBody) =>
    apiClient
      .patch<{ data: Notification }, MarkNotificationReadBody>(`/notifications/${id}/read`, body)
      .then((r) => r.data.data),
}
