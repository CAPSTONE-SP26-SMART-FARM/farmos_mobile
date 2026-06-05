import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { socketService } from '@/services/socket/socketService'
import { queryKeys } from '@/constants/queryKeys'

/**
 * Doctor-side global realtime — mount ở root layout (sibling của
 * `useGlobalIncidentRealtime`) để mọi event "broadcast pool" có thể fire bất
 * kể doctor đang ở tab nào.
 *
 * Nếu chỉ subscribe ở `(tabs)/incidents.tsx`, listener chỉ tồn tại sau khi
 * doctor đã mở tab "Yêu cầu mới" 1 lần (Expo Router tabs lazy-mount).
 *
 * Audience BE: room `doctors:pool` (auto-join theo online status, không cần
 * mobile emit gì).
 */
export function useGlobalDoctorRealtime() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const isDoctor = user?.role === 'doctor'

  useEffect(() => {
    if (!isDoctor) return

    const invalidatePool = () => {
      qc.invalidateQueries({ queryKey: queryKeys.broadcast.pending })
      qc.invalidateQueries({ queryKey: queryKeys.incident.doctorList() })
    }

    // Cross-user event (farmer tạo sự cố mới) — BE đã gửi `notification.created`
    // tới doctor pool → banner tự render qua NotificationBanner. KHÔNG showToast
    // để tránh duplicate (xem policy `useToast.ts`).
    const onBroadcast = () => {
      invalidatePool()
    }

    const onIncidentCreated = () => {
      qc.invalidateQueries({ queryKey: queryKeys.incident.doctorList() })
    }

    // Khi ticket rời pool — invalidate cả list lẫn detail cache cho ticketId
    // (để screen detail của doctor refetch). Logic toast + back được handle
    // ở `useDoctorTicketRemoved` (per-screen, dùng ref-based ticketId tránh
    // race re-mount).
    const onBroadcastRemoved = (payload: { ticketId?: string }) => {
      invalidatePool()
      if (payload?.ticketId) {
        qc.invalidateQueries({ queryKey: queryKeys.incident.detail(payload.ticketId) })
        qc.invalidateQueries({ queryKey: queryKeys.incident.doctorDetail(payload.ticketId) })
      }
    }

    socketService.on('ticket.broadcast', onBroadcast)
    socketService.on('ticket.incident.created', onIncidentCreated)
    socketService.on('ticket.broadcast.removed', onBroadcastRemoved)
    return () => {
      socketService.off('ticket.broadcast', onBroadcast)
      socketService.off('ticket.incident.created', onIncidentCreated)
      socketService.off('ticket.broadcast.removed', onBroadcastRemoved)
    }
  }, [isDoctor, qc])
}
