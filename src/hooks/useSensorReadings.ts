import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { sensorReadingApi } from '@/services/api/sensorReading'
import { socketService } from '@/services/socket/socketService'

type SocketPayload = {
  assignmentId: string
  zoneId: string
  milestoneId: string
}

export function useSensorReadings(assignmentId: string) {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.sensorReading.latestByAssignment(assignmentId),
    queryFn: () => sensorReadingApi.getLatestByAssignment(assignmentId),
    enabled: !!assignmentId,
    staleTime: 0,
    refetchInterval: 10_000,
  })

  // Subscribe to zone for real-time updates once data is available
  useEffect(() => {
    const zoneId = query.data?.zoneId
    if (!zoneId || !socketService.isConnected) return
    socketService.subscribeZone(zoneId)
  }, [query.data?.zoneId])

  // Invalidate on socket event for immediate update
  useEffect(() => {
    if (!assignmentId) return

    const handler = (payload: SocketPayload) => {
      if (payload.assignmentId !== assignmentId) return
      qc.invalidateQueries({
        queryKey: queryKeys.sensorReading.latestByAssignment(assignmentId),
      })
    }

    socketService.on<SocketPayload>('sensor.reading.changed', handler)
    return () => {
      socketService.off<SocketPayload>('sensor.reading.changed', handler)
    }
  }, [assignmentId, qc])

  return query
}
