import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { broadcastApi } from '@/services/api/broadcast'

export function usePendingBroadcasts(enabled = true) {
  return useQuery({
    queryKey: queryKeys.broadcast.pending,
    queryFn: () => broadcastApi.listPending(),
    enabled,
  })
}
