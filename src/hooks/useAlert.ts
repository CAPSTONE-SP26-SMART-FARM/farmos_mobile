import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { alertApi } from '@/services/api/alert'
import { socketService } from '@/services/socket/socketService'

export function useAlertList(page = 1) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.alerts.list(page),
    queryFn: () => alertApi.list(page),
  })

  useEffect(() => {
    const refresh = () => {
      queryClient.refetchQueries({ queryKey: ['alerts', 'list'] })
    }

    // Lắng cả 2 event (alert mới + alert đã resolve)
    socketService.on('alert.created', refresh)
    socketService.on('sensor.alert.recovered', refresh)
    // Cũng lắng notification.created như NotificationBanner — fallback khi BE emit
    // alert qua notification room (per-user) mà không phải farm/zone room.
    socketService.on('notification.created', refresh)

    return () => {
      socketService.off('alert.created', refresh)
      socketService.off('sensor.alert.recovered', refresh)
      socketService.off('notification.created', refresh)
    }
  }, [queryClient])

  // Subscribe room farm/zone của các alert hiện có để nhận realtime
  // (BE emit alert.created vào roomFarm + roomZone, không phải roomUser).
  useEffect(() => {
    const alerts = query.data?.data ?? []
    if (alerts.length === 0) return

    const farmIds = new Set<string>()
    const zoneIds = new Set<string>()
    for (const a of alerts) {
      if (a.farmId) farmIds.add(a.farmId)
      if (a.zoneId) zoneIds.add(a.zoneId)
    }
    for (const fId of farmIds) socketService.subscribeFarm(fId)
    for (const zId of zoneIds) socketService.subscribeZone(zId)
  }, [query.data])

  return query
}
