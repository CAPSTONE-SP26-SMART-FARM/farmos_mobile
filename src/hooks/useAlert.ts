import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { alertApi } from '@/services/api/alert'
import { socketService } from '@/services/socket/socketService'
import type { Alert } from '@/types/alert'

export function useAlertList(page = 1) {
  const queryClient = useQueryClient()

  useEffect(() => {
    function onAlertCreated(_alert: Alert) {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.list() })
    }

    socketService.on('alert.created', onAlertCreated)
    return () => {
      socketService.off('alert.created', onAlertCreated)
    }
  }, [queryClient])

  return useQuery({
    queryKey: queryKeys.alerts.list(page),
    queryFn: () => alertApi.list(page),
  })
}
