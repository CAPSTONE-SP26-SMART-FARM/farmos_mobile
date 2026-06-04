import { IS_DEV } from '@/constants/config'
import { queryKeys } from '@/constants/queryKeys'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { socketService } from '@/services/socket/socketService'
import { useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useEffect, useRef } from 'react'

type BroadcastRemovedReason =
  | 'CANCELLED'
  | 'ACCEPTED'
  | 'AI_PROCESSING'
  | 'AI_RESOLVED'
  | 'REFUNDED'
  | 'AUTO_REFUNDED'

interface Payload {
  ticketId: string
  reason: BroadcastRemovedReason
  acceptedBy?: string
}

const REASON_MESSAGES: Record<BroadcastRemovedReason, string> = {
  CANCELLED: 'Yêu cầu đã được huỷ bởi người tạo',
  ACCEPTED: 'Yêu cầu đã được bác sĩ khác tiếp nhận',
  AI_PROCESSING: 'Yêu cầu đã chuyển sang AI xử lý',
  AI_RESOLVED: 'Yêu cầu đã được AI giải quyết',
  REFUNDED: 'Yêu cầu đã được hoàn lại cho farmer',
  AUTO_REFUNDED: 'Yêu cầu đã được hoàn lại tự động',
}

/**
 * Doctor đang xem ticket detail (broadcast pending) → subscribe
 * `ticket.broadcast.removed`. Khi event match ticketId đang xem → toast theo
 * reason + back về list. Chỉ gọi ở detail screen (sau khi accept ticket rời
 * pool nên BE không emit event này nữa cho sub-screens).
 *
 * Implementation note: subscribe 1 lần khi role=doctor, dùng REF cho ticketId
 * / showToast / qc thay vì để chúng vào dep của useEffect. Tránh race:
 * nếu effect re-run mỗi khi ticketId / showToast đổi, có window ngắn giữa
 * cleanup `off()` và `on()` mới; event BE đến đúng lúc đó bị miss.
 */
export function useDoctorTicketRemoved(ticketId: string | undefined) {
  const { showToast } = useToast()
  const qc = useQueryClient()
  const { user } = useAuth()
  const isDoctor = user?.role === 'doctor'

  // Refs để handler luôn đọc giá trị mới nhất mà không cần re-subscribe.
  const ticketIdRef = useRef(ticketId)
  ticketIdRef.current = ticketId
  const showToastRef = useRef(showToast)
  showToastRef.current = showToast
  const qcRef = useRef(qc)
  qcRef.current = qc

  useEffect(() => {
    if (!isDoctor) return

    const handler = (payload: Payload) => {
      const currentTicketId = ticketIdRef.current
      if (IS_DEV) {
        console.log(
          '[useDoctorTicketRemoved] event received',
          payload,
          'currentTicketId=',
          currentTicketId,
          'match=',
          payload?.ticketId === currentTicketId,
        )
      }
      if (!currentTicketId || payload?.ticketId !== currentTicketId) return

      qcRef.current.invalidateQueries({ queryKey: queryKeys.broadcast.pending })
      qcRef.current.invalidateQueries({ queryKey: queryKeys.incident.detail(currentTicketId) })
      qcRef.current.invalidateQueries({ queryKey: queryKeys.incident.doctorDetail(currentTicketId) })
      qcRef.current.invalidateQueries({ queryKey: queryKeys.incident.doctorList() })

      showToastRef.current.error({
        message: REASON_MESSAGES[payload.reason] ?? 'Yêu cầu đã không còn khả dụng',
      })
      if (router.canGoBack()) router.back()
      else router.replace('/(app)/(tabs)/incidents')
    }

    if (IS_DEV) console.log('[useDoctorTicketRemoved] subscribing (role=doctor)')
    socketService.on('ticket.broadcast.removed', handler)
    return () => {
      if (IS_DEV) console.log('[useDoctorTicketRemoved] unsubscribing')
      socketService.off('ticket.broadcast.removed', handler)
    }
  }, [isDoctor])
}
