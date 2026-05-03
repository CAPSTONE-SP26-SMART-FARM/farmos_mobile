import {
  View, ScrollView, ActivityIndicator, StyleSheet, RefreshControl,
  Image, TouchableOpacity, Modal, Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useState } from 'react'
import { Text, EmptyState, TopBar } from '@/components/ui'
import { usePrescriptions, useCreatePrescription } from '@/hooks/usePrescription'
import { useAcceptIncident, useDoctorIncidentDetail } from '@/hooks/useDoctor'
import { useIncidentDetail, useCancelIncident } from '@/hooks/useIncident'
import { useActiveTicketCategories } from '@/hooks/useTicketCategory'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { SEVERITY_META } from '@/constants/incident'
import { IncidentStatusBadge } from '@/components/features/incident/IncidentStatusBadge'
import { PrescriptionModal } from '@/components/features/incident/PrescriptionModal'
import { PrescriptionSection } from '@/components/features/incident/PrescriptionSection'
import { IncidentInfoList } from '@/components/features/incident/IncidentInfoList'
import { IncidentFooterActions } from '@/components/features/incident/IncidentFooterActions'
import { getErrorMessage } from '@/utils/error'
import type { CreatePrescriptionBody } from '@/types/prescription'

const CLOSED_STATUSES = ['resolved', 'closed', 'cancelled'] as const
const PRESCRIBABLE_STATUSES = ['assigned', 'in_progress'] as const
const SOURCE_LABEL: Record<string, string> = {
  SUBSCRIPTION_GRANT: 'Từ gói',
  PURCHASED: 'Mua lẻ',
}

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const isDoctor = user?.role === 'doctor'
  const [rxModalVisible, setRxModalVisible] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { data: categories = [] } = useActiveTicketCategories(!isDoctor)
  const { mutate: cancelIncident, isPending: isCancelling } = useCancelIncident()

  const farmerQuery = useIncidentDetail(id)
  const doctorQuery = useDoctorIncidentDetail(id)
  const { data, isLoading, isError, refetch } = isDoctor ? doctorQuery : farmerQuery

  const { data: rxData, isLoading: rxLoading, refetch: refetchRx } = usePrescriptions(id)
  const { mutate: acceptIncident, isPending: isAccepting } = useAcceptIncident()
  const { mutate: createPrescription, isPending: isCreatingRx } = useCreatePrescription(id)
  const prescriptions = rxData?.data ?? []

  const refreshAll = useCallback(() => {
    refetch()
    refetchRx()
  }, [refetch, refetchRx])

  useFocusEffect(refreshAll)

  // Tách pull-to-refresh state ra khỏi background isFetching để spinner không stuck
  // khi useFocusEffect gọi refetch lúc back từ chat về.
  const [isRefreshing, setIsRefreshing] = useState(false)
  const handlePullRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try { await Promise.all([refetch(), refetchRx()]) } finally { setIsRefreshing(false) }
  }, [refetch, refetchRx])

  const status = data?.status ?? ''
  const isAssignee = isDoctor && data?.assignee?.id === user?.id
  const isCreator = !isDoctor && data?.creator?.id === user?.id
  const canAccept = isDoctor && status === 'open' && !data?.assignee
  const canPrescribe = isAssignee && PRESCRIBABLE_STATUSES.includes(status as any)
  const isClosed = CLOSED_STATUSES.includes(status as any)
  const canCancel = isCreator && status === 'open'

  const categoryName = data?.categoryConfigId
    ? categories.find((c) => c.id === data.categoryConfigId)?.name
    : undefined

  const handleCancel = () => {
    cancelIncident(
      { ticketId: id },
      {
        onSuccess: () => {
          showToast.success({ message: 'Đã hủy sự cố' })
          router.back()
        },
        onError: (err) => showToast.error({ message: getErrorMessage(err, 'Hủy thất bại') }),
      }
    )
  }

  const handleAcceptIncident = () => {
    acceptIncident(id, {
      onSuccess: () => {
        showToast.success({ message: 'Tiếp nhận sự cố thành công!' })
        refetch()
      },
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

        {status !== 'open' && (
          <PrescriptionSection
            prescriptions={prescriptions}
            isLoading={rxLoading}
            canPrescribe={canPrescribe}
            onAdd={() => setRxModalVisible(true)}
          />
        )}
      </ScrollView>

      <IncidentFooterActions
        isClosed={isClosed}
        canAccept={canAccept}
        canChat={isAssignee || !isDoctor}
        waitingForDoctor={!isDoctor && !data.assignee}
        isDoctor={isDoctor}
        isAccepting={isAccepting}
        onAccept={handleAcceptIncident}
        onOpenChat={() => router.push(`/(app)/incident/${id}/chat`)}
        canCancel={canCancel}
        isCancelling={isCancelling}
        onCancel={handleCancel}
      />

      <Modal visible={!!previewUrl} transparent animationType='fade' onRequestClose={() => setPreviewUrl(null)}>
        <Pressable style={styles.previewOverlay} onPress={() => setPreviewUrl(null)}>
          {previewUrl && (
            <Image source={{ uri: previewUrl }} style={styles.previewImg} resizeMode='contain' />
          )}
        </Pressable>
      </Modal>

      <PrescriptionModal
        visible={rxModalVisible}
        onClose={() => setRxModalVisible(false)}
        onSubmit={handleCreatePrescription}
        isPending={isCreatingRx}
      />
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
  badges: { flexDirection: 'row', gap: 8, marginBottom: 16 },
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

  previewOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center', alignItems: 'center',
  },
  previewImg: { width: '100%', height: '80%' },
})
