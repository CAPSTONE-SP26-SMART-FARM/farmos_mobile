import {
  View, ScrollView, ActivityIndicator, StyleSheet, RefreshControl,
  Image, TouchableOpacity, Modal, Pressable,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Text, EmptyState, TopBar, BottomSheet, PrimaryButton, TextField, useConfirm } from '@/components/ui'
import { usePrescriptions, useCreatePrescription } from '@/hooks/usePrescription'
import { useAcceptIncident, useDoctorIncidentDetail } from '@/hooks/useDoctor'
import { useIncidentDetail, useCancelIncident, useDeleteIncident } from '@/hooks/useIncident'
import { useCloseTicket, useRateTicket, useAbandonResolution, useTicketFull } from '@/hooks/useTicketLifecycle'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useDoctorTicketRemoved } from '@/hooks/useDoctorTicketRemoved'
import { socketService } from '@/services/socket/socketService'
import { useActiveTicketStore } from '@/stores/activeTicketStore'
import { queryKeys } from '@/constants/queryKeys'
import { PrescriptionModal } from '@/components/features/incident/PrescriptionModal'
import { PrescriptionSection } from '@/components/features/incident/PrescriptionSection'
import { AiSolutionSection } from '@/components/features/incident/AiSolutionSection'
import { IncidentInfoList } from '@/components/features/incident/IncidentInfoList'
import { IncidentFooterActions } from '@/components/features/incident/IncidentFooterActions'
import { CloseRateModal } from '@/components/features/incident/CloseRateModal'
import { AiProcessingBanner } from '@/components/features/incident/AiProcessingBanner'
import { AddendaSection } from '@/components/features/incident/AddendaSection'
import { useAiProcessingStore } from '@/stores/aiProcessingStore'
import { useAddAddendum } from '@/hooks/useTicketLifecycle'
import { extractApiError, getErrorMessage } from '@/utils/error'
import type { CreatePrescriptionBody } from '@/types/prescription'
import type { AbandonResolution } from '@/types/ticketLifecycle'

const CLOSED_STATUSES = ['closed', 'cancelled'] as const
const PRESCRIBABLE_STATUSES = ['assigned', 'in_progress'] as const

const INACTIVITY_LIMIT_MS: Record<string, number> = {
  // Sau khi tách severity (issue 5) — 2 mức:
  urgent: 60 * 60 * 1000,
  normal: 30 * 60 * 1000,
}

function formatCountdown(ms: number) {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}


export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const confirm = useConfirm()
  const qc = useQueryClient()
  const isDoctor = user?.role === 'doctor'

  const [rxModalVisible, setRxModalVisible] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [closeModalVisible, setCloseModalVisible] = useState(false)
  const [addendumVisible, setAddendumVisible] = useState(false)
  const [addendumContent, setAddendumContent] = useState('')
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [showSlaInfo, setShowSlaInfo] = useState(false)

  // Doctor: nếu ticket đang xem bị gỡ khỏi pool (CANCELLED bởi farmer / ACCEPTED
  // bởi BS khác / AI_PROCESSING / AI_RESOLVED / REFUNDED / AUTO_REFUNDED) →
  // toast theo reason + back về list. Subscribe `ticket.broadcast.removed`.
  useDoctorTicketRemoved(id)

  const { mutate: cancelIncident, isPending: isCancelling } = useCancelIncident()
  const { mutate: deleteIncident, isPending: isDeleting } = useDeleteIncident()
  const { mutate: closeTicket, isPending: isClosing } = useCloseTicket(id)
  const { mutate: rateTicket, isPending: isRating } = useRateTicket(id)
  const { mutate: abandonResolution } = useAbandonResolution(id)
  const { mutate: addAddendum, isPending: isAddingAddendum } = useAddAddendum(id)

  // Chỉ chạy 1 query theo role — tránh duplicate API call (cả 2 đều gọi /tickets/:id v2)
  const farmerQuery = useIncidentDetail(isDoctor ? '' : id)
  const doctorQuery = useDoctorIncidentDetail(isDoctor ? id : '')
  const { data, isLoading, isError, refetch } = isDoctor ? doctorQuery : farmerQuery

  // Cả farmer + doctor: /full trả về solution, addenda, prescription… cần
  // cho mọi role. Riêng `pendingFallbackChoice` chỉ farmer dùng (xem useEffect
  // bên dưới đã gate `!isDoctor`).
  const ticketFullQuery = useTicketFull(id)

  // Mở dialog "Bác sĩ chưa phản hồi" qua ConfirmDialog global.
  // Dùng ref guard để tránh re-show liên tục khi pendingFallbackChoice vẫn true sau dismiss.
  const abandonShownForRef = useRef<string | null>(null)
  const openAbandonChoice = useCallback(async () => {
    if (abandonShownForRef.current === id) return
    abandonShownForRef.current = id
    const choice = await confirm.show({
      title: 'Bác sĩ chưa phản hồi',
      message: 'Bác sĩ đã tiếp nhận sự cố nhưng không phản hồi. Bạn muốn xử lý thế nào?',
      icon: 'warning',
      cancelable: false,
      // Cho phép socket listener (useGlobalIncidentRealtime) dismiss dialog
      // này khi device khác cùng tài khoản đã chọn xong (multi-device sync).
      tag: `fallback:${id}`,
      actions: [
        {
          key: 'FALLBACK_AI',
          label: 'Chuyển sang AI',
          description: 'AI sẽ phân tích và đưa ra giải pháp thay thế.',
          variant: 'primary',
        },
        {
          key: 'REFUND_TICKET',
          label: 'Hoàn sự cố',
          description: 'Sự cố bị huỷ, quota được hoàn lại cho bạn.',
          variant: 'destructive',
        },
      ],
    })
    if (choice === 'FALLBACK_AI' || choice === 'REFUND_TICKET') {
      handleAbandon(choice as AbandonResolution)
    }
  }, [confirm, id])

  useEffect(() => {
    if (!isDoctor && ticketFullQuery.data?.pendingFallbackChoice) {
      openAbandonChoice()
    }
  }, [isDoctor, ticketFullQuery.data?.pendingFallbackChoice, openAbandonChoice])

  const isAiProcessing = useAiProcessingStore((s) => !!s.pending[id])
  // Safety net: nếu data refresh mà thấy solution.source === 'AI' → clear flag
  // (phòng trường hợp socket ai.resolved miss).
  useEffect(() => {
    if (ticketFullQuery.data?.solution?.source === 'AI') {
      useAiProcessingStore.getState().stop(id)
    }
  }, [id, ticketFullQuery.data?.solution?.source])

  const { data: rxData, isLoading: rxLoading, refetch: refetchRx } = usePrescriptions(id)
  const { mutate: acceptIncident, isPending: isAccepting } = useAcceptIncident()
  const { mutate: createPrescription, isPending: isCreatingRx } = useCreatePrescription(id)
  const prescriptions = rxData?.data ?? []

  const refreshAll = useCallback(() => { refetch(); refetchRx() }, [refetch, refetchRx])
  useFocusEffect(refreshAll)

  // Tell the list-screen socket listener which ticket we're currently viewing,
  // so it can skip showing a duplicate native Alert for this same ticket.
  const setActiveTicketId = useActiveTicketStore((s) => s.setActiveTicketId)
  useFocusEffect(
    useCallback(() => {
      setActiveTicketId(id)
      return () => setActiveTicketId(null)
    }, [id, setActiveTicketId])
  )

  const [isRefreshing, setIsRefreshing] = useState(false)
  const handlePullRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try { await Promise.all([refetch(), refetchRx()]) } finally { setIsRefreshing(false) }
  }, [refetch, refetchRx])

  // Subscribe ticket room NGAY khi mount (URL param, không chờ data.id) — tránh
  // race window. Sau BE Round 3 R7, status events đã emit cả tới `user:{userId}`
  // → subscribe ticket room không còn bắt buộc cho stakeholder. Vẫn giữ để:
  //   - Defense-in-depth nếu BE forget audience trong event mới.
  //   - Nhận events chỉ emit tới ticket room (vd debug events / admin watcher).
  useEffect(() => {
    if (id) socketService.subscribeTicket(id)
  }, [id])

  useEffect(() => {
    // Mọi handler đều chỉ chạy cho ticket đang xem + invalidate cùng tập query.
    // Wrap bằng helper để tránh lặp `if (ticketId !== id) return` + invalidate boilerplate.
    const invalidateDetail = () => {
      qc.invalidateQueries({ queryKey: queryKeys.incident.detail(id) })
      qc.invalidateQueries({ queryKey: queryKeys.incident.doctorDetail(id) })
      qc.invalidateQueries({ queryKey: queryKeys.ticketFull(id) })
      qc.invalidateQueries({ queryKey: queryKeys.incident.list() })
      qc.invalidateQueries({ queryKey: queryKeys.incident.doctorList() })
    }
    const onlyThisTicket = (fn: () => void) => ({ ticketId }: { ticketId: string }) => {
      if (ticketId === id) fn()
    }

    // Cross-user / system events — BE đã gửi `notification.created` để render
    // banner top-of-screen + redirect_url. Mobile chỉ invalidate cache, KHÔNG
    // showToast để tránh duplicate (xem policy `useToast.ts`).
    const onResolved = onlyThisTicket(() => {
      invalidateDetail()
      qc.invalidateQueries({ queryKey: queryKeys.prescriptions.list(id) })
    })
    const onClosed = onlyThisTicket(invalidateDetail)
    const onAiResolved = onlyThisTicket(() => {
      useAiProcessingStore.getState().stop(id)
      invalidateDetail()
    })
    const onAbandonRefunded = onlyThisTicket(() => {
      invalidateDetail()
      qc.invalidateQueries({ queryKey: queryKeys.ticketBalance })
    })
    // Status transition events — đảm bảo badge / footer / actions update ngay
    // mà không cần user reload screen. Payload BE:
    //   - ticket.accepted: { ticketId, acceptedBy, assignedAt }
    //   - ticket.in_progress: { ticketId } (doctor gửi message đầu tiên — atomic)
    //   - ticket.cancelled: { ticketId, reason: string | null }
    const onAccepted = onlyThisTicket(invalidateDetail)
    const onInProgress = onlyThisTicket(invalidateDetail)
    const onCancelled = onlyThisTicket(invalidateDetail)
    // R3 — doctor add addendum, farmer đang xem detail nhận event này → /full
    // refetch + AddendaSection render ngay. Payload:
    //   { ticketId, addendumId, type, authorId }
    const onAddendumCreated = onlyThisTicket(() => {
      qc.invalidateQueries({ queryKey: queryKeys.ticketFull(id) })
    })
    // R5 — device A xoá ticket → device B (đang mở detail của ticket đó) phải
    // back ra list ngay (data không còn tồn tại). Audience: `user:{creatorId}`.
    const onDeleted = onlyThisTicket(() => {
      qc.invalidateQueries({ queryKey: queryKeys.incident.list() })
      qc.invalidateQueries({ queryKey: queryKeys.incident.detail(id) })
      if (router.canGoBack()) router.back()
      else router.replace('/(app)/(tabs)/incidents')
    })
    // BE Round 4 R9 — multi-device rate sync. Payload:
    //   { ticketId, stars, ratedBy, ratedAt }
    // Audience: user:{creatorId} + user:{assignedTo} + ticket:{ticketId}.
    const onRated = onlyThisTicket(() => {
      invalidateDetail()
      qc.invalidateQueries({ queryKey: queryKeys.ticketFull(id) })
    })

    // NOTE: `ticket.ai.fallback.offered`, `ticket.fallback-required`,
    // `ticket.abandon.auto_refunded` đăng ký ở root layout qua
    // `useGlobalIncidentRealtime` — listener đó tự invalidate detail/full key của
    // ticket này nên detail screen sẽ re-fetch và useEffect(pendingFallbackChoice)
    // mở dialog khi cần (cho cả live event + offline recovery).
    //
    // NOTE: `ticket.broadcast.removed` được handle bởi `useDoctorTicketRemoved`
    // (toast + back về list) — gọi ở đầu component.
    const listeners = [
      ['ticket.resolved', onResolved],
      ['ticket.closed', onClosed],
      ['ticket.ai.resolved', onAiResolved],
      ['ticket.abandon.refunded', onAbandonRefunded],
      // R2 — status transition (BE Option A: per-event explicit)
      ['ticket.accepted', onAccepted],
      ['ticket.in_progress', onInProgress],
      ['ticket.cancelled', onCancelled],
      // R3 — addendum realtime
      ['ticket.addendum.created', onAddendumCreated],
      // R5 — multi-device delete sync
      ['ticket.deleted', onDeleted],
      // Issue 2 — multi-device rate sync (BE round 4 cần emit)
      ['ticket.rated', onRated],
    ] as const

    listeners.forEach(([event, handler]) => socketService.on(event, handler))
    return () => listeners.forEach(([event, handler]) => socketService.off(event, handler))
  }, [id, qc, router])

  useEffect(() => {
    const isAssignee = isDoctor && data?.assignee?.id === user?.id
    const active = isAssignee && data?.assignedAt && PRESCRIBABLE_STATUSES.includes(data?.status as any)
    if (!active) { setTimeLeft(null); return }
    const limit = INACTIVITY_LIMIT_MS[data!.severity] ?? 30 * 60 * 1000
    const deadline = new Date(data!.assignedAt!).getTime() + limit
    const tick = () => setTimeLeft(Math.max(0, deadline - Date.now()))
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [isDoctor, user?.id, data?.assignee?.id, data?.assignedAt, data?.severity, data?.status])

  const status = data?.status ?? ''
  const isAssignee = isDoctor && data?.assignee?.id === user?.id
  const isCreator = !isDoctor && data?.creator?.id === user?.id
  const canAccept = isDoctor && status === 'open' && !data?.assignee
  const isClosed = CLOSED_STATUSES.includes(status as any)
  const canCancel = isCreator && status === 'open'
  // Defensive multi-device guard (issue 2): nếu /full.rating !== null
  // (device khác đã rate) → ẩn nút close+rate.
  // BE round 4: `ticket.closed`/`ticket.rated` đã emit realtime với stakeholder
  // audience → listener invalidate cache nhanh. Guard này vẫn cần làm UX-first
  // (hide button trước khi user click), cộng với polling 30s defense-in-depth.
  const alreadyRated = !!ticketFullQuery.data?.rating
  const canClose = isCreator && status === 'resolved' && !alreadyRated
  const canResolve = isAssignee && PRESCRIBABLE_STATUSES.includes(status as any)
  const canAddAddendum = isAssignee && (status === 'resolved' || status === 'closed')
  // Chỉ creator + status='cancelled' mới được xoá (BE cũng enforce, đây là UI gate).
  const canDelete = isCreator && status === 'cancelled'

  const handleAddAddendum = () => {
    if (!addendumContent.trim()) return
    addAddendum(
      { type: 'SOLUTION_NOTE', content: addendumContent.trim() },
      {
        onSuccess: () => {
          showToast.success({ message: 'Đã thêm ghi chú' })
          setAddendumVisible(false)
          setAddendumContent('')
        },
        onError: (err) => showToast.error({ message: getErrorMessage(err, 'Thêm ghi chú thất bại') }),
      }
    )
  }

  const handleCancel = () => {
    cancelIncident(
      { ticketId: id },
      {
        onSuccess: () => { showToast.success({ message: 'Đã hủy sự cố' }); router.back() },
        onError: (err) => showToast.error({ message: getErrorMessage(err, 'Hủy thất bại') }),
      }
    )
  }

  const handleDelete = async () => {
    const choice = await confirm.show({
      title: 'Xoá sự cố',
      message: 'Xoá vĩnh viễn sự cố này khỏi danh sách? Hành động không thể hoàn tác.',
      icon: 'warning',
      actions: [
        { key: 'DELETE', label: 'Xoá', variant: 'destructive' },
        { key: 'CANCEL', label: 'Huỷ', variant: 'cancel' },
      ],
    })
    if (choice !== 'DELETE') return
    deleteIncident(id, {
      onSuccess: () => { showToast.success({ message: 'Đã xoá sự cố' }); router.back() },
      onError: (err) => showToast.error({ message: getErrorMessage(err, 'Xoá thất bại') }),
    })
  }

  const handleCloseSubmit = (stars: number, feedback: string) => {
    // UX-first defensive (issue 2): nếu cache local đã thấy device khác close /
    // rate → đóng modal + báo, KHÔNG gửi mutation (tiết kiệm round-trip + tránh
    // BE 422/409 noise). BE-side guard (round 4 R10) là last-line nếu cache
    // chưa kịp sync.
    if (alreadyRated || status === 'closed') {
      setCloseModalVisible(false)
      showToast.info({ message: 'Sự cố đã được đóng ở thiết bị khác' })
      refetch()
      ticketFullQuery.refetch()
      return
    }
    closeTicket(undefined, {
      onSuccess: () => {
        if (stars > 0) {
          rateTicket(
            { stars, feedback: feedback || undefined },
            {
              onSuccess: () => {
                showToast.success({ message: 'Đã đóng và đánh giá sự cố' })
                setCloseModalVisible(false)
              },
              onError: (err) => {
                // BE round 4 R10: rate trả 409 `TicketRatingAlreadyExists` nếu
                // device khác đã rate. Lúc đó close thành công nhưng rate fail
                // — show context cụ thể thay vì silent "đã đóng sự cố".
                const ex = extractApiError(err)
                if (ex.statusCode === 409) {
                  showToast.info({
                    message: ex.message ?? 'Đã có đánh giá cho yêu cầu hỗ trợ này.',
                  })
                } else {
                  showToast.success({ message: 'Đã đóng sự cố' })
                }
                setCloseModalVisible(false)
                ticketFullQuery.refetch()
              },
            }
          )
        } else {
          showToast.success({ message: 'Đã đóng sự cố' })
          setCloseModalVisible(false)
        }
      },
      onError: (err) => {
        // BE round 4 R10: close trả 422 `TicketCloseState` nếu status không
        // còn 'resolved' (device khác đã đóng). Convert sang toast info friendly
        // + refetch để UI sync.
        const ex = extractApiError(err)
        if (ex.statusCode === 422) {
          setCloseModalVisible(false)
          showToast.info({
            message: ex.message ?? 'Sự cố đã được đóng ở thiết bị khác.',
          })
          refetch()
          ticketFullQuery.refetch()
          return
        }
        showToast.error({ message: getErrorMessage(err, 'Đóng sự cố thất bại') })
      },
    })
  }

  const handleAbandon = (resolution: AbandonResolution) => {
    // Với FALLBACK_AI: bật flag ngay để UI render banner "AI đang phân tích".
    // Mutation chạy nền; nếu fail → rollback flag.
    if (resolution === 'FALLBACK_AI') {
      useAiProcessingStore.getState().start(id)
    }
    abandonResolution(
      { resolution },
      {
        onSuccess: () => {
          showToast.success({
            message: resolution === 'FALLBACK_AI' ? 'Đã chuyển sang AI xử lý' : 'Đã hoàn sự cố',
          })
        },
        onError: (err) => {
          if (resolution === 'FALLBACK_AI') useAiProcessingStore.getState().stop(id)
          showToast.error({ message: getErrorMessage(err, 'Thao tác thất bại') })
        },
      }
    )
  }

  const handleAcceptIncident = () => {
    acceptIncident(id, {
      onSuccess: () => { showToast.success({ message: 'Tiếp nhận sự cố thành công!' }); refetch() },
      onError: (err) => {
        // BE trả 422 với errors[0].path = 'ticketId' | 'assignedTo' khi ticket
        // đã không còn khả dụng (cancelled / ended / already assigned). Trường
        // hợp này race với listener `ticket.broadcast.removed` chưa kịp fire —
        // tự back ra list ngay thay vì để user retry vô ích.
        const ex = extractApiError(err)
        const errPath = ex.errors[0]?.path
        const isStale =
          ex.statusCode === 422 && (errPath === 'ticketId' || errPath === 'assignedTo')
        const message = getErrorMessage(err, 'Tiếp nhận thất bại')
        if (isStale) {
          showToast.error({ message })
          if (router.canGoBack()) router.back()
          return
        }
        showToast.error({ message })
      },
    })
  }

  const handleCreatePrescription = (body: CreatePrescriptionBody) => {
    createPrescription(body, {
      onSuccess: () => {
        setRxModalVisible(false)
        showToast.success({ message: 'Đã kê đơn thuốc thành công!' })
        refetchRx()
      },
      onError: (err) => showToast.error({ message: getErrorMessage(err, 'Kê đơn thất bại') }),
    })
  }

  if (isLoading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        <TopBar title='Chi tiết sự cố' />
        <View style={styles.body}>
          <ActivityIndicator style={{ marginTop: 40 }} color='#15803D' />
        </View>
      </SafeAreaView>
    )
  }

  if (isError || !data) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        <TopBar title='Chi tiết sự cố' />
        <View style={styles.body}>
          <EmptyState message='Không thể tải thông tin sự cố.' />
        </View>
      </SafeAreaView>
    )
  }

  const metaParts = [data.zone?.name, data.farm?.name].filter(Boolean)

  // F10 — withdrawal warning từ prescription items (nếu BE trả withdrawalPeriodDays)
  const withdrawalWarnings = prescriptions
    .flatMap((p: any) => p.items ?? [])
    .filter((item: any) => item.withdrawalPeriodDays > 0)

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <TopBar title='Chi tiết sự cố' />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handlePullRefresh} tintColor='#15803D' />}
      >
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Thông tin</Text>
          <IncidentInfoList ticket={data} isDoctor={isDoctor} />
        </View>

        <View style={styles.card}>
          <Text style={styles.title} numberOfLines={2}>{data.title}</Text>
          {metaParts.length > 0 && (
            <Text style={styles.titleMeta}>{metaParts.join(' · ')}</Text>
          )}
          {data.isAiResolved ? (
            <View style={styles.aiResolvedBanner}>
              <MaterialIcons name='auto-awesome' size={14} color='#7C3AED' />
              <Text style={styles.aiResolvedText}>
                Đã giải quyết bằng AI
                {data.aiResolvedAt ? ` lúc ${dayjs(data.aiResolvedAt).format('DD/MM HH:mm')}` : ''}
              </Text>
            </View>
          ) : null}
          {timeLeft !== null && (
            <View style={styles.timerBanner}>
              <View style={styles.timerRow}>
                <MaterialIcons name='hourglass-bottom' size={16} color='#6B7280' />
                <Text style={styles.timerText}>
                  Còn lại: {formatCountdown(timeLeft)}
                </Text>
                <Pressable
                  onPress={() => setShowSlaInfo((v) => !v)}
                  hitSlop={10}
                  style={({ pressed }) => pressed && { opacity: 0.5 }}
                >
                  <MaterialIcons name='help-outline' size={16} color='#9CA3AF' />
                </Pressable>
              </View>
              {showSlaInfo && (
                <Text style={styles.slaInfoText}>
                  Thời gian còn lại để xử lý sự cố theo cam kết (SLA). Quá hạn có thể ảnh hưởng đến điểm chất lượng của bạn.
                </Text>
              )}
            </View>
          )}

          <View style={styles.divider} />
          <Text style={styles.cardLabel}>Mô tả</Text>
          <Text style={styles.description}>{data.description}</Text>

          {data.attachments.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.cardLabel}>Ảnh đính kèm</Text>
              <View style={styles.attachRow}>
                {data.attachments.map((att) => (
                  <TouchableOpacity key={att.id} onPress={() => setPreviewUrl(att.url)} activeOpacity={0.8}>
                    <Image source={{ uri: att.url }} style={styles.attachThumb} />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* F10 — withdrawal warning banner */}
        {withdrawalWarnings.length > 0 && (
          <View style={styles.withdrawalBanner}>
            <Text style={styles.withdrawalText}>
              ⚠️ Thuốc trong đơn có thời gian ngừng thuốc trước thu hoạch. Vui lòng tuân thủ hướng dẫn của bác sĩ.
            </Text>
          </View>
        )}

        {isAiProcessing && ticketFullQuery.data?.solution?.source !== 'AI' && (
          <AiProcessingBanner />
        )}

        {ticketFullQuery.data?.solution?.source === 'AI' && (
          <AiSolutionSection solution={ticketFullQuery.data.solution} />
        )}

        {/* AI-resolved ticket có thể chỉ tư vấn không kê đơn (xem BE doc C1
           edge case). Trong case này, AiSolutionSection đã hiển thị đầy đủ —
           ẩn PrescriptionSection để tránh card "Chưa có đơn thuốc" gây nhiễu. */}
        {status !== 'open' &&
          !(
            ticketFullQuery.data?.solution?.source === 'AI' &&
            !rxLoading &&
            prescriptions.length === 0
          ) && (
            <PrescriptionSection
              prescriptions={prescriptions}
              isLoading={rxLoading}
              canPrescribe={false}
              onAdd={() => setRxModalVisible(true)}
              onPressItem={(rx) =>
                router.push({
                  pathname: '/(app)/incident/[id]/prescription',
                  params: { id, rxId: rx.id },
                })
              }
            />
          )}

        {/* Hiển thị các addendum đã thêm (cho cả doctor + farmer xem). */}
        {ticketFullQuery.data?.addenda && ticketFullQuery.data.addenda.length > 0 ? (
          <AddendaSection addenda={ticketFullQuery.data.addenda} />
        ) : null}

        {/* D3 — Addendum button for doctor after resolved */}
        {canAddAddendum && (
          <TouchableOpacity style={styles.addendumBtn} onPress={() => setAddendumVisible(true)}>
            <Text style={styles.addendumBtnText}>+ Thêm ghi chú bổ sung</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <IncidentFooterActions
        isClosed={isClosed}
        closedReason={status === 'cancelled' ? 'cancelled' : 'closed'}
        canAccept={canAccept}
        canClose={canClose}
        canChat={isAssignee || !isDoctor}
        waitingForDoctor={!isDoctor && !data.assignee}
        isDoctor={isDoctor}
        isAccepting={isAccepting}
        onAccept={handleAcceptIncident}
        onOpenChat={() => router.push(`/(app)/incident/${id}/chat`)}
        canCancel={canCancel}
        isCancelling={isCancelling}
        onCancel={handleCancel}
        onClose={() => setCloseModalVisible(true)}
        canResolve={canResolve}
        onResolve={() => router.push(`/(app)/incident/${id}/resolve`)}
        canDelete={canDelete}
        isDeleting={isDeleting}
        onDelete={handleDelete}
      />

      <Modal visible={!!previewUrl} transparent animationType='fade' onRequestClose={() => setPreviewUrl(null)}>
        <Pressable style={styles.previewOverlay} onPress={() => setPreviewUrl(null)}>
          {previewUrl && (
            <Image source={{ uri: previewUrl }} style={styles.previewImg} resizeMode='contain' />
          )}
        </Pressable>
      </Modal>

      <CloseRateModal
        visible={closeModalVisible}
        isClosing={isClosing}
        isRating={isRating}
        onClose={() => setCloseModalVisible(false)}
        onSubmit={handleCloseSubmit}
      />

      <PrescriptionModal
        visible={rxModalVisible}
        onClose={() => setRxModalVisible(false)}
        onSubmit={handleCreatePrescription}
        isPending={isCreatingRx}
      />

      {/* D3 — Addendum modal for doctor */}
      <BottomSheet visible={addendumVisible} onClose={() => setAddendumVisible(false)}>
        <BottomSheet.Header title='Thêm ghi chú bổ sung' onClose={() => setAddendumVisible(false)} />
        <View style={styles.addendumBody}>
          <TextField
            label='Nội dung ghi chú'
            value={addendumContent}
            onChangeText={setAddendumContent}
            multiline
            numberOfLines={4}
            showClear={false}
          />
          <PrimaryButton
            title='Gửi ghi chú'
            onPress={handleAddAddendum}
            loading={isAddingAddendum}
            disabled={!addendumContent.trim() || isAddingAddendum}
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  body: { flex: 1, backgroundColor: '#F3F4F6' },
  bodyContent: { padding: 16, paddingBottom: 24, gap: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  title: { fontSize: 20, lineHeight: 28, color: '#111827', fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  titleMeta: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular', marginBottom: 10 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 12 },
  cardLabel: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_500Medium', marginBottom: 8 },
  description: { fontSize: 15, color: '#374151', fontFamily: 'Inter_400Regular', lineHeight: 22 },
  section: { gap: 6 },
  sectionLabel: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_500Medium' },

  attachRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  attachThumb: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#F3F4F6' },

  timerBanner: {
    marginBottom: 12,
  },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slaInfoText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
    marginTop: 6,
  },
  timerText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#6B7280' },

  aiResolvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    marginBottom: 12,
  },
  aiResolvedText: {
    fontSize: 12,
    color: '#5B21B6',
    fontFamily: 'Inter_500Medium',
  },

  withdrawalBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  withdrawalText: { fontSize: 13, color: '#DC2626', fontFamily: 'Inter_500Medium', lineHeight: 18 },

  previewOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center', alignItems: 'center',
  },
  previewImg: { width: '100%', height: '80%' },

  addendumBtn: {
    paddingVertical: 12, backgroundColor: '#fff',
    borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed',
  },
  addendumBtnText: { fontSize: 14, color: '#15803D', fontFamily: 'Inter_500Medium' },
  addendumBody: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
})
