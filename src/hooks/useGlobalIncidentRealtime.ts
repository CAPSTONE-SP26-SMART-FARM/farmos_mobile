import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { useConfirm } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'
import { useActiveTicketStore } from '@/stores/activeTicketStore'
import { useAiProcessingStore } from '@/stores/aiProcessingStore'
import { socketService } from '@/services/socket/socketService'
import { ticketLifecycleApi } from '@/services/api/ticketLifecycle'
import { queryKeys } from '@/constants/queryKeys'
import { getErrorMessage } from '@/utils/error'

type FallbackPayload = { ticketId: string; title?: string }
type AutoRefundedPayload = { ticketId: string; reason?: string }

/**
 * Owner-side realtime cho fallback / auto-refund.
 *
 * Mount ở root layout (sibling của NotificationBanner) — đảm bảo popup
 * `ticket.ai.fallback.offered` luôn hiện kể cả khi user chưa từng mở tab Incidents
 * (Expo Router tabs là lazy-mount, screen tab chưa mount = listener chưa bind).
 *
 * Khi user đang ở detail của chính ticket đó → skip popup để detail tự handle
 * qua /full pendingFallbackChoice (tránh popup đúp).
 */
export function useGlobalIncidentRealtime() {
  const { user } = useAuth()
  const router = useRouter()
  const qc = useQueryClient()
  const confirm = useConfirm()
  const { showToast } = useToast()

  const isOwner = !!user && user.role !== 'doctor'

  useEffect(() => {
    if (!isOwner) return

    const invalidateForTicket = (ticketId: string) => {
      qc.invalidateQueries({ queryKey: queryKeys.incident.list() })
      qc.invalidateQueries({ queryKey: queryKeys.incident.detail(ticketId) })
      qc.invalidateQueries({ queryKey: queryKeys.ticketFull(ticketId) })
    }

    const fallbackDialogTag = (ticketId: string) => `fallback:${ticketId}`

    const onFallbackOffer = async (payload: FallbackPayload) => {
      invalidateForTicket(payload.ticketId)
      // Detail screen tự handle dialog của chính nó qua pendingFallbackChoice useEffect.
      if (useActiveTicketStore.getState().activeTicketId === payload.ticketId) return

      const choice = await confirm.show({
        title: 'Chưa có bác sĩ tiếp nhận',
        message: `Sự cố${payload.title ? ` "${payload.title}"` : ''} vẫn chưa có bác sĩ nào tiếp nhận. Bạn muốn xử lý thế nào?`,
        icon: 'question',
        cancelable: false,
        tag: fallbackDialogTag(payload.ticketId),
        actions: [
          {
            key: 'FALLBACK_AI',
            label: 'Dùng AI xử lý',
            description: 'AI sẽ phân tích và đưa ra giải pháp ngay lập tức.',
            variant: 'primary',
          },
          {
            key: 'REFUND_TICKET',
            label: 'Hoàn lại sự cố',
            description: 'Huỷ sự cố và hoàn lại quota cho bạn.',
            variant: 'destructive',
          },
        ],
      })
      // choice === null khi device khác đã chọn xong → confirm.dismiss được gọi
      // bởi handler `onFallbackResolved` bên dưới.
      if (choice !== 'FALLBACK_AI' && choice !== 'REFUND_TICKET') return

      if (choice === 'FALLBACK_AI') {
        useAiProcessingStore.getState().start(payload.ticketId)
        router.push(`/(app)/incident/${payload.ticketId}`)
      }
      const successMsg = choice === 'FALLBACK_AI' ? 'AI đang xử lý sự cố…' : 'Đã hoàn lại sự cố'
      try {
        await ticketLifecycleApi.abandon(payload.ticketId, { resolution: choice })
        invalidateForTicket(payload.ticketId)
        qc.invalidateQueries({ queryKey: queryKeys.ticketBalance })
        showToast.success({ message: successMsg })
      } catch (e) {
        if (choice === 'FALLBACK_AI') {
          useAiProcessingStore.getState().stop(payload.ticketId)
        }
        showToast.error({ message: getErrorMessage(e, 'Có lỗi xảy ra, vui lòng thử lại') })
      }
    }

    const onAutoRefunded = (payload: AutoRefundedPayload) => {
      useAiProcessingStore.getState().stop(payload.ticketId)
      invalidateForTicket(payload.ticketId)
      qc.invalidateQueries({ queryKey: queryKeys.ticketBalance })
      // Auto-refund cũng đồng nghĩa pending fallback dialog đã không còn relevant.
      confirm.dismiss(fallbackDialogTag(payload.ticketId))
      // KHÔNG showToast — system event đã được BE gửi notification.created
      // tới owner, render qua NotificationBanner (xem policy `useToast.ts`).
    }

    // Multi-device sync: device khác (cùng tài khoản farmer) chọn xong fallback
    // → BE emit `ticket.fallback.resolved` ngay sau khi abandon API commit
    // (trước cả khi AI worker chạy). Device này dismiss popup đang hang.
    // Payload BE: `{ ticketId, resolution: 'FALLBACK_AI' | 'REFUND_TICKET' }`.
    const onFallbackResolved = (payload: { ticketId: string }) => {
      invalidateForTicket(payload.ticketId)
      confirm.dismiss(fallbackDialogTag(payload.ticketId))
    }

    socketService.on('ticket.ai.fallback.offered', onFallbackOffer)
    socketService.on('ticket.fallback-required', onFallbackOffer)
    socketService.on('ticket.abandon.auto_refunded', onAutoRefunded)
    socketService.on('ticket.fallback.resolved', onFallbackResolved)
    return () => {
      socketService.off('ticket.ai.fallback.offered', onFallbackOffer)
      socketService.off('ticket.fallback-required', onFallbackOffer)
      socketService.off('ticket.abandon.auto_refunded', onAutoRefunded)
      socketService.off('ticket.fallback.resolved', onFallbackResolved)
    }
  }, [isOwner, confirm, showToast, qc, router])
}
