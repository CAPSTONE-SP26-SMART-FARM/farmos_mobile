import {
  View, ScrollView, ActivityIndicator, StyleSheet, RefreshControl,
  Image, TouchableOpacity, Modal, Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Text, EmptyState, TopBar, BottomSheet, PrimaryButton, TextField } from '@/components/ui'
import { usePrescriptions, useCreatePrescription } from '@/hooks/usePrescription'
import { useAcceptIncident, useDoctorIncidentDetail } from '@/hooks/useDoctor'
import { useIncidentDetail, useCancelIncident } from '@/hooks/useIncident'
import { useActiveTicketCategories } from '@/hooks/useTicketCategory'
import { useCloseTicket, useRateTicket, useAbandonResolution, useTicketFull } from '@/hooks/useTicketLifecycle'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { SEVERITY_META } from '@/constants/incident'
import { socketService } from '@/services/socket/socketService'
import { useActiveTicketStore } from '@/stores/activeTicketStore'
import { queryKeys } from '@/constants/queryKeys'
import { IncidentStatusBadge } from '@/components/features/incident/IncidentStatusBadge'
import { PrescriptionModal } from '@/components/features/incident/PrescriptionModal'
import { PrescriptionSection } from '@/components/features/incident/PrescriptionSection'
import { AiSolutionSection } from '@/components/features/incident/AiSolutionSection'
import { IncidentInfoList } from '@/components/features/incident/IncidentInfoList'
import { IncidentFooterActions } from '@/components/features/incident/IncidentFooterActions'
import { CloseRateModal } from '@/components/features/incident/CloseRateModal'
import { AbandonModal } from '@/components/features/incident/AbandonModal'
import { useAddAddendum } from '@/hooks/useTicketLifecycle'
import type { AddAddendumBody } from '@/types/medicine'
import { getErrorMessage } from '@/utils/error'
import type { CreatePrescriptionBody } from '@/types/prescription'
import type { AbandonResolution } from '@/types/ticketLifecycle'

const CLOSED_STATUSES = ['closed', 'cancelled'] as const
const PRESCRIBABLE_STATUSES = ['assigned', 'in_progress'] as const

const INACTIVITY_LIMIT_MS: Record<string, number> = {
  critical: 60 * 60 * 1000,
  high: 45 * 60 * 1000,
  medium: 30 * 60 * 1000,
  low: 30 * 60 * 1000,
}

function formatCountdown(ms: number) {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const SOURCE_LABEL: Record<string, string> = {
  SUBSCRIPTION_GRANT: 'Từ gói',
  PURCHASED: 'Mua lẻ',
}

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const qc = useQueryClient()
  const isDoctor = user?.role === 'doctor'

  const [rxModalVisible, setRxModalVisible] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [closeModalVisible, setCloseModalVisible] = useState(false)
  const [abandonModalVisible, setAbandonModalVisible] = useState(false)
  const [addendumVisible, setAddendumVisible] = useState(false)
  const [addendumContent, setAddendumContent] = useState('')
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  const { data: categories = [] } = useActiveTicketCategories(!isDoctor)
  const { mutate: cancelIncident, isPending: isCancelling } = useCancelIncident()
  const { mutate: closeTicket, isPending: isClosing } = useCloseTicket(id)
  const { mutate: rateTicket, isPending: isRating } = useRateTicket(id)
  const { mutate: abandonResolution, isPending: isAbandoning } = useAbandonResolution(id)
  const { mutate: addAddendum, isPending: isAddingAddendum } = useAddAddendum(id)

  // Chỉ chạy 1 query theo role — tránh duplicate API call (cả 2 đều gọi /tickets/:id v2)
  const farmerQuery = useIncidentDetail(isDoctor ? '' : id)
  const doctorQuery = useDoctorIncidentDetail(isDoctor ? id : '')
  const { data, isLoading, isError, refetch } = isDoctor ? doctorQuery : farmerQuery

  // Farmer-only: gọi /full để đọc pendingFallbackChoice — auto-open AbandonModal nếu
  // owner mở screen mà worker đã reset ticket (offline → mất WS event).
  const ticketFullQuery = useTicketFull(id, !isDoctor)
  useEffect(() => {
    if (!isDoctor && ticketFullQuery.data?.pendingFallbackChoice) {
      setAbandonModalVisible(true)
    }
  }, [isDoctor, ticketFullQuery.data?.pendingFallbackChoice])

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

  // Subscribe ticket and setup WS listeners
  useEffect(() => {
    if (data?.id) {
      socketService.subscribeTicket(data.id)
    }
  }, [data?.id])

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

    const onResolved = onlyThisTicket(() => {
      invalidateDetail()
      qc.invalidateQueries({ queryKey: queryKeys.prescriptions.list(id) })
      showToast.success({ message: 'Sự cố đã được giải quyết' })
    })
    const onClosed = onlyThisTicket(invalidateDetail)
    const onAiResolved = onlyThisTicket(() => {
      invalidateDetail()
      showToast.success({ message: 'AI đã xử lý xong sự cố' })
    })
    const onAbandonRefunded = onlyThisTicket(() => {
      invalidateDetail()
      showToast.success({ message: 'Sự cố đã được hoàn lại' })
    })
    // Open AbandonModal khi nhận fallback offer / required (cũ).
    // Detail screen dùng modal có context, list screen dùng native Alert (xem incidents.tsx).
    const openAbandonModal = onlyThisTicket(() => {
      setAbandonModalVisible(true)
      qc.invalidateQueries({ queryKey: queryKeys.ticketFull(id) })
    })

    const listeners = [
      ['ticket.resolved', onResolved],
      ['ticket.fallback-required', openAbandonModal],
      ['ticket.closed', onClosed],
      ['ticket.ai.resolved', onAiResolved],
      ['ticket.ai.fallback.offered', openAbandonModal],
      ['ticket.abandon.refunded', onAbandonRefunded],
    ] as const

    listeners.forEach(([event, handler]) => socketService.on(event, handler))
    return () => listeners.forEach(([event, handler]) => socketService.off(event, handler))
  }, [id, qc, showToast])

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
  const canPrescribe = isAssignee && PRESCRIBABLE_STATUSES.includes(status as any)
  const isClosed = CLOSED_STATUSES.includes(status as any)
  const canCancel = isCreator && status === 'open'
  const canClose = isCreator && status === 'resolved'
  const canResolve = isAssignee && PRESCRIBABLE_STATUSES.includes(status as any)
  const canAddAddendum = isAssignee && (status === 'resolved' || status === 'closed')

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

  const categoryName = data?.categoryConfigId
    ? categories.find((c) => c.id === data.categoryConfigId)?.name
    : undefined

  const handleCancel = () => {
    cancelIncident(
      { ticketId: id },
      {
        onSuccess: () => { showToast.success({ message: 'Đã hủy sự cố' }); router.back() },
        onError: (err) => showToast.error({ message: getErrorMessage(err, 'Hủy thất bại') }),
      }
    )
  }

  const handleCloseSubmit = (stars: number, feedback: string) => {
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
              onError: () => {
                showToast.success({ message: 'Đã đóng sự cố' })
                setCloseModalVisible(false)
              },
            }
          )
        } else {
          showToast.success({ message: 'Đã đóng sự cố' })
          setCloseModalVisible(false)
        }
      },
      onError: (err) => showToast.error({ message: getErrorMessage(err, 'Đóng sự cố thất bại') }),
    })
  }

  const handleAbandon = (resolution: AbandonResolution) => {
    abandonResolution(
      { resolution },
      {
        onSuccess: () => {
          setAbandonModalVisible(false)
          showToast.success({
            message: resolution === 'FALLBACK_AI' ? 'Đã chuyển sang AI xử lý' : 'Đã hoàn ticket',
          })
        },
        onError: (err) => showToast.error({ message: getErrorMessage(err, 'Thao tác thất bại') }),
      }
    )
  }

  const handleAcceptIncident = () => {
    acceptIncident(id, {
      onSuccess: () => { showToast.success({ message: 'Tiếp nhận sự cố thành công!' }); refetch() },
      onError: (err) => showToast.error({ message: getErrorMessage(err, 'Tiếp nhận thất bại') }),
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
          <ActivityIndicator style={{ marginTop: 40 }} color='#2463EB' />
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
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handlePullRefresh} tintColor='#2463EB' />}
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
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: SEVERITY_META[data.severity].bg }]}>
              <Text style={[styles.badgeText, { color: SEVERITY_META[data.severity].color }]}>
                {SEVERITY_META[data.severity].label}
              </Text>
            </View>
            <IncidentStatusBadge status={data.status} />
            {categoryName ? (
              <View style={styles.badgeCategory}>
                <Text style={styles.badgeCategoryText}>{categoryName}</Text>
              </View>
            ) : null}
            {data.source && SOURCE_LABEL[data.source] ? (
              <View style={styles.badgeSource}>
                <Text style={styles.badgeSourceText}>{SOURCE_LABEL[data.source]}</Text>
              </View>
            ) : null}
          </View>
          {timeLeft !== null && (
            <View style={[styles.timerBanner, timeLeft < 10 * 60 * 1000 && styles.timerBannerUrgent]}>
              <Text style={[styles.timerText, timeLeft < 10 * 60 * 1000 && styles.timerTextUrgent]}>
                ⏱  Còn lại: {formatCountdown(timeLeft)}
              </Text>
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

        {ticketFullQuery.data?.solution?.source === 'AI' && (
          <AiSolutionSection solution={ticketFullQuery.data.solution} />
        )}

        {status !== 'open' && (
          <PrescriptionSection
            prescriptions={prescriptions}
            isLoading={rxLoading}
            canPrescribe={false}
            onAdd={() => setRxModalVisible(true)}
            onPressItem={() => router.push(`/(app)/incident/${id}/prescription`)}
          />
        )}

        {/* D3 — Addendum button for doctor after resolved */}
        {canAddAddendum && (
          <TouchableOpacity style={styles.addendumBtn} onPress={() => setAddendumVisible(true)}>
            <Text style={styles.addendumBtnText}>+ Thêm ghi chú bổ sung</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <IncidentFooterActions
        isClosed={isClosed}
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

      <AbandonModal
        visible={abandonModalVisible}
        isPending={isAbandoning}
        onClose={() => setAbandonModalVisible(false)}
        onSelect={handleAbandon}
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
  badges: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 12 },
  cardLabel: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_500Medium', marginBottom: 8 },
  description: { fontSize: 15, color: '#374151', fontFamily: 'Inter_400Regular', lineHeight: 22 },
  section: { gap: 6 },
  sectionLabel: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_500Medium' },

  badgeCategory: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F3F4F6' },
  badgeCategoryText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#374151' },
  badgeSource: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#ECFDF5' },
  badgeSourceText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#059669' },

  attachRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  attachThumb: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#F3F4F6' },

  timerBanner: {
    marginBottom: 12,
  },
  timerBannerUrgent: {},
  timerText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#059669' },
  timerTextUrgent: { color: '#D97706' },

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
  addendumBtnText: { fontSize: 14, color: '#2463EB', fontFamily: 'Inter_500Medium' },
  addendumBody: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
})
