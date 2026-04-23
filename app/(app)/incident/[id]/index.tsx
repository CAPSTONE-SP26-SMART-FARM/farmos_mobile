import {
  View, ScrollView, ActivityIndicator, StyleSheet, RefreshControl, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useState } from 'react'
import { Text, TopBar, EmptyState } from '@/components/ui'
import { usePrescriptions, useCreatePrescription } from '@/hooks/usePrescription'
import { useAcceptIncident, useDoctorIncidentDetail } from '@/hooks/useDoctor'
import { useIncidentDetail, useEndIncident } from '@/hooks/useIncident'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { SEVERITY_META, STATUS_META } from '@/constants/incident'
import { PrescriptionModal } from '@/components/features/incident/PrescriptionModal'
import { PrescriptionSection } from '@/components/features/incident/PrescriptionSection'
import { IncidentInfoList } from '@/components/features/incident/IncidentInfoList'
import { IncidentFooterActions } from '@/components/features/incident/IncidentFooterActions'
import { getErrorMessage } from '@/utils/error'
import type { CreatePrescriptionBody } from '@/types/prescription'

const CLOSED_STATUSES = ['resolved', 'closed', 'cancelled'] as const
const PRESCRIBABLE_STATUSES = ['assigned', 'in_progress'] as const

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const isDoctor = user?.role === 'doctor'
  const [rxModalVisible, setRxModalVisible] = useState(false)

  const farmerQuery = useIncidentDetail(id)
  const doctorQuery = useDoctorIncidentDetail(id)
  const { data, isLoading, isError, refetch, isFetching } = isDoctor ? doctorQuery : farmerQuery

  const { data: rxData, isLoading: rxLoading, refetch: refetchRx } = usePrescriptions(id)
  const { mutate: acceptIncident, isPending: isAccepting } = useAcceptIncident()
  const { mutate: createPrescription, isPending: isCreatingRx } = useCreatePrescription(id)
  const { mutate: endIncident, isPending: isEnding } = useEndIncident()
  const prescriptions = rxData?.data ?? []

  const refreshAll = useCallback(() => {
    refetch()
    refetchRx()
  }, [refetch, refetchRx])

  useFocusEffect(refreshAll)

  const status = data?.status ?? ''
  const isAssignee = isDoctor && data?.assignee?.id === user?.id
  const isFarmerCreator = !isDoctor && data?.creator?.id === user?.id
  const canAccept = isDoctor && status === 'open' && !data?.assignee
  const canPrescribe = isAssignee && PRESCRIBABLE_STATUSES.includes(status as any)
  const canResolve = isFarmerCreator && PRESCRIBABLE_STATUSES.includes(status as any)
  const isClosed = CLOSED_STATUSES.includes(status as any)

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <TopBar />
        <ActivityIndicator style={{ marginTop: 40 }} color='#2463EB' />
      </SafeAreaView>
    )
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <TopBar />
        <EmptyState message='Không thể tải thông tin sự cố.' />
      </SafeAreaView>
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

  const handleResolveIncident = () => {
    Alert.alert(
      'Đánh dấu đã giải quyết?',
      'Sự cố sẽ được đóng. Bạn không thể trao đổi thêm với bác sĩ sau khi đóng.',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xác nhận',
          style: 'destructive',
          onPress: () => endIncident(id, {
            onSuccess: () => {
              showToast.success({ message: 'Đã đánh dấu sự cố là đã giải quyết.' })
              refetch()
            },
            onError: (err) => showToast.error({ message: getErrorMessage(err, 'Không thể đóng sự cố') }),
          }),
        },
      ]
    )
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

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refreshAll} tintColor='#2463EB' />}
      >
        <Text style={styles.ticketNum}>{data.ticketNumber}</Text>
        <Text style={styles.title}>{data.title}</Text>

        <View style={styles.badges}>
          {[SEVERITY_META[data.severity], STATUS_META[data.status]].map((meta, i) => (
            <View key={i} style={[styles.badge, { backgroundColor: meta.bg }]}>
              <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Mô tả</Text>
        <Text style={styles.description}>{data.description}</Text>

        <Text style={styles.sectionTitle}>Thông tin</Text>
        <IncidentInfoList ticket={data} isDoctor={isDoctor} />

        <PrescriptionSection
          prescriptions={prescriptions}
          isLoading={rxLoading}
          canPrescribe={canPrescribe}
          onAdd={() => setRxModalVisible(true)}
        />
      </ScrollView>

      <IncidentFooterActions
        isClosed={isClosed}
        canAccept={canAccept}
        canChat={isAssignee || !isDoctor}
        canResolve={canResolve}
        waitingForDoctor={!isDoctor && !data.assignee}
        isAccepting={isAccepting}
        isEnding={isEnding}
        onAccept={handleAcceptIncident}
        onOpenChat={() => router.push(`/(app)/incident/${id}/chat`)}
        onResolve={handleResolveIncident}
      />

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
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20, paddingBottom: 32 },
  ticketNum: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginBottom: 6 },
  title: { fontSize: 20, color: '#111827', fontFamily: 'Inter_700Bold', marginBottom: 12 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  sectionTitle: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_600SemiBold', marginBottom: 8, marginTop: 20 },
  description: { fontSize: 15, color: '#374151', fontFamily: 'Inter_400Regular', lineHeight: 22 },
})
