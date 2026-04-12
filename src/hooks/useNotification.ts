import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '@/services/api/notification'
import { queryKeys } from '@/constants/queryKeys'

export function useNotifications(page = 1) {
  return useQuery({
    queryKey: queryKeys.notifications.list(page),
    queryFn: () => notificationApi.list(page),
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id, { isRead: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
