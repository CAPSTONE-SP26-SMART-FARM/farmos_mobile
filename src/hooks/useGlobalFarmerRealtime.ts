import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { socketService } from '@/services/socket/socketService'
import type { EmployeeTaskUpdatedPayload } from '@/types/employeeTask'

/**
 * Farmer-side global realtime — mount ở root layout (sibling của
 * `useGlobalIncidentRealtime`) để `employee-task.updated` luôn refresh cache
 * dù farmer đang ở tab nào (Expo Router tabs lazy-mount).
 *
 * Audience BE: room `user:{farmerId}` (auto-join theo JWT khi connect, không
 * cần mobile emit subscribe).
 *
 * Action: invalidate broad cache. KHÔNG showToast — BE đã gửi
 * `notification.created` đi kèm → render qua `NotificationBanner`
 * (xem policy `useToast.ts`).
 */
export function useGlobalFarmerRealtime() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const isFarmSideUser = user?.role === 'farmer' || user?.role === 'rancher'

  useEffect(() => {
    if (!isFarmSideUser) return

    const onTaskUpdated = (_payload: EmployeeTaskUpdatedPayload) => {
      // Payload không có taskId — invalidate broad cả 2 namespace.
      // - `daily-log` cover list today + my-logs + window snapshot.
      // - `farmer-milestone` cover progress milestone (đổi khi assigned/completed).
      qc.invalidateQueries({ queryKey: ['daily-log'] })
      qc.invalidateQueries({ queryKey: ['farmer-milestone'] })
    }

    socketService.on('employee-task.updated', onTaskUpdated)
    return () => socketService.off('employee-task.updated', onTaskUpdated)
  }, [isFarmSideUser, qc])
}
