import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { alertApi } from '@/services/api/alert'
import { socketService } from '@/services/socket/socketService'

export function useAlertList(page = 1) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const refresh = () => {
      queryClient.refetchQueries({ queryKey: ['alerts', 'list'] })
    }

    socketService.on('alert.created', refresh)
    socketService.on('sensor.alert.recovered', refresh)
    return () => {
      socketService.off('alert.created', refresh)
      socketService.off('sensor.alert.recovered', refresh)
    }
  }, [queryClient])

  return useQuery({
    queryKey: queryKeys.alerts.list(page),
    queryFn: () => alertApi.list(page),
  })
}
