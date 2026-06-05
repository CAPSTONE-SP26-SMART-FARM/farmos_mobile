import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '@/services/api/notification'
import { queryKeys } from '@/constants/queryKeys'
import { socketService } from '@/services/socket/socketService'

export function useNotifications(page = 1) {
  return useQuery({
    queryKey: queryKeys.notifications.list(page),
    queryFn: () => notificationApi.list(page),
  })
}

/**
 * Số notification chưa đọc (global, không phụ thuộc pagination). Dùng cho:
 * - Badge đỏ trên bell icon ở home / topbar.
 * - Count trong tiêu đề màn Notifications.
 *
 * Tự động refresh khi:
 *   - `notification.created` socket event tới (notification mới → count +1).
 *   - User `markRead` 1 notification (broad invalidate `['notifications']`).
 */
export function useUnreadNotificationCount() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationApi.unreadCount(),
    staleTime: 30_000,
  })

  useEffect(() => {
    const onCreated = () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() })
    }
    socketService.on('notification.created', onCreated)
    return () => socketService.off('notification.created', onCreated)
  }, [qc])

  return query
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id, { isRead: true }),
    onSuccess: () => {
      // Broad invalidate cover cả list keys + unread-count key (đều bắt đầu
      // bằng 'notifications').
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
